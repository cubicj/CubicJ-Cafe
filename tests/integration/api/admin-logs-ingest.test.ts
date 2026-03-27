import { cleanTables } from '../../helpers/db'
import { createAdminUser, createUser } from '../../helpers/fixtures'
import { createTestSession, buildRequest, buildAuthenticatedRequest } from '../../helpers/auth'

import { POST } from '@/app/api/admin/logs/ingest/route'

beforeEach(async () => {
  await cleanTables()
})

describe('POST /api/admin/logs/ingest', () => {
  it('returns 401 when not authenticated', async () => {
    const req = buildRequest('/api/admin/logs/ingest', {
      method: 'POST',
      body: JSON.stringify({ entries: [] }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 403 when non-admin user', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const req = buildAuthenticatedRequest('/api/admin/logs/ingest', session.id, {
      method: 'POST',
      body: JSON.stringify({ entries: [] }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('returns 400 for invalid JSON', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/logs/ingest', session.id, {
      method: 'POST',
      body: 'not json',
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when entries is not an array', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/logs/ingest', session.id, {
      method: 'POST',
      body: JSON.stringify({ entries: 'not-array' }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it('accepts valid log entries', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/logs/ingest', session.id, {
      method: 'POST',
      body: JSON.stringify({
        entries: [
          { timestamp: new Date().toISOString(), level: 'info', category: 'test', message: 'test log' },
          { timestamp: new Date().toISOString(), level: 'error', category: 'test', message: 'error log' },
        ],
      }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.accepted).toBe(2)
  })

  it('skips entries with missing required fields', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/logs/ingest', session.id, {
      method: 'POST',
      body: JSON.stringify({
        entries: [
          { timestamp: new Date().toISOString(), level: 'info', category: 'test', message: 'valid' },
          { level: 'info', category: 'test' },
          { timestamp: new Date().toISOString() },
        ],
      }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.accepted).toBe(1)
  })

  it('returns 400 when entries exceed max limit', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const entries = Array.from({ length: 150 }, (_, i) => ({
      timestamp: new Date().toISOString(),
      level: 'info',
      category: 'test',
      message: `log ${i}`,
    }))

    const req = buildAuthenticatedRequest('/api/admin/logs/ingest', session.id, {
      method: 'POST',
      body: JSON.stringify({ entries }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
