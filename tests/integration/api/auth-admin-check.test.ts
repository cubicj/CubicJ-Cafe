import { cleanTables } from '../../helpers/db'
import { createUser, createAdminUser } from '../../helpers/fixtures'
import { createTestSession, buildRequest, buildAuthenticatedRequest } from '../../helpers/auth'
import { GET } from '@/app/api/auth/admin-check/route'

beforeEach(async () => {
  await cleanTables()
})

describe('GET /api/auth/admin-check', () => {
  it('returns 401 without session', async () => {
    const req = buildRequest('/api/auth/admin-check')
    const res = await GET(req)

    expect(res.status).toBe(401)
  })

  it('returns 403 for regular user', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)

    const req = buildAuthenticatedRequest('/api/auth/admin-check', session.id)
    const res = await GET(req)

    expect(res.status).toBe(403)
  })

  it('returns isAdmin true for admin user', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)

    const req = buildAuthenticatedRequest('/api/auth/admin-check', session.id)
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.isAdmin).toBe(true)
  })
})
