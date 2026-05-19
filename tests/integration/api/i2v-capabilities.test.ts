import { cleanTables } from '../../helpers/db'
import { createUser } from '../../helpers/fixtures'
import { buildRequest, buildAuthenticatedRequest } from '../../helpers/auth'
import { createTestSession } from '../../helpers/auth'
import { seedLtxrSettings } from '../../helpers/ltxr-seed'
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
    await seedSettings({ 'wan.lora_enabled': 'true', 'ltxa.lora_enabled': 'true' })
    const user = await createUser()
    const session = await createTestSession(user.id)

    const res = await GET(buildAuthenticatedRequest('/api/i2v/capabilities', session.id))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.capabilities.wan.loraPresets).toBe(false)
    expect(body.capabilities.ltxa.loraPresets).toBe(false)
  })

  it('returns loraPresets false for LTXA when disabled', async () => {
    await seedSettings({ 'wan.lora_enabled': 'true', 'ltxa.lora_enabled': 'false' })
    const user = await createUser()
    const session = await createTestSession(user.id)

    const res = await GET(buildAuthenticatedRequest('/api/i2v/capabilities', session.id))
    const body = await res.json()

    expect(body.capabilities.wan.loraPresets).toBe(false)
    expect(body.capabilities.ltxa.loraPresets).toBe(false)
  })

  it('returns loraPresets false for WAN when disabled', async () => {
    await seedSettings({ 'wan.lora_enabled': 'false', 'ltxa.lora_enabled': 'true' })
    const user = await createUser()
    const session = await createTestSession(user.id)

    const res = await GET(buildAuthenticatedRequest('/api/i2v/capabilities', session.id))
    const body = await res.json()

    expect(body.capabilities.wan.loraPresets).toBe(false)
    expect(body.capabilities.ltxa.loraPresets).toBe(false)
  })

  it('returns durationOptions from settings for ltx-wan and registry for others', async () => {
    await seedSettings({ 'ltx-wan.duration_options': '5,6,7,8' })
    await prisma.systemSetting.deleteMany({
      where: { key: { in: ['wan.duration_options', 'ltxa.duration_options'] } },
    })
    const user = await createUser()
    const session = await createTestSession(user.id)

    const res = await GET(buildAuthenticatedRequest('/api/i2v/capabilities', session.id))
    const body = await res.json()

    expect(body.durationOptions['ltx-wan']).toEqual([5, 6, 7, 8])
    expect(body.durationOptions.wan).toEqual([5, 6, 7])
    expect(body.durationOptions.ltxa).toEqual([5, 6, 7])
  })

  it('returns only enabled models', async () => {
    await seedSettings({
      'wan.enabled': 'true',
      'ltxa.enabled': 'false',
      'ltx-wan.enabled': 'true',
    })
    const user = await createUser()
    const session = await createTestSession(user.id)

    const res = await GET(buildAuthenticatedRequest('/api/i2v/capabilities', session.id))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.enabledModels).toEqual(['wan', 'ltx-wan'])
  })

  it('returns LTXR capabilities through existing response contract', async () => {
    await seedLtxrSettings(prisma, { 'ltxr.enabled': false })
    const user = await createUser()
    const session = await createTestSession(user.id)

    const disabledRes = await GET(buildAuthenticatedRequest('/api/i2v/capabilities', session.id))
    const disabledBody = await disabledRes.json()

    expect(disabledRes.status).toBe(200)
    expect(disabledBody.enabledModels).not.toContain('ltxr')

    await seedLtxrSettings(prisma, { 'ltxr.enabled': true })

    const enabledRes = await GET(buildAuthenticatedRequest('/api/i2v/capabilities', session.id))
    const enabledBody = await enabledRes.json()

    expect(enabledRes.status).toBe(200)
    expect(enabledBody.enabledModels).toContain('ltxr')
    expect(enabledBody.capabilities.ltxr).toEqual({
      loraPresets: false,
      endImage: true,
      videoDuration: true,
      audio: true,
    })
    expect(enabledBody.durationOptions.ltxr).toEqual([5, 6, 7])
    expect(MODEL_REGISTRY.ltxr).toMatchObject({
      displayName: 'LTX(Real)',
      defaultSubfolder: 'LTXR',
      defaultDuration: 5,
    })
  })

  it('allows all models to be disabled', async () => {
    await seedSettings({
      'wan.enabled': 'false',
      'ltxa.enabled': 'false',
      'ltx-wan.enabled': 'false',
    })
    const user = await createUser()
    const session = await createTestSession(user.id)

    const res = await GET(buildAuthenticatedRequest('/api/i2v/capabilities', session.id))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.enabledModels).toEqual([])
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
      'ltxa.duration_options': '4,8,12',
      'ltx-wan.duration_options': '5,6,7,8',
    })
    const user = await createUser()
    const session = await createTestSession(user.id)

    const res = await GET(buildAuthenticatedRequest('/api/i2v/capabilities', session.id))
    const body = await res.json()

    expect(body.durationOptions.wan).toEqual([3, 5, 7, 9])
    expect(body.durationOptions.ltxa).toEqual([4, 8, 12])
    expect(body.durationOptions['ltx-wan']).toEqual([5, 6, 7, 8])
  })

  it('returns LTXA duration labels as actual seconds from frame settings', async () => {
    await seedSettings({
      'ltxa.duration_options': '24',
      'ltxa.frame_base': '8',
      'ltxa.frame_rate': '25',
    })
    const user = await createUser()
    const session = await createTestSession(user.id)

    const res = await GET(buildAuthenticatedRequest('/api/i2v/capabilities', session.id))
    const body = await res.json()

    expect(body.durationOptions.ltxa).toEqual([24])
    expect(body.durationLabels.ltxa['24']).toBe('7.7초')
    expect(body.durationLabels.wan['5']).toBe('5초')
  })

  it('falls back to registry durations when a model setting is missing', async () => {
    await prisma.systemSetting.deleteMany({
      where: { key: { in: ['wan.duration_options', 'ltxa.duration_options'] } },
    })
    const user = await createUser()
    const session = await createTestSession(user.id)

    const res = await GET(buildAuthenticatedRequest('/api/i2v/capabilities', session.id))
    const body = await res.json()

    expect(body.durationOptions.wan).toEqual(MODEL_REGISTRY.wan.durationOptions)
    expect(body.durationOptions.ltxa).toEqual(MODEL_REGISTRY.ltxa.durationOptions)
  })

  it('preserves other capabilities from registry', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)

    const res = await GET(buildAuthenticatedRequest('/api/i2v/capabilities', session.id))
    const body = await res.json()

    expect(body.capabilities.wan.audio).toBe(false)
    expect(body.capabilities.ltxa.audio).toBe(true)
    expect(body.capabilities.wan.endImage).toBe(true)
    expect(body.capabilities.ltxa.endImage).toBe(false)
  })

  it('disables LTXA end image capability from admin setting', async () => {
    await seedSettings({ 'ltxa.end_image_enabled': 'false' })
    const user = await createUser()
    const session = await createTestSession(user.id)

    const res = await GET(buildAuthenticatedRequest('/api/i2v/capabilities', session.id))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.capabilities.wan.endImage).toBe(true)
    expect(body.capabilities.ltxa.endImage).toBe(false)
    expect(body.capabilities['ltx-wan'].endImage).toBe(true)
  })

  it('enables LTXA end image capability from admin setting', async () => {
    await seedSettings({ 'ltxa.end_image_enabled': 'true' })
    const user = await createUser()
    const session = await createTestSession(user.id)

    const res = await GET(buildAuthenticatedRequest('/api/i2v/capabilities', session.id))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.capabilities.ltxa.endImage).toBe(true)
  })
})
