import { vi } from 'vitest'
import { GET, POST } from '@/app/api/admin/comfyui-toggle/route'
import { cleanTables } from '../../helpers/db'
import { createUser, createAdminUser } from '../../helpers/fixtures'
import { createTestSession, buildAuthenticatedRequest, buildRequest } from '../../helpers/auth'

vi.mock('@/lib/comfyui/queue-monitor', () => ({
  queueMonitor: {
    start: vi.fn(),
    stop: vi.fn(),
    getStatus: vi.fn().mockReturnValue({
      running: false,
      checkInterval: 5000,
      activeServers: 0,
      currentlyProcessing: 0,
      maxConcurrent: 0,
      serverDetails: []
    }),
    getIsRunning: vi.fn().mockReturnValue(false)
  }
}))

beforeEach(async () => {
  await cleanTables()
  globalThis.__comfyuiEnabled = undefined
})

describe('ComfyUI Toggle API', () => {
  describe('GET /api/admin/comfyui-toggle', () => {
    it('returns 401 without authentication', async () => {
      const req = buildRequest('/api/admin/comfyui-toggle')
      const res = await GET(req)
      expect(res.status).toBe(401)
    })

    it('returns 403 for non-admin user', async () => {
      const user = await createUser()
      const session = await createTestSession(user.id)
      const req = buildAuthenticatedRequest('/api/admin/comfyui-toggle', session.id)
      const res = await GET(req)
      expect(res.status).toBe(403)
    })

    it('returns current ComfyUI state for admin', async () => {
      const admin = await createAdminUser()
      const session = await createTestSession(admin.id)
      const req = buildAuthenticatedRequest('/api/admin/comfyui-toggle', session.id)
      const res = await GET(req)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body).toHaveProperty('enabled')
      expect(body).toHaveProperty('queueMonitor')
    })
  })

  describe('POST /api/admin/comfyui-toggle', () => {
    it('returns 401 without authentication', async () => {
      const req = buildRequest('/api/admin/comfyui-toggle', {
        method: 'POST',
        body: JSON.stringify({ enabled: false }),
        headers: { 'Content-Type': 'application/json' }
      })
      const res = await POST(req)
      expect(res.status).toBe(401)
    })

    it('returns 403 for non-admin user', async () => {
      const user = await createUser()
      const session = await createTestSession(user.id)
      const req = buildAuthenticatedRequest('/api/admin/comfyui-toggle', session.id, {
        method: 'POST',
        body: JSON.stringify({ enabled: false }),
        headers: { 'Content-Type': 'application/json' }
      })
      const res = await POST(req)
      expect(res.status).toBe(403)
    })

    it('returns 400 for invalid body', async () => {
      const admin = await createAdminUser()
      const session = await createTestSession(admin.id)
      const req = buildAuthenticatedRequest('/api/admin/comfyui-toggle', session.id, {
        method: 'POST',
        body: JSON.stringify({ enabled: 'not-boolean' }),
        headers: { 'Content-Type': 'application/json' }
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('toggles ComfyUI to disabled', async () => {
      globalThis.__comfyuiEnabled = true
      const admin = await createAdminUser()
      const session = await createTestSession(admin.id)
      const req = buildAuthenticatedRequest('/api/admin/comfyui-toggle', session.id, {
        method: 'POST',
        body: JSON.stringify({ enabled: false }),
        headers: { 'Content-Type': 'application/json' }
      })
      const res = await POST(req)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.enabled).toBe(false)
    })

    it('toggles ComfyUI to enabled', async () => {
      globalThis.__comfyuiEnabled = false
      const admin = await createAdminUser()
      const session = await createTestSession(admin.id)
      const req = buildAuthenticatedRequest('/api/admin/comfyui-toggle', session.id, {
        method: 'POST',
        body: JSON.stringify({ enabled: true }),
        headers: { 'Content-Type': 'application/json' }
      })
      const res = await POST(req)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.enabled).toBe(true)
    })
  })
})
