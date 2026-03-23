import { cleanTables } from '../../helpers/db'
import { createUser } from '../../helpers/fixtures'
import { createTestSession, buildRequest, buildAuthenticatedRequest } from '../../helpers/auth'
import { POST } from '@/app/api/auth/signout/route'
import { prisma } from '@/lib/database/prisma'

beforeEach(async () => {
  await cleanTables()
})

describe('POST /api/auth/signout', () => {
  it('returns success even without session cookie', async () => {
    const req = buildRequest('/api/auth/signout', { method: 'POST' })
    const res = await POST(req)

    expect(res.status).toBe(200)
  })

  it('deletes session and clears cookie with valid session', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)

    const req = buildAuthenticatedRequest('/api/auth/signout', session.id, { method: 'POST' })
    const res = await POST(req)

    expect(res.status).toBe(200)

    const deleted = await prisma.session.findUnique({ where: { id: session.id } })
    expect(deleted).toBeNull()

    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).toContain('session_id')
  })

  it('returns success with already-invalid session', async () => {
    const req = buildAuthenticatedRequest('/api/auth/signout', 'nonexistent-session-id', { method: 'POST' })
    const res = await POST(req)

    expect(res.status).toBe(200)
  })
})
