import { vi } from 'vitest'
import { cleanTables } from '../../helpers/db'
import { createAdminUser, createUser } from '../../helpers/fixtures'
import { createTestSession, buildRequest, buildAuthenticatedRequest } from '../../helpers/auth'

vi.mock('@/lib/utils/file-cleanup', () => ({
  cleanupTempFiles: vi.fn(() => Promise.resolve({ deletedFiles: 3, totalSize: 1024, errors: [] })),
}))

import { GET, POST } from '@/app/api/admin/cleanup/route'

beforeEach(async () => {
  await cleanTables()
})

describe('GET /api/admin/cleanup', () => {
  it('returns 401 when not authenticated', async () => {
    const req = buildRequest('/api/admin/cleanup')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 403 when non-admin user', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const req = buildAuthenticatedRequest('/api/admin/cleanup', session.id)
    const res = await GET(req)
    expect(res.status).toBe(403)
  })

  it('runs auto cleanup as admin', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/cleanup', session.id)
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.result.deletedFiles).toBe(3)
  })
})

describe('POST /api/admin/cleanup', () => {
  it('returns 401 when not authenticated', async () => {
    const req = buildRequest('/api/admin/cleanup', {
      method: 'POST',
      body: JSON.stringify({ maxAgeHours: 24 }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('runs manual cleanup with custom maxAgeHours', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/cleanup', session.id, {
      method: 'POST',
      body: JSON.stringify({ maxAgeHours: 48 }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.message).toContain('3개 파일')
  })

  it('uses default maxAgeHours when not provided', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/cleanup', session.id, {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.result).toBeDefined()
  })
})
