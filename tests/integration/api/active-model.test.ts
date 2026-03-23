import { cleanTables } from '../../helpers/db'
import { createAdminUser, createUser } from '../../helpers/fixtures'
import { createTestSession, buildRequest, buildAuthenticatedRequest } from '../../helpers/auth'

import { GET, PUT } from '@/app/api/system/active-model/route'

beforeEach(async () => {
  await cleanTables()
})

describe('GET /api/system/active-model', () => {
  it('returns active model without auth', async () => {
    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.model).toBeDefined()
    expect(body.displayName).toBeDefined()
    expect(body.capabilities).toBeDefined()
  })

  it('defaults to ltx when no setting exists', async () => {
    const res = await GET()
    const body = await res.json()

    expect(body.model).toBe('ltx')
  })
})

describe('PUT /api/system/active-model', () => {
  it('returns 401 when not authenticated', async () => {
    const req = buildRequest('/api/system/active-model', {
      method: 'PUT',
      body: JSON.stringify({ model: 'wan' }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await PUT(req)
    expect(res.status).toBe(401)
  })

  it('returns 403 when non-admin user', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const req = buildAuthenticatedRequest('/api/system/active-model', session.id, {
      method: 'PUT',
      body: JSON.stringify({ model: 'wan' }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await PUT(req)
    expect(res.status).toBe(403)
  })

  it('changes active model as admin', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/system/active-model', session.id, {
      method: 'PUT',
      body: JSON.stringify({ model: 'wan' }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await PUT(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.model).toBe('wan')

    const getRes = await GET()
    const getBody = await getRes.json()
    expect(getBody.model).toBe('wan')
  })

  it('returns 400 for invalid model', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/system/active-model', session.id, {
      method: 'PUT',
      body: JSON.stringify({ model: 'invalid-model' }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await PUT(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBeDefined()
  })

  it('returns 400 when model is missing', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/system/active-model', session.id, {
      method: 'PUT',
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json' },
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })
})
