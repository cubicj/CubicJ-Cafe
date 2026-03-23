import { cleanTables } from '../../helpers/db'
import { createAdminUser, createUser } from '../../helpers/fixtures'
import { createTestSession, buildRequest, buildAuthenticatedRequest } from '../../helpers/auth'

import { GET, PUT } from '@/app/api/admin/model-settings/route'

beforeEach(async () => {
  await cleanTables()
})

describe('GET /api/admin/model-settings', () => {
  it('returns 401 when not authenticated', async () => {
    const req = buildRequest('/api/admin/model-settings')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 403 when non-admin user', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const req = buildAuthenticatedRequest('/api/admin/model-settings', session.id)
    const res = await GET(req)
    expect(res.status).toBe(403)
  })

  it('returns default settings for admin', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/model-settings', session.id)
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.settings).toBeDefined()
    expect(body.settings.ksampler).toBe('euler_ancestral')
    expect(body.settings.highCfg).toBe(3.0)
  })
})

describe('PUT /api/admin/model-settings', () => {
  it('returns 401 when not authenticated', async () => {
    const req = buildRequest('/api/admin/model-settings', {
      method: 'PUT',
      body: JSON.stringify({ ksampler: 'dpmpp_2m' }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await PUT(req)
    expect(res.status).toBe(401)
  })

  it('returns 403 when non-admin user', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const req = buildAuthenticatedRequest('/api/admin/model-settings', session.id, {
      method: 'PUT',
      body: JSON.stringify({ ksampler: 'dpmpp_2m' }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await PUT(req)
    expect(res.status).toBe(403)
  })

  it('updates settings as admin', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/model-settings', session.id, {
      method: 'PUT',
      body: JSON.stringify({ ksampler: 'dpmpp_2m', highCfg: 5.0 }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await PUT(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.settings.ksampler).toBe('dpmpp_2m')
    expect(body.settings.highCfg).toBe(5.0)
  })

  it('returns 400 for empty body', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/model-settings', session.id, {
      method: 'PUT',
      body: '',
      headers: { 'content-type': 'application/json' },
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid JSON', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/model-settings', session.id, {
      method: 'PUT',
      body: 'not json',
      headers: { 'content-type': 'application/json' },
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })
})
