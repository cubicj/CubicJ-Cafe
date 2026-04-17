import { cleanTables } from '../../helpers/db'
import { createUser } from '../../helpers/fixtures'
import { buildRequest, buildAuthenticatedRequest } from '../../helpers/auth'
import { createTestSession } from '../../helpers/auth'
import { prisma } from '@/lib/database/prisma'

import { GET } from '@/app/api/i2v/capabilities/route'
import { MODEL_REGISTRY } from '@/lib/comfyui/workflows/registry'

async function seedSettings(settings: Record<string, string>) {
  for (const [key, value] of Object.entries(settings)) {
    await prisma.systemSetting.upsert({
      where: { key },
      create: { key, value, type: 'string', category: key.split('.')[0] },
      update: { value },
    })
  }
}

describe('GET /api/i2v/capabilities', () => {
  beforeEach(async () => {
    await cleanTables()
  })

  it('returns 401 when not authenticated', async () => {
    const res = await GET(buildRequest('/api/i2v/capabilities'))
    expect(res.status).toBe(401)
  })

  it('returns loraPresets false for both models (registry-disabled)', async () => {
    await seedSettings({ 'wan.lora_enabled': 'true', 'ltx.lora_enabled': 'true' })
    const user = await createUser()
    const session = await createTestSession(user.id)

    const res = await GET(buildAuthenticatedRequest('/api/i2v/capabilities', session.id))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.capabilities.wan.loraPresets).toBe(false)
    expect(body.capabilities.ltx.loraPresets).toBe(false)
  })

  it('returns loraPresets false for LTX when disabled', async () => {
    await seedSettings({ 'wan.lora_enabled': 'true', 'ltx.lora_enabled': 'false' })
    const user = await createUser()
    const session = await createTestSession(user.id)

    const res = await GET(buildAuthenticatedRequest('/api/i2v/capabilities', session.id))
    const body = await res.json()

    expect(body.capabilities.wan.loraPresets).toBe(false)
    expect(body.capabilities.ltx.loraPresets).toBe(false)
  })

  it('returns loraPresets false for WAN when disabled', async () => {
    await seedSettings({ 'wan.lora_enabled': 'false', 'ltx.lora_enabled': 'true' })
    const user = await createUser()
    const session = await createTestSession(user.id)

    const res = await GET(buildAuthenticatedRequest('/api/i2v/capabilities', session.id))
    const body = await res.json()

    expect(body.capabilities.wan.loraPresets).toBe(false)
    expect(body.capabilities.ltx.loraPresets).toBe(false)
  })

  it('returns durationOptions from settings for ltx-wan and registry for others', async () => {
    await seedSettings({ 'ltx-wan.duration_options': '5,6,7,8' })
    const user = await createUser()
    const session = await createTestSession(user.id)

    const res = await GET(buildAuthenticatedRequest('/api/i2v/capabilities', session.id))
    const body = await res.json()

    expect(body.durationOptions['ltx-wan']).toEqual([5, 6, 7, 8])
    expect(body.durationOptions.wan).toEqual([5, 6, 7])
    expect(body.durationOptions.ltx).toEqual([5, 6, 7])
  })

  it('falls back to registry durationOptions when setting missing', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)

    const res = await GET(buildAuthenticatedRequest('/api/i2v/capabilities', session.id))
    const body = await res.json()

    expect(body.durationOptions['ltx-wan']).toEqual([5, 6, 7, 8])
  })

  it('returns durationOptions for all three models from settings', async () => {
    await seedSettings({
      'wan.duration_options': '3,5,7,9',
      'ltx.duration_options': '4,8,12',
      'ltx-wan.duration_options': '5,6,7,8',
    })
    const user = await createUser()
    const session = await createTestSession(user.id)

    const res = await GET(buildAuthenticatedRequest('/api/i2v/capabilities', session.id))
    const body = await res.json()

    expect(body.durationOptions.wan).toEqual([3, 5, 7, 9])
    expect(body.durationOptions.ltx).toEqual([4, 8, 12])
    expect(body.durationOptions['ltx-wan']).toEqual([5, 6, 7, 8])
  })

  it('falls back to registry durations when a model setting is missing', async () => {
    await prisma.systemSetting.deleteMany({
      where: { key: { in: ['wan.duration_options', 'ltx.duration_options'] } },
    })
    const user = await createUser()
    const session = await createTestSession(user.id)

    const res = await GET(buildAuthenticatedRequest('/api/i2v/capabilities', session.id))
    const body = await res.json()

    expect(body.durationOptions.wan).toEqual(MODEL_REGISTRY.wan.durationOptions)
    expect(body.durationOptions.ltx).toEqual(MODEL_REGISTRY.ltx.durationOptions)
  })

  it('preserves other capabilities from registry', async () => {
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
