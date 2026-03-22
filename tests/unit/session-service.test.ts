import { cleanTables } from '../helpers/db'
import { createUser } from '../helpers/fixtures'
import { createTestSession, createExpiredSession, buildRequest, buildAuthenticatedRequest } from '../helpers/auth'
import { SessionService, getSession } from '@/lib/database/sessions'
import { prisma } from '@/lib/database/prisma'

beforeEach(async () => {
  await cleanTables()
})

describe('SessionService', () => {
  describe('create', () => {
    it('creates session with UUID and correct expiry time', async () => {
      const user = await createUser()
      const before = Date.now()
      const session = await SessionService.create(user.id)
      const after = Date.now()

      expect(session).not.toBeNull()
      expect(session!.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
      expect(session!.userId).toBe(user.id)

      const sevenDays = 7 * 24 * 60 * 60 * 1000
      expect(session!.expiresAt.getTime()).toBeGreaterThanOrEqual(before + sevenDays)
      expect(session!.expiresAt.getTime()).toBeLessThanOrEqual(after + sevenDays)
    })

    it('returns null on invalid userId', async () => {
      const session = await SessionService.create(99999)
      expect(session).toBeNull()
    })
  })

  describe('findValidSession', () => {
    it('returns session with user data when valid', async () => {
      const user = await createUser()
      const session = await createTestSession(user.id)

      const found = await SessionService.findValidSession(session.id)

      expect(found).not.toBeNull()
      expect(found!.id).toBe(session.id)
      expect(found!.user.id).toBe(user.id)
      expect(found!.user.discordUsername).toBe(user.discordUsername)
    })

    it('returns null for expired session', async () => {
      const user = await createUser()
      const session = await createExpiredSession(user.id)

      const found = await SessionService.findValidSession(session.id)
      expect(found).toBeNull()
    })

    it('returns null for non-existent session ID', async () => {
      const found = await SessionService.findValidSession('non-existent-id')
      expect(found).toBeNull()
    })
  })

  describe('delete', () => {
    it('deletes existing session and returns true', async () => {
      const user = await createUser()
      const session = await createTestSession(user.id)

      const result = await SessionService.delete(session.id)
      expect(result).toBe(true)

      const found = await prisma.session.findUnique({ where: { id: session.id } })
      expect(found).toBeNull()
    })

    it('returns false for non-existent session', async () => {
      const result = await SessionService.delete('non-existent-id')
      expect(result).toBe(false)
    })
  })

  describe('deleteAllUserSessions', () => {
    it('deletes all sessions for a specific user', async () => {
      const user = await createUser()
      await createTestSession(user.id)
      await createTestSession(user.id)

      const result = await SessionService.deleteAllUserSessions(user.id)
      expect(result).toBe(true)

      const remaining = await prisma.session.findMany({ where: { userId: user.id } })
      expect(remaining).toHaveLength(0)
    })

    it('does not affect other users sessions', async () => {
      const user1 = await createUser({ discordId: 'user-1', discordUsername: 'user1', nickname: 'User1' })
      const user2 = await createUser({ discordId: 'user-2', discordUsername: 'user2', nickname: 'User2' })
      await createTestSession(user1.id)
      const session2 = await createTestSession(user2.id)

      await SessionService.deleteAllUserSessions(user1.id)

      const user2Sessions = await prisma.session.findMany({ where: { userId: user2.id } })
      expect(user2Sessions).toHaveLength(1)
      expect(user2Sessions[0].id).toBe(session2.id)
    })
  })

  describe('cleanupExpiredSessions', () => {
    it('deletes only expired sessions and returns count', async () => {
      const user = await createUser()
      await createExpiredSession(user.id)
      await createExpiredSession(user.id)

      const count = await SessionService.cleanupExpiredSessions()
      expect(count).toBe(2)
    })

    it('does not delete valid sessions', async () => {
      const user = await createUser()
      const validSession = await createTestSession(user.id)
      await createExpiredSession(user.id)

      await SessionService.cleanupExpiredSessions()

      const remaining = await prisma.session.findMany()
      expect(remaining).toHaveLength(1)
      expect(remaining[0].id).toBe(validSession.id)
    })
  })

  describe('extendSession', () => {
    it('extends session expiry time', async () => {
      const user = await createUser()
      const session = await SessionService.create(user.id, 1000)

      const before = Date.now()
      const sevenDays = 7 * 24 * 60 * 60 * 1000
      const extended = await SessionService.extendSession(session!.id, sevenDays)
      const after = Date.now()

      expect(extended).not.toBeNull()
      expect(extended!.expiresAt.getTime()).toBeGreaterThan(session!.expiresAt.getTime())
      expect(extended!.expiresAt.getTime()).toBeGreaterThanOrEqual(before + sevenDays)
      expect(extended!.expiresAt.getTime()).toBeLessThanOrEqual(after + sevenDays)
    })

    it('returns null for non-existent session', async () => {
      const result = await SessionService.extendSession('non-existent-id')
      expect(result).toBeNull()
    })
  })

  describe('getSessionStats', () => {
    it('returns correct active/expired/total counts', async () => {
      const user = await createUser()
      await createTestSession(user.id)
      await createTestSession(user.id)
      await createExpiredSession(user.id)

      const stats = await SessionService.getSessionStats()

      expect(stats.total).toBe(3)
      expect(stats.active).toBe(2)
      expect(stats.expired).toBe(1)
    })
  })
})

describe('getSession', () => {
  it('returns valid session from request cookie', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const request = buildAuthenticatedRequest('http://localhost:3000/api/test', session.id)

    const found = await getSession(request)

    expect(found).not.toBeNull()
    expect(found!.id).toBe(session.id)
    expect(found!.user.id).toBe(user.id)
  })

  it('returns null when no session cookie', async () => {
    const request = buildRequest('http://localhost:3000/api/test')

    const found = await getSession(request)
    expect(found).toBeNull()
  })

  it('returns null for expired session cookie', async () => {
    const user = await createUser()
    const session = await createExpiredSession(user.id)
    const request = buildAuthenticatedRequest('http://localhost:3000/api/test', session.id)

    const found = await getSession(request)
    expect(found).toBeNull()
  })
})
