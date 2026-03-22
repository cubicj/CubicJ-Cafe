import { NextResponse } from 'next/server'
import { cleanTables } from '../helpers/db'
import { createUser } from '../helpers/fixtures'
import { createTestSession, createExpiredSession, buildRequest, buildAuthenticatedRequest } from '../helpers/auth'
import { withAuth, withOptionalAuth, AuthenticatedRequest } from '@/lib/auth/middleware'
import { sessionManager } from '@/lib/auth/session'
import { prisma } from '@/lib/database/prisma'

beforeEach(async () => {
  await cleanTables()
})

const mockHandler = async (req: AuthenticatedRequest) =>
  NextResponse.json({ user: req.user || null, sessionId: req.sessionId || null })

describe('withAuth', () => {
  it('returns 401 when no session cookie present', async () => {
    const request = buildRequest('http://localhost:3000/api/test')
    const response = await withAuth(request, mockHandler)

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error).toBeDefined()
  })

  it('returns 401 and clears cookie when session is invalid/expired', async () => {
    const user = await createUser()
    const session = await createExpiredSession(user.id)
    const request = buildAuthenticatedRequest('http://localhost:3000/api/test', session.id)

    const response = await withAuth(request, mockHandler)

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error).toBeDefined()

    const setCookie = response.headers.get('set-cookie')
    expect(setCookie).toContain('session_id')
  })

  it('calls handler with user data when session is valid', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const request = buildAuthenticatedRequest('http://localhost:3000/api/test', session.id)

    const response = await withAuth(request, mockHandler)

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.user).not.toBeNull()
    expect(body.user.discordId).toBe(user.discordId)
    expect(body.user.discordUsername).toBe(user.discordUsername)
    expect(body.sessionId).toBe(session.id)
  })
})

describe('withOptionalAuth', () => {
  it('calls handler without user when no session cookie', async () => {
    const request = buildRequest('http://localhost:3000/api/test')
    const response = await withOptionalAuth(request, mockHandler)

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.user).toBeNull()
  })

  it('calls handler with user when valid session exists', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const request = buildAuthenticatedRequest('http://localhost:3000/api/test', session.id)

    const response = await withOptionalAuth(request, mockHandler)

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.user).not.toBeNull()
    expect(body.user.discordId).toBe(user.discordId)
  })

  it('calls handler without user when session is expired', async () => {
    const user = await createUser()
    const session = await createExpiredSession(user.id)
    const request = buildAuthenticatedRequest('http://localhost:3000/api/test', session.id)

    const response = await withOptionalAuth(request, mockHandler)

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.user).toBeNull()
  })
})

describe('SessionManager', () => {
  describe('createSession', () => {
    it('creates session and updates user lastLoginAt', async () => {
      const user = await createUser()
      const beforeLogin = user.lastLoginAt

      const sessionData = await sessionManager.createSession(user.discordId)

      expect(sessionData.sessionId).toBeDefined()
      expect(sessionData.user.discordId).toBe(user.discordId)
      expect(sessionData.user.discordUsername).toBe(user.discordUsername)
      expect(sessionData.expiresAt).toBeInstanceOf(Date)

      const updatedUser = await prisma.user.findUnique({ where: { id: user.id } })
      expect(updatedUser!.lastLoginAt.getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime())
    })

    it('throws when user not found by discordId', async () => {
      await expect(sessionManager.createSession('non-existent-discord-id'))
        .rejects.toThrow()
    })
  })

  describe('validateSession', () => {
    it('returns SessionData for valid session', async () => {
      const user = await createUser()
      const session = await createTestSession(user.id)

      const result = await sessionManager.validateSession(session.id)

      expect(result).not.toBeNull()
      expect(result!.sessionId).toBe(session.id)
      expect(result!.user.discordId).toBe(user.discordId)
      expect(result!.user.id).toBe(user.id.toString())
    })

    it('returns null for expired session', async () => {
      const user = await createUser()
      const session = await createExpiredSession(user.id)

      const result = await sessionManager.validateSession(session.id)
      expect(result).toBeNull()
    })

    it('returns null for non-existent session', async () => {
      const result = await sessionManager.validateSession('non-existent-session-id')
      expect(result).toBeNull()
    })
  })

  describe('getSessionIdFromRequest', () => {
    it('extracts session_id cookie from request', async () => {
      const request = buildAuthenticatedRequest('http://localhost:3000/api/test', 'my-session-id')

      const sessionId = sessionManager.getSessionIdFromRequest(request)
      expect(sessionId).toBe('my-session-id')
    })

    it('returns null when no cookie', () => {
      const request = buildRequest('http://localhost:3000/api/test')

      const sessionId = sessionManager.getSessionIdFromRequest(request)
      expect(sessionId).toBeNull()
    })
  })

  describe('setSessionCookie', () => {
    it('sets httpOnly cookie on response', () => {
      const response = NextResponse.json({ ok: true })
      const expiresAt = new Date(Date.now() + 86400000)

      sessionManager.setSessionCookie(response, 'test-session-id', expiresAt)

      const cookie = response.cookies.get('session_id')
      expect(cookie).toBeDefined()
      expect(cookie!.value).toBe('test-session-id')
    })
  })

  describe('clearSessionCookie', () => {
    it('removes cookie from response', () => {
      const response = NextResponse.json({ ok: true })
      const expiresAt = new Date(Date.now() + 86400000)
      sessionManager.setSessionCookie(response, 'test-session-id', expiresAt)

      sessionManager.clearSessionCookie(response)

      const setCookie = response.headers.get('set-cookie')
      expect(setCookie).toContain('session_id')
      expect(setCookie).toContain('Expires=Thu, 01 Jan 1970')
    })
  })
})
