import { cleanTables } from '../../helpers/db'
import { createUser, createAdminUser } from '../../helpers/fixtures'
import { createTestSession, buildAuthenticatedRequest, buildRequest } from '../../helpers/auth'
import { prisma } from '@/lib/database/prisma'
import { QueueStatus } from '@prisma/client'
import { GET, POST } from '@/app/api/queue/route'

beforeEach(async () => {
  await cleanTables()
})

describe('GET /api/queue', () => {
  describe('action=list', () => {
    it('returns empty queue list', async () => {
      const req = buildRequest('/api/queue?action=list')
      const res = await GET(req)
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.data).toEqual([])
    })

    it('returns pending queue items', async () => {
      const user = await createUser()
      await prisma.queueRequest.create({
        data: {
          userId: user.id,
          nickname: user.nickname,
          prompt: 'test prompt',
          status: QueueStatus.PENDING,
          position: 1,
        },
      })

      const req = buildRequest('/api/queue?action=list')
      const res = await GET(req)
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.data).toHaveLength(1)
      expect(body.data[0].prompt).toBe('test prompt')
    })
  })

  describe('action=stats', () => {
    it('returns zeroed stats when queue is empty', async () => {
      const req = buildRequest('/api/queue?action=stats')
      const res = await GET(req)
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.data).toEqual({
        pending: 0,
        processing: 0,
        todayCompleted: 0,
        total: 0,
      })
    })
  })

  describe('action=user', () => {
    it('returns 401 when unauthenticated', async () => {
      const req = buildRequest('/api/queue?action=user')
      const res = await GET(req)

      expect(res.status).toBe(401)
    })

    it('returns user requests when authenticated', async () => {
      const user = await createUser()
      const session = await createTestSession(user.id)

      const req = buildAuthenticatedRequest('/api/queue?action=user', session.id)
      const res = await GET(req)
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.data).toEqual([])
    })
  })

  describe('invalid action', () => {
    it('returns 400 for unknown action', async () => {
      const req = buildRequest('/api/queue?action=invalid')
      const res = await GET(req)

      expect(res.status).toBe(400)
    })
  })
})

describe('POST /api/queue', () => {
  describe('action=cancel', () => {
    it('returns 401 when unauthenticated', async () => {
      const req = buildRequest('/api/queue', {
        method: 'POST',
        body: JSON.stringify({ action: 'cancel', requestId: 'fake-id' }),
        headers: { 'content-type': 'application/json' },
      })
      const res = await POST(req)

      expect(res.status).toBe(401)
    })

    it('cancels own pending request', async () => {
      const user = await createUser()
      const session = await createTestSession(user.id)
      const queueItem = await prisma.queueRequest.create({
        data: {
          userId: user.id,
          nickname: user.nickname,
          prompt: 'cancel me',
          status: QueueStatus.PENDING,
          position: 1,
        },
      })

      const req = buildAuthenticatedRequest('/api/queue', session.id, {
        method: 'POST',
        body: JSON.stringify({ action: 'cancel', requestId: queueItem.id }),
        headers: { 'content-type': 'application/json' },
      })
      const res = await POST(req)
      const body = await res.json()

      expect(res.status).toBe(200)

      const cancelled = await prisma.queueRequest.findUnique({ where: { id: queueItem.id } })
      expect(cancelled!.status).toBe(QueueStatus.CANCELLED)
    })

    it('rejects cancelling other user request as non-admin', async () => {
      const owner = await createUser()
      const other = await createUser({
        discordId: 'other-user-456',
        discordUsername: 'otheruser',
        nickname: 'OtherUser',
      })
      const session = await createTestSession(other.id)
      const queueItem = await prisma.queueRequest.create({
        data: {
          userId: owner.id,
          nickname: owner.nickname,
          prompt: 'not yours',
          status: QueueStatus.PENDING,
          position: 1,
        },
      })

      const req = buildAuthenticatedRequest('/api/queue', session.id, {
        method: 'POST',
        body: JSON.stringify({ action: 'cancel', requestId: queueItem.id }),
        headers: { 'content-type': 'application/json' },
      })
      const res = await POST(req)
      const body = await res.json()

      expect(res.status).toBe(500)
      expect(body.error).toContain('취소')
    })

    it('allows admin to cancel any request', async () => {
      const owner = await createUser()
      const admin = await createAdminUser()
      const session = await createTestSession(admin.id)
      const queueItem = await prisma.queueRequest.create({
        data: {
          userId: owner.id,
          nickname: owner.nickname,
          prompt: 'admin cancel',
          status: QueueStatus.PENDING,
          position: 1,
        },
      })

      const req = buildAuthenticatedRequest('/api/queue', session.id, {
        method: 'POST',
        body: JSON.stringify({ action: 'cancel', requestId: queueItem.id }),
        headers: { 'content-type': 'application/json' },
      })
      const res = await POST(req)
      const body = await res.json()

      expect(res.status).toBe(200)
    })
  })

  describe('invalid action', () => {
    it('returns 400 for unknown action', async () => {
      const user = await createUser()
      const session = await createTestSession(user.id)

      const req = buildAuthenticatedRequest('/api/queue', session.id, {
        method: 'POST',
        body: JSON.stringify({ action: 'unknown' }),
        headers: { 'content-type': 'application/json' },
      })
      const res = await POST(req)

      expect(res.status).toBe(400)
    })
  })
})
