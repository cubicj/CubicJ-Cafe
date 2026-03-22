import { cleanTables } from '../helpers/db'
import { createUser, createAdminUser, createQueueRequest } from '../helpers/fixtures'
import { queueService } from '@/lib/database/queue'
import { prisma } from '@/lib/database/prisma'
import { QueueStatus } from '@prisma/client'

beforeEach(async () => {
  await cleanTables()
})

describe('QueueService', () => {
  describe('createRequest', () => {
    it('creates a PENDING request with auto-incrementing position', async () => {
      const user = await createUser()

      const id1 = await queueService.createRequest({
        userId: user.id,
        nickname: user.nickname,
        prompt: 'first',
      })
      const id2 = await queueService.createRequest({
        userId: user.id,
        nickname: user.nickname,
        prompt: 'second',
      })

      const req1 = await prisma.queueRequest.findUnique({ where: { id: id1 } })
      const req2 = await prisma.queueRequest.findUnique({ where: { id: id2 } })

      expect(req1!.status).toBe(QueueStatus.PENDING)
      expect(req2!.status).toBe(QueueStatus.PENDING)
      expect(req2!.position).toBeGreaterThan(req1!.position)
    })

    it('throws when user already has 2 active requests', async () => {
      const user = await createUser()

      await createQueueRequest(user.id, { position: 1 })
      await createQueueRequest(user.id, { position: 2 })

      await expect(
        queueService.createRequest({
          userId: user.id,
          nickname: user.nickname,
          prompt: 'third',
        })
      ).rejects.toThrow('이미 2개')
    })

    it('allows new request when previous ones are completed/cancelled/failed', async () => {
      const user = await createUser()

      await createQueueRequest(user.id, { position: 1, status: QueueStatus.COMPLETED })
      await createQueueRequest(user.id, { position: 2, status: QueueStatus.CANCELLED })
      await createQueueRequest(user.id, { position: 3, status: QueueStatus.FAILED })

      const id = await queueService.createRequest({
        userId: user.id,
        nickname: user.nickname,
        prompt: 'new one',
      })

      expect(id).toBeDefined()
    })
  })

  describe('getQueueList', () => {
    it('returns empty array when no pending/processing requests', async () => {
      const list = await queueService.getQueueList()
      expect(list).toEqual([])
    })

    it('returns requests ordered by status (PROCESSING first) then position', async () => {
      const user = await createUser()

      await createQueueRequest(user.id, { position: 1, status: QueueStatus.PENDING, prompt: 'pending1' })
      await createQueueRequest(user.id, { position: 2, status: QueueStatus.PROCESSING, prompt: 'processing1' })
      await createQueueRequest(user.id, { position: 3, status: QueueStatus.PENDING, prompt: 'pending2' })

      const list = await queueService.getQueueList()

      expect(list).toHaveLength(3)
      expect(list[0].status).toBe(QueueStatus.PROCESSING)
      expect(list[1].prompt).toBe('pending1')
      expect(list[2].prompt).toBe('pending2')
    })

    it('does not return COMPLETED/FAILED/CANCELLED requests', async () => {
      const user = await createUser()

      await createQueueRequest(user.id, { position: 1, status: QueueStatus.COMPLETED })
      await createQueueRequest(user.id, { position: 2, status: QueueStatus.FAILED })
      await createQueueRequest(user.id, { position: 3, status: QueueStatus.CANCELLED })
      await createQueueRequest(user.id, { position: 4, status: QueueStatus.PENDING })

      const list = await queueService.getQueueList()

      expect(list).toHaveLength(1)
      expect(list[0].status).toBe(QueueStatus.PENDING)
    })
  })

  describe('cancelRequest', () => {
    it('cancels own pending request', async () => {
      const user = await createUser()
      const req = await createQueueRequest(user.id, { status: QueueStatus.PENDING })

      const result = await queueService.cancelRequest(req.id, user.id)

      expect(result.status).toBe(QueueStatus.CANCELLED)
    })

    it('cancels own processing request', async () => {
      const user = await createUser()
      const req = await createQueueRequest(user.id, { status: QueueStatus.PROCESSING })

      const result = await queueService.cancelRequest(req.id, user.id)

      expect(result.status).toBe(QueueStatus.CANCELLED)
    })

    it('throws when non-admin tries to cancel another user request', async () => {
      const owner = await createUser()
      const other = await createUser({ discordId: 'other-456', discordUsername: 'other', nickname: 'Other' })
      const req = await createQueueRequest(owner.id, { status: QueueStatus.PENDING })

      await expect(
        queueService.cancelRequest(req.id, other.id)
      ).rejects.toThrow('취소')
    })

    it('admin can cancel any user request', async () => {
      const owner = await createUser()
      const admin = await createAdminUser()
      const req = await createQueueRequest(owner.id, { status: QueueStatus.PENDING })

      const result = await queueService.cancelRequest(req.id, admin.id, true)

      expect(result.status).toBe(QueueStatus.CANCELLED)
    })

    it('throws when trying to cancel a completed request', async () => {
      const user = await createUser()
      const req = await createQueueRequest(user.id, { status: QueueStatus.COMPLETED })

      await expect(
        queueService.cancelRequest(req.id, user.id)
      ).rejects.toThrow('취소')
    })

    it('throws when trying to cancel an already cancelled request', async () => {
      const user = await createUser()
      const req = await createQueueRequest(user.id, { status: QueueStatus.CANCELLED })

      await expect(
        queueService.cancelRequest(req.id, user.id)
      ).rejects.toThrow('취소')
    })
  })

  describe('getAndClaimNextPendingRequest', () => {
    it('atomically claims the first pending request', async () => {
      const user = await createUser()
      await createQueueRequest(user.id, { position: 1, status: QueueStatus.PENDING })

      const claimed = await queueService.getAndClaimNextPendingRequest()

      expect(claimed).not.toBeNull()
      expect(claimed!.status).toBe(QueueStatus.PROCESSING)
      expect(claimed!.startedAt).toBeTruthy()
    })

    it('returns null when no pending requests exist', async () => {
      const result = await queueService.getAndClaimNextPendingRequest()
      expect(result).toBeNull()
    })

    it('claims by position order (lowest position first)', async () => {
      const user = await createUser()
      await createQueueRequest(user.id, { position: 5, prompt: 'later' })
      await createQueueRequest(user.id, { position: 2, prompt: 'first' })

      const claimed = await queueService.getAndClaimNextPendingRequest()

      expect(claimed!.prompt).toBe('first')
      expect(claimed!.position).toBe(2)
    })
  })

  describe('getQueueStats', () => {
    it('returns correct counts for pending, processing, todayCompleted', async () => {
      const user = await createUser()

      await createQueueRequest(user.id, { position: 1, status: QueueStatus.PENDING })
      await createQueueRequest(user.id, { position: 2, status: QueueStatus.PROCESSING })

      const completed = await createQueueRequest(user.id, { position: 3, status: QueueStatus.COMPLETED })
      await prisma.queueRequest.update({
        where: { id: completed.id },
        data: { completedAt: new Date() },
      })
      queueService.invalidateCache()

      const stats = await queueService.getQueueStats()

      expect(stats.pending).toBe(1)
      expect(stats.processing).toBe(1)
      expect(stats.todayCompleted).toBe(1)
      expect(stats.total).toBe(2)
    })

    it('todayCompleted only counts requests completed today', async () => {
      const user = await createUser()

      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const oldReq = await createQueueRequest(user.id, { position: 1, status: QueueStatus.COMPLETED })
      await prisma.queueRequest.update({
        where: { id: oldReq.id },
        data: { completedAt: yesterday },
      })

      const todayReq = await createQueueRequest(user.id, { position: 2, status: QueueStatus.COMPLETED })
      await prisma.queueRequest.update({
        where: { id: todayReq.id },
        data: { completedAt: new Date() },
      })
      queueService.invalidateCache()

      const stats = await queueService.getQueueStats()

      expect(stats.todayCompleted).toBe(1)
    })
  })

  describe('cache invalidation', () => {
    it('createRequest invalidates cache', async () => {
      const user = await createUser()

      const list1 = await queueService.getQueueList()
      expect(list1).toHaveLength(0)

      await queueService.createRequest({
        userId: user.id,
        nickname: user.nickname,
        prompt: 'new',
      })

      const list2 = await queueService.getQueueList()
      expect(list2).toHaveLength(1)
    })

    it('updateRequest invalidates cache', async () => {
      const user = await createUser()
      const req = await createQueueRequest(user.id, { position: 1, status: QueueStatus.PENDING })

      const list1 = await queueService.getQueueList()
      expect(list1).toHaveLength(1)

      await queueService.updateRequest(req.id, { status: QueueStatus.COMPLETED })

      const list2 = await queueService.getQueueList()
      expect(list2).toHaveLength(0)
    })

    it('cancelRequest invalidates cache', async () => {
      const user = await createUser()
      await createQueueRequest(user.id, { position: 1, status: QueueStatus.PENDING })

      const list1 = await queueService.getQueueList()
      expect(list1).toHaveLength(1)

      await queueService.cancelRequest(list1[0].id, user.id)

      const list2 = await queueService.getQueueList()
      expect(list2).toHaveLength(0)
    })
  })
})
