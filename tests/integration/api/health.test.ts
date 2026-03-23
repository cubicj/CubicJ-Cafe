import { vi } from 'vitest'
import { cleanTables } from '../../helpers/db'
import { createAdminUser, createUser } from '../../helpers/fixtures'
import { createTestSession, buildRequest, buildAuthenticatedRequest, noContext } from '../../helpers/auth'

vi.mock('@/lib/comfyui/comfyui-state', () => ({
  isComfyUIEnabled: vi.fn(() => false),
}))

import { GET } from '@/app/api/health/route'

beforeEach(async () => {
  await cleanTables()
})

describe('GET /api/health', () => {
  it('returns health status without auth (public view)', async () => {
    const req = buildRequest('/api/health')
    const res = await GET(req, noContext)
    const body = await res.json()

    expect(body.status).toBeDefined()
    expect(body.timestamp).toBeDefined()
    expect(body.services).toBeDefined()
    expect(body.services.database).toBeDefined()
    expect(body.system).toBeUndefined()
  })

  it('returns detailed info for admin', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/health', session.id)
    const res = await GET(req, noContext)
    const body = await res.json()

    expect(body.status).toBeDefined()
    expect(body.system).toBeDefined()
    expect(body.system.memory).toBeDefined()
    expect(body.uptime).toBeDefined()
    expect(body.services.comfyui).toBeDefined()
    expect(body.services.comfyui.status).toBeDefined()
  })

  it('returns public view for non-admin user', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const req = buildAuthenticatedRequest('/api/health', session.id)
    const res = await GET(req, noContext)
    const body = await res.json()

    expect(body.services.database.status).toBeDefined()
    expect(body.system).toBeUndefined()
  })

  it('includes performance responseTime', async () => {
    const req = buildRequest('/api/health')
    const res = await GET(req, noContext)
    const body = await res.json()

    expect(body.performance).toBeDefined()
    expect(typeof body.performance.responseTime).toBe('number')
  })
})
