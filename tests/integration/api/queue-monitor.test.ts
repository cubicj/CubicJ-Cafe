import { vi } from 'vitest'
import { cleanTables } from '../../helpers/db'
import { createAdminUser, createUser } from '../../helpers/fixtures'
import { createTestSession, buildRequest, buildAuthenticatedRequest } from '../../helpers/auth'

vi.mock('@/lib/comfyui/queue-monitor', () => ({
  queueMonitor: {
    start: vi.fn(),
    stop: vi.fn(),
    getStatus: vi.fn(() => ({ isRunning: false, processedCount: 0 })),
  },
}))

import { GET, POST } from '@/app/api/queue/monitor/route'

beforeEach(async () => {
  await cleanTables()
})

describe('GET /api/queue/monitor', () => {
  it('returns 401 when not authenticated', async () => {
    const req = buildRequest('/api/queue/monitor')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 403 when non-admin user', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const req = buildAuthenticatedRequest('/api/queue/monitor', session.id)
    const res = await GET(req)
    expect(res.status).toBe(403)
  })

  it('returns monitor status for admin', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/queue/monitor', session.id)
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toBeDefined()
  })
})

describe('POST /api/queue/monitor', () => {
  it('returns 401 when not authenticated', async () => {
    const req = buildRequest('/api/queue/monitor', {
      method: 'POST',
      body: JSON.stringify({ action: 'status' }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 403 when non-admin user', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const req = buildAuthenticatedRequest('/api/queue/monitor', session.id, {
      method: 'POST',
      body: JSON.stringify({ action: 'status' }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('starts queue monitor', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/queue/monitor', session.id, {
      method: 'POST',
      body: JSON.stringify({ action: 'start' }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.message).toContain('시작')
  })

  it('stops queue monitor', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/queue/monitor', session.id, {
      method: 'POST',
      body: JSON.stringify({ action: 'stop' }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.message).toContain('중단')
  })

  it('returns status via POST', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/queue/monitor', session.id, {
      method: 'POST',
      body: JSON.stringify({ action: 'status' }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toBeDefined()
  })

  it('returns 400 for invalid action', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/queue/monitor', session.id, {
      method: 'POST',
      body: JSON.stringify({ action: 'invalid' }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
