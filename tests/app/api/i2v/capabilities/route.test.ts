import { cleanTables } from '@tests/helpers/db'
import { createUser } from '@tests/helpers/fixtures'
import { buildRequest, buildAuthenticatedRequest } from '@tests/helpers/auth'
import { createTestSession } from '@tests/helpers/auth'
import { seedLtxrSettings } from '@tests/helpers/ltxr-seed'
import { seedH3Fl2va } from '@tests/helpers/h3-fl2va-seed'
import { seedH3Ref2va } from '@tests/helpers/h3-ref2va-seed'
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
      nsfw: false,
      startImageOptional: false,
      referenceInputs: false,
    })
    expect(enabledBody.durationOptions.ltxr).toEqual([5, 6, 7])
    expect(MODEL_REGISTRY.ltxr).toMatchObject({
      displayName: 'LTX(Real)',
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

  it('returns H3 FL2VA capabilities and duration labels from frame settings', async () => {
    await seedH3Fl2va()
    const user = await createUser()
    const session = await createTestSession(user.id)

    const res = await GET(buildAuthenticatedRequest('/api/i2v/capabilities', session.id))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.capabilities).toHaveProperty('h3-fl2va')
    expect(body.capabilities['h3-fl2va'].startImageOptional).toBe(true)
    expect(body.durationLabels['h3-fl2va']).toEqual({ 5: '5.3초', 7: '7.3초' })
  })

  it('returns H3 Ref2VA capabilities and duration labels from frame settings', async () => {
    await seedH3Ref2va()
    const user = await createUser()
    const session = await createTestSession(user.id)

    const res = await GET(buildAuthenticatedRequest('/api/i2v/capabilities', session.id))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.enabledModels).toContain('h3-ref2va')
    expect(body.capabilities['h3-ref2va']).toEqual({
      loraPresets: false,
      endImage: false,
      videoDuration: true,
      audio: false,
      nsfw: true,
      startImageOptional: false,
      referenceInputs: true,
    })
    expect(body.durationOptions['h3-ref2va']).toEqual([5, 7])
    expect(body.durationLabels['h3-ref2va']).toEqual({ 5: '5.3초', 7: '7.3초' })
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
    expect(body.capabilities.wan.nsfw).toBe(true)
    expect(body.capabilities.ltxa.nsfw).toBe(true)
    expect(body.capabilities.ltxr.nsfw).toBe(false)
    expect(body.capabilities['ltx-wan'].nsfw).toBe(true)
  })

  it('always reports LTXA end image capability as disabled', async () => {
    await seedSettings({ 'ltxa.end_image_enabled': 'true' })
    const user = await createUser()
    const session = await createTestSession(user.id)

    const res = await GET(buildAuthenticatedRequest('/api/i2v/capabilities', session.id))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.capabilities.ltxa.endImage).toBe(false)
    expect(body.capabilities.wan.endImage).toBe(true)
    expect(body.capabilities['ltx-wan'].endImage).toBe(true)
  })
})
