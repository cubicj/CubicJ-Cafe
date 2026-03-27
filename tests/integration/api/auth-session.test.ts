import { cleanTables } from '../../helpers/db'
import { createUser, createAdminUser } from '../../helpers/fixtures'
import { createTestSession, createExpiredSession, buildAuthenticatedRequest, buildRequest, noContext } from '../../helpers/auth'
import { GET } from '@/app/api/auth/session/route'

beforeEach(async () => {
  await cleanTables()
})

describe('GET /api/auth/session', () => {
  it('returns null user when unauthenticated', async () => {
    const req = buildRequest('/api/auth/session')
    const res = await GET(req, noContext)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.user).toBeNull()
  })

  it('returns user info with valid session', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)

    const req = buildAuthenticatedRequest('/api/auth/session', session.id)
    const res = await GET(req, noContext)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.user).not.toBeNull()
    expect(body.user.discordId).toBe('test-user-123')
    expect(body.user.nickname).toBe('TestUser')
    expect(body.user.id).toBeDefined()
  })

  it('returns null user with expired session', async () => {
    const user = await createUser()
    const session = await createExpiredSession(user.id)

    const req = buildAuthenticatedRequest('/api/auth/session', session.id)
    const res = await GET(req, noContext)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.user).toBeNull()
  })

  it('returns isAdmin true for admin user', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)

    const req = buildAuthenticatedRequest('/api/auth/session', session.id)
    const res = await GET(req, noContext)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.user).not.toBeNull()
    expect(body.isAdmin).toBe(true)
  })

  it('returns isAdmin false for regular user', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)

    const req = buildAuthenticatedRequest('/api/auth/session', session.id)
    const res = await GET(req, noContext)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.isAdmin).toBe(false)
  })

  it('returns isAdmin false when unauthenticated', async () => {
    const req = buildRequest('/api/auth/session')
    const res = await GET(req, noContext)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.isAdmin).toBe(false)
  })
})
