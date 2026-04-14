import { vi } from 'vitest'
import { cleanTables } from '../../helpers/db'
import { createUser } from '../../helpers/fixtures'
import { createTestSession, buildAuthenticatedRequest, noContext } from '../../helpers/auth'

vi.mock('@/lib/comfyui/comfyui-state', () => ({
  isComfyUIEnabled: vi.fn(() => true),
}))

vi.mock('@/lib/comfyui/client', () => {
  const MockClient = function(this: Record<string, unknown>) {
    this.pingServer = vi.fn(() => Promise.resolve(false))
    this.getQueueStatus = vi.fn(() => Promise.resolve({ exec_info: { queue_remaining: 0 } }))
  }
  return { ComfyUIClient: MockClient }
})

import { GET } from '@/app/api/comfyui/status/route'
import { isComfyUIEnabled } from '@/lib/comfyui/comfyui-state'

let sessionId: string

beforeEach(async () => {
  await cleanTables()
  const user = await createUser()
  const session = await createTestSession(user.id)
  sessionId = session.id
})

describe('GET /api/comfyui/status', () => {
  it('returns disabled state when ComfyUI is off', async () => {
    vi.mocked(isComfyUIEnabled).mockReturnValue(false)

    const res = await GET(buildAuthenticatedRequest('/api/comfyui/status', sessionId), noContext)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.enabled).toBe(false)
    expect(body.servers).toEqual([])
    expect(body.summary.totalActive).toBe(0)
  })

  it('returns server status when ComfyUI is enabled', async () => {
    vi.mocked(isComfyUIEnabled).mockReturnValue(true)

    const res = await GET(buildAuthenticatedRequest('/api/comfyui/status', sessionId), noContext)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.servers).toBeDefined()
    expect(Array.isArray(body.servers)).toBe(true)
    expect(body.summary).toBeDefined()
    expect(body.summary.local).toBeDefined()
    expect(body.timestamp).toBeDefined()
  })

  it('includes local server in results', async () => {
    vi.mocked(isComfyUIEnabled).mockReturnValue(true)

    const res = await GET(buildAuthenticatedRequest('/api/comfyui/status', sessionId), noContext)
    const body = await res.json()

    const localServer = body.servers.find((s: any) => s.type === 'local')
    expect(localServer).toBeDefined()
    expect(localServer.name).toBe('로컬 서버')
  })
})
