import { vi } from 'vitest'
import { GET, POST } from '@/app/api/comfyui/proxy/[...path]/route'
import { isComfyUIEnabled } from '@/lib/comfyui/comfyui-state'
import { cleanTables } from '../../helpers/db'
import { createUser, createAdminUser } from '../../helpers/fixtures'
import { createTestSession, buildAuthenticatedRequest, buildRequest } from '../../helpers/auth'

vi.mock('@/lib/comfyui/comfyui-state', () => ({
  isComfyUIEnabled: vi.fn(() => true),
}))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function makeParams(path: string[]) {
  return { params: Promise.resolve({ path }) }
}

beforeEach(async () => {
  await cleanTables()
  vi.mocked(isComfyUIEnabled).mockReturnValue(true)
  mockFetch.mockReset()
})

describe('ComfyUI Proxy API', () => {
  describe('authentication and authorization', () => {
    it('returns 401 when not authenticated', async () => {
      const req = buildRequest('/api/comfyui/proxy/system_stats')
      const res = await GET(req, makeParams(['system_stats']))
      expect(res.status).toBe(401)
    })

    it('returns 403 for non-admin user', async () => {
      const user = await createUser()
      const session = await createTestSession(user.id)
      const req = buildAuthenticatedRequest('/api/comfyui/proxy/system_stats', session.id)
      const res = await GET(req, makeParams(['system_stats']))
      expect(res.status).toBe(403)
    })
  })

  describe('ComfyUI disabled', () => {
    it('returns 503 when ComfyUI is disabled', async () => {
      vi.mocked(isComfyUIEnabled).mockReturnValue(false)
      const admin = await createAdminUser()
      const session = await createTestSession(admin.id)
      const req = buildAuthenticatedRequest('/api/comfyui/proxy/system_stats', session.id)
      const res = await GET(req, makeParams(['system_stats']))
      expect(res.status).toBe(503)
    })
  })

  describe('path allowlisting', () => {
    let adminSessionId: string

    beforeEach(async () => {
      const admin = await createAdminUser()
      const session = await createTestSession(admin.id)
      adminSessionId = session.id
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })

    it('allows exact path match (system_stats)', async () => {
      const req = buildAuthenticatedRequest('/api/comfyui/proxy/system_stats', adminSessionId)
      const res = await GET(req, makeParams(['system_stats']))
      expect(res.status).toBe(200)
    })

    it('allows exact path match (object_info)', async () => {
      const req = buildAuthenticatedRequest('/api/comfyui/proxy/object_info', adminSessionId)
      const res = await GET(req, makeParams(['object_info']))
      expect(res.status).toBe(200)
    })

    it('allows exact path match (prompt)', async () => {
      const req = buildAuthenticatedRequest('/api/comfyui/proxy/prompt', adminSessionId)
      const res = await GET(req, makeParams(['prompt']))
      expect(res.status).toBe(200)
    })

    it('allows path with subpath (history/123)', async () => {
      const req = buildAuthenticatedRequest('/api/comfyui/proxy/history/123', adminSessionId)
      const res = await GET(req, makeParams(['history', '123']))
      expect(res.status).toBe(200)
    })

    it('blocks disallowed path', async () => {
      const req = buildAuthenticatedRequest('/api/comfyui/proxy/admin/dangerous', adminSessionId)
      const res = await GET(req, makeParams(['admin', 'dangerous']))
      expect(res.status).toBe(403)
    })

    it('allows path that looks like prefix but is not a subpath (prefix check uses /)', async () => {
      const req = buildAuthenticatedRequest('/api/comfyui/proxy/system_statsmalicious', adminSessionId)
      const res = await GET(req, makeParams(['system_statsmalicious']))
      expect(res.status).toBe(403)
    })
  })

  describe('proxy behavior', () => {
    let adminSessionId: string

    beforeEach(async () => {
      const admin = await createAdminUser()
      const session = await createTestSession(admin.id)
      adminSessionId = session.id
    })

    it('does not forward Authorization headers', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      const req = buildAuthenticatedRequest('/api/comfyui/proxy/system_stats', adminSessionId, {
        headers: {
          'Authorization': 'Bearer secret-token',
          'Content-Type': 'application/json',
        },
      })
      const res = await GET(req, makeParams(['system_stats']))
      expect(res.status).toBe(200)

      const [, fetchOptions] = mockFetch.mock.calls[0]
      const headers = fetchOptions.headers as Headers
      expect(headers.has('authorization')).toBe(false)
    })

    it('forwards POST body correctly', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ prompt_id: 'abc' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      const body = JSON.stringify({ prompt: { nodes: [] } })
      const req = buildAuthenticatedRequest('/api/comfyui/proxy/prompt', adminSessionId, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
      })
      const res = await POST(req, makeParams(['prompt']))
      expect(res.status).toBe(200)

      const [, fetchOptions] = mockFetch.mock.calls[0]
      expect(fetchOptions.method).toBe('POST')
      expect(fetchOptions.body).toBe(body)
    })

    it('returns 503 on fetch failure (backend connection error)', async () => {
      mockFetch.mockRejectedValue(new Error('ECONNREFUSED'))
      const req = buildAuthenticatedRequest('/api/comfyui/proxy/system_stats', adminSessionId)
      const res = await GET(req, makeParams(['system_stats']))
      expect(res.status).toBe(503)
    })
  })
})
