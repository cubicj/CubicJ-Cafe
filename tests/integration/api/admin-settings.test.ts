import { cleanTables } from '../../helpers/db'
import { createUser, createAdminUser } from '../../helpers/fixtures'
import { createTestSession, buildRequest, buildAuthenticatedRequest } from '../../helpers/auth'
import { GET, PUT } from '@/app/api/admin/settings/route'

beforeEach(async () => {
  await cleanTables()
})

describe('GET /api/admin/settings', () => {
  it('returns 401 when not authenticated', async () => {
    const req = buildRequest('/api/admin/settings')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-admin user', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const req = buildAuthenticatedRequest('/api/admin/settings', session.id)
    const res = await GET(req)
    expect(res.status).toBe(403)
  })

  it('returns settings for admin', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/settings', session.id)
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(typeof body).toBe('object')
  })
})

describe('PUT /api/admin/settings', () => {
  it('returns 401 when not authenticated', async () => {
    const req = buildRequest('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({ key: 'wan.shift', value: '5' }),
    })
    const res = await PUT(req)
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-admin user', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const req = buildAuthenticatedRequest('/api/admin/settings', session.id, {
      method: 'PUT',
      body: JSON.stringify({ key: 'wan.shift', value: '5' }),
    })
    const res = await PUT(req)
    expect(res.status).toBe(403)
  })

  it('creates/updates a setting for admin', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/settings', session.id, {
      method: 'PUT',
      body: JSON.stringify({ key: 'wan.shift', value: '5', category: 'wan' }),
    })
    const res = await PUT(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.message).toBeDefined()
    expect(body.setting.key).toBe('wan.shift')
    expect(body.setting.value).toBe('5')
  })

  it('rejects unknown setting key', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/settings', session.id, {
      method: 'PUT',
      body: JSON.stringify({ key: 'arbitrary_key', value: 'bad' }),
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 with missing key or value', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)

    const req1 = buildAuthenticatedRequest('/api/admin/settings', session.id, {
      method: 'PUT',
      body: JSON.stringify({ value: 'val' }),
    })
    const res1 = await PUT(req1)
    expect(res1.status).toBe(400)

    const req2 = buildAuthenticatedRequest('/api/admin/settings', session.id, {
      method: 'PUT',
      body: JSON.stringify({ key: 'wan.shift' }),
    })
    const res2 = await PUT(req2)
    expect(res2.status).toBe(400)
  })

  it('batch updates multiple settings', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/settings', session.id, {
      method: 'PUT',
      body: JSON.stringify({
        settings: [
          { key: 'wan.shift', value: '5' },
          { key: 'wan.scheduler', value: 'simple' },
        ],
      }),
    })
    const res = await PUT(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.settings).toHaveLength(2)
  })
})
