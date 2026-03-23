import { vi } from 'vitest'
import { cleanTables } from '../../helpers/db'
import { createAdminUser, createUser, createQueueRequest } from '../../helpers/fixtures'
import { createTestSession, buildRequest, buildAuthenticatedRequest } from '../../helpers/auth'

import { POST, DELETE } from '@/app/api/admin/queue-pause/route'

vi.mock('@/lib/comfyui/queue-pause-state', () => ({
  setQueuePauseAfterPosition: vi.fn(),
}))

beforeEach(async () => {
  await cleanTables()
})

describe('POST /api/admin/queue-pause', () => {
  it('returns 401 when not authenticated', async () => {
    const req = buildRequest('/api/admin/queue-pause', {
      method: 'POST',
      body: JSON.stringify({ position: 1 }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 403 when non-admin user', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const req = buildAuthenticatedRequest('/api/admin/queue-pause', session.id, {
      method: 'POST',
      body: JSON.stringify({ position: 1 }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('returns 400 for invalid position', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/queue-pause', session.id, {
      method: 'POST',
      body: JSON.stringify({ position: 0 }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for non-integer position', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/queue-pause', session.id, {
      method: 'POST',
      body: JSON.stringify({ position: 1.5 }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when queue position does not exist', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/queue-pause', session.id, {
      method: 'POST',
      body: JSON.stringify({ position: 99 }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toContain('#99')
  })

  it('sets pause position when valid queue request exists', async () => {
    const admin = await createAdminUser()
    await createQueueRequest(admin.id, { position: 1 })

    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/queue-pause', session.id, {
      method: 'POST',
      body: JSON.stringify({ position: 1 }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.pauseAfterPosition).toBe(1)
  })
})

describe('DELETE /api/admin/queue-pause', () => {
  it('returns 401 when not authenticated', async () => {
    const req = buildRequest('/api/admin/queue-pause', { method: 'DELETE' })
    const res = await DELETE(req)
    expect(res.status).toBe(401)
  })

  it('clears pause position as admin', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/queue-pause', session.id, { method: 'DELETE' })
    const res = await DELETE(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.pauseAfterPosition).toBeNull()
  })
})
