import { vi } from 'vitest'
import { cleanTables } from '../../helpers/db'
import { createUser } from '../../helpers/fixtures'
import { buildRequest, buildAuthenticatedRequest } from '../../helpers/auth'
import { createTestSession } from '../../helpers/auth'

const mockGetWanSettings = vi.fn()
const mockGetLtxSettings = vi.fn()
const mockGetLtxWanSettings = vi.fn()

vi.mock('@/lib/database/system-settings', () => ({
  getWanSettings: (...args: unknown[]) => mockGetWanSettings(...args),
  getLtxSettings: (...args: unknown[]) => mockGetLtxSettings(...args),
  getLtxWanSettings: (...args: unknown[]) => mockGetLtxWanSettings(...args),
}))

import { GET } from '@/app/api/i2v/capabilities/route'

function setLoraEnabled(wan: boolean, ltx: boolean) {
  mockGetWanSettings.mockResolvedValue({ loraEnabled: wan })
  mockGetLtxSettings.mockResolvedValue({ loraEnabled: ltx })
  mockGetLtxWanSettings.mockResolvedValue({ durationOptions: [5, 6, 7, 8] })
}

describe('GET /api/i2v/capabilities', () => {
  beforeEach(async () => {
    await cleanTables()
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    const res = await GET(buildRequest('/api/i2v/capabilities'))
    expect(res.status).toBe(401)
  })

  it('returns loraPresets true when both enabled', async () => {
    setLoraEnabled(true, true)
    const user = await createUser()
    const session = await createTestSession(user.id)

    const res = await GET(buildAuthenticatedRequest('/api/i2v/capabilities', session.id))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.capabilities.wan.loraPresets).toBe(true)
    expect(body.capabilities.ltx.loraPresets).toBe(true)
  })

  it('returns loraPresets false for LTX when disabled', async () => {
    setLoraEnabled(true, false)
    const user = await createUser()
    const session = await createTestSession(user.id)

    const res = await GET(buildAuthenticatedRequest('/api/i2v/capabilities', session.id))
    const body = await res.json()

    expect(body.capabilities.wan.loraPresets).toBe(true)
    expect(body.capabilities.ltx.loraPresets).toBe(false)
  })

  it('returns loraPresets false for WAN when disabled', async () => {
    setLoraEnabled(false, true)
    const user = await createUser()
    const session = await createTestSession(user.id)

    const res = await GET(buildAuthenticatedRequest('/api/i2v/capabilities', session.id))
    const body = await res.json()

    expect(body.capabilities.wan.loraPresets).toBe(false)
    expect(body.capabilities.ltx.loraPresets).toBe(true)
  })

  it('returns durationOptions from settings for ltx-wan and registry for others', async () => {
    setLoraEnabled(true, true)
    const user = await createUser()
    const session = await createTestSession(user.id)

    const res = await GET(buildAuthenticatedRequest('/api/i2v/capabilities', session.id))
    const body = await res.json()

    expect(body.durationOptions['ltx-wan']).toEqual([5, 6, 7, 8])
    expect(body.durationOptions.wan).toEqual([5, 6, 7])
    expect(body.durationOptions.ltx).toEqual([5, 6, 7])
  })

  it('preserves other capabilities from registry', async () => {
    setLoraEnabled(true, true)
    const user = await createUser()
    const session = await createTestSession(user.id)

    const res = await GET(buildAuthenticatedRequest('/api/i2v/capabilities', session.id))
    const body = await res.json()

    expect(body.capabilities.wan.audio).toBe(false)
    expect(body.capabilities.ltx.audio).toBe(true)
    expect(body.capabilities.wan.endImage).toBe(true)
    expect(body.capabilities.ltx.endImage).toBe(true)
  })
})
