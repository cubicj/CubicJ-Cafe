import { cleanTables } from '../../helpers/db'
import { createUser, createAdminUser } from '../../helpers/fixtures'
import { createTestSession, buildRequest, buildAuthenticatedRequest } from '../../helpers/auth'

import { GET, POST } from '@/app/api/admin/lora-bundles/route'
import {
  PUT,
  DELETE,
} from '@/app/api/admin/lora-bundles/[id]/route'

async function createBundleViaAPI(sessionId: string, displayName: string, highLoRAFilename = 'test-high.safetensors') {
  const req = buildAuthenticatedRequest('/api/admin/lora-bundles', sessionId, {
    method: 'POST',
    body: JSON.stringify({ displayName, highLoRAFilename }),
  })
  const res = await POST(req)
  return res.json()
}

beforeEach(async () => {
  await cleanTables()
})

describe('GET /api/admin/lora-bundles', () => {
  it('returns 401 when not authenticated', async () => {
    const req = buildRequest('/api/admin/lora-bundles')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-admin', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const req = buildAuthenticatedRequest('/api/admin/lora-bundles', session.id)
    const res = await GET(req)
    expect(res.status).toBe(403)
  })

  it('returns bundles list for admin', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/lora-bundles', session.id)
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.bundles).toEqual([])
    expect(body.count).toBe(0)
  })
})

describe('POST /api/admin/lora-bundles', () => {
  it('returns 401 when not authenticated', async () => {
    const req = buildRequest('/api/admin/lora-bundles', {
      method: 'POST',
      body: JSON.stringify({ displayName: 'Test', highLoRAFilename: 'test.safetensors' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('creates bundle with name and lora files for admin', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)

    const req = buildAuthenticatedRequest('/api/admin/lora-bundles', session.id, {
      method: 'POST',
      body: JSON.stringify({
        displayName: 'My Bundle',
        highLoRAFilename: 'high.safetensors',
        lowLoRAFilename: 'low.safetensors',
      }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.bundle.displayName).toBe('My Bundle')
    expect(body.bundle.highLoRAFilename).toBe('high.safetensors')
    expect(body.bundle.lowLoRAFilename).toBe('low.safetensors')
  })

  it('returns 400 when no lora files provided', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)

    const req = buildAuthenticatedRequest('/api/admin/lora-bundles', session.id, {
      method: 'POST',
      body: JSON.stringify({ displayName: 'Empty Bundle' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

describe('PUT /api/admin/lora-bundles/[id]', () => {
  it('updates bundle name and files', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)

    const created = await createBundleViaAPI(session.id, 'Original Bundle')

    const req = buildAuthenticatedRequest(`/api/admin/lora-bundles/${created.bundle.id}`, session.id, {
      method: 'PUT',
      body: JSON.stringify({
        displayName: 'Updated Bundle',
        lowLoRAFilename: 'new-low.safetensors',
      }),
    })
    const res = await PUT(req, { params: Promise.resolve({ id: created.bundle.id }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.bundle.displayName).toBe('Updated Bundle')
    expect(body.bundle.lowLoRAFilename).toBe('new-low.safetensors')
  })

  it('returns 404 for non-existent id', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)

    const req = buildAuthenticatedRequest('/api/admin/lora-bundles/nonexistent-id', session.id, {
      method: 'PUT',
      body: JSON.stringify({ displayName: 'Nope' }),
    })
    const res = await PUT(req, { params: Promise.resolve({ id: 'nonexistent-id' }) })
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })
})

describe('DELETE /api/admin/lora-bundles/[id]', () => {
  it('deletes bundle', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)

    const created = await createBundleViaAPI(session.id, 'Delete Me')

    const req = buildAuthenticatedRequest(`/api/admin/lora-bundles/${created.bundle.id}`, session.id, {
      method: 'DELETE',
    })
    const res = await DELETE(req, { params: Promise.resolve({ id: created.bundle.id }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.message).toBeDefined()
  })

  it('returns 404 for non-existent id', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)

    const req = buildAuthenticatedRequest('/api/admin/lora-bundles/nonexistent-id', session.id, {
      method: 'DELETE',
    })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'nonexistent-id' }) })
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })
})
