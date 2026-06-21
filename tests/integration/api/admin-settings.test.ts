import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { cleanTables } from '../../helpers/db'
import { createUser, createAdminUser } from '../../helpers/fixtures'
import { createTestSession, buildRequest, buildAuthenticatedRequest } from '../../helpers/auth'
import { GET, PUT } from '@/app/api/admin/settings/route'
import { prisma } from '@/lib/database/prisma'
import { LTXA_KEYS } from '@/lib/database/system-settings'

beforeEach(async () => {
  await cleanTables()
})

describe('LTX 2.3 rebuild migration parity', () => {
  it('contains every active LTXA settings key required by LTXA_KEYS migration rows', () => {
    const sql = [
      '20260512_ltx23_workflow_rebuild',
      '20260512_z_ltx_second_pass_anchor_settings',
      '20260512_zz_ltx_content_mode_lora_settings',
      '20260514_ltx_end_image_enabled',
      '20260516_ltx_rtx_upscale_settings',
      '20260518_ltx_dynamic_lora_chains',
      '20260520_ltx_sage_attention_settings',
      '20260530_ltx_preprocess_sampler_refresh',
      '20260621_ltxa_source_topology_refresh',
      '20260621_zz_ltxa_distilled_lora_settings',
    ]
      .map((migration) =>
        readFileSync(
          join(process.cwd(), `prisma/migrations/${migration}/migration.sql`),
          'utf8'
        )
      )
      .join('\n')
    const preservedKeys = new Set(['ltxa.enabled', 'ltxa.lora_enabled'])
    const missing = Object.values(LTXA_KEYS)
      .filter((key) => !preservedKeys.has(key))
      .filter((key) => {
        const legacyKey = key.replace('ltxa.', 'ltx.')
        return !sql.includes(`'${legacyKey}'`) && !sql.includes(`'${key}'`)
      })

    expect(missing).toEqual([])
  })

  it('migrates legacy LTX LoRA slots into dynamic chains', async () => {
    const migrationSql = readFileSync(
      join(process.cwd(), 'prisma/migrations/20260518_ltx_dynamic_lora_chains/migration.sql'),
      'utf8'
    )
    const legacyRows = (mode: 'sfw' | 'nsfw', slot: number, enabled: boolean) => [
      { key: `ltx.${mode}_lora_${slot}_enabled`, value: String(enabled), type: 'boolean', category: 'ltx' },
      { key: `ltx.${mode}_lora_${slot}_name`, value: `fake-legacy-${mode}-${slot}.safetensors`, type: 'string', category: 'ltx' },
      { key: `ltx.${mode}_lora_${slot}_strength`, value: `0.${slot}1`, type: 'number', category: 'ltx' },
      { key: `ltx.${mode}_lora_${slot}_video`, value: `0.${slot}2`, type: 'number', category: 'ltx' },
      { key: `ltx.${mode}_lora_${slot}_video_to_audio`, value: `0.${slot}3`, type: 'number', category: 'ltx' },
      { key: `ltx.${mode}_lora_${slot}_audio`, value: `0.${slot}4`, type: 'number', category: 'ltx' },
      { key: `ltx.${mode}_lora_${slot}_audio_to_video`, value: `0.${slot}5`, type: 'number', category: 'ltx' },
      { key: `ltx.${mode}_lora_${slot}_other`, value: `0.${slot}6`, type: 'number', category: 'ltx' },
    ]

    await prisma.systemSetting.createMany({
      data: [
        ...[1, 2, 3, 4].flatMap((slot) => legacyRows('sfw', slot, slot !== 2)),
        ...[1, 2, 3, 4].flatMap((slot) => legacyRows('nsfw', slot, slot === 2)),
      ],
    })

    for (const statement of migrationSql.split(';').map((item) => item.trim()).filter(Boolean)) {
      await prisma.$executeRawUnsafe(statement)
    }

    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: ['ltx.sfw_lora_chain', 'ltx.nsfw_lora_chain'] } },
    })
    const map = new Map(settings.map((setting) => [setting.key, setting.value]))
    const sfw = JSON.parse(map.get('ltx.sfw_lora_chain')!)
    const nsfw = JSON.parse(map.get('ltx.nsfw_lora_chain')!)

    expect(sfw.map((item: { id: string }) => item.id)).toEqual([
      'legacy-sfw-lora-3',
      'legacy-sfw-lora-2',
      'legacy-sfw-lora-4',
      'legacy-sfw-lora-1',
    ])
    expect(nsfw.map((item: { id: string }) => item.id)).toEqual([
      'legacy-nsfw-lora-3',
      'legacy-nsfw-lora-2',
      'legacy-nsfw-lora-4',
      'legacy-nsfw-lora-1',
    ])
    expect(sfw[1]).toMatchObject({
      id: 'legacy-sfw-lora-2',
      enabled: false,
      name: 'fake-legacy-sfw-2.safetensors',
      strength: 0.21,
      video: 0.22,
      videoToAudio: 0.23,
      audio: 0.24,
      audioToVideo: 0.25,
      other: 0.26,
    })
    expect(nsfw[1]).toMatchObject({
      id: 'legacy-nsfw-lora-2',
      enabled: true,
      name: 'fake-legacy-nsfw-2.safetensors',
    })
    expect(typeof sfw[1].enabled).toBe('boolean')
    expect(typeof sfw[1].strength).toBe('number')
  })

  it('migrates standalone LTX ids and settings to LTXA', async () => {
    const migrationSql = readFileSync(
      join(process.cwd(), 'prisma/migrations/20260519_ltxa_model_id_migration/migration.sql'),
      'utf8'
    )

    await prisma.systemSetting.deleteMany({
      where: { OR: [{ key: { startsWith: 'ltxa.' } }, { category: 'ltxa' }] },
    })
    await prisma.queueRequest.create({
      data: {
        userId: (await createUser()).id,
        nickname: 'tester',
        prompt: 'fake prompt',
        imageFile: 'fake.png',
        videoModel: 'ltx',
      },
    })
    await prisma.systemSetting.upsert({
      where: { key: 'ltx.enabled' },
      create: { key: 'ltx.enabled', value: 'true', type: 'boolean', category: 'ltx' },
      update: { value: 'true', type: 'boolean', category: 'ltx' },
    })
    await prisma.systemSetting.upsert({
      where: { key: 'ltx.duration_options' },
      create: { key: 'ltx.duration_options', value: '4,8,12', type: 'string', category: 'ltx' },
      update: { value: '4,8,12', type: 'string', category: 'ltx' },
    })

    for (const statement of migrationSql.split(';').map((item) => item.trim()).filter(Boolean)) {
      await prisma.$executeRawUnsafe(statement)
    }

    const legacySettings = await prisma.systemSetting.findMany({
      where: { OR: [{ key: { startsWith: 'ltx.' } }, { category: 'ltx' }] },
    })
    const ltxaEnabled = await prisma.systemSetting.findUnique({ where: { key: 'ltxa.enabled' } })
    const ltxaDurationOptions = await prisma.systemSetting.findUnique({ where: { key: 'ltxa.duration_options' } })
    const queueRows = await prisma.queueRequest.findMany({ select: { videoModel: true } })

    expect(legacySettings).toEqual([])
    expect(ltxaEnabled?.value).toBe('true')
    expect(ltxaDurationOptions?.value).toBe('4,8,12')
    expect(queueRows.map((row) => row.videoModel)).toEqual(['ltxa'])
  })
})

describe('GET /api/admin/settings', () => {
  it('returns 401 when not authenticated', async () => {
    const req = buildRequest('/api/admin/settings')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-admin user', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const req = buildAuthenticatedRequest('/api/admin/settings', session.id)
    const res = await GET(req)
    expect(res.status).toBe(403)
  })

  it('returns settings for admin', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/settings', session.id)
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(typeof body).toBe('object')
    expect(Object.keys(body.ltxa)).toEqual(expect.arrayContaining(Object.values(LTXA_KEYS)))
  })
})

describe('PUT /api/admin/settings', () => {
  it('returns 401 when not authenticated', async () => {
    const req = buildRequest('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({ key: 'wan.shift', value: '5' }),
    })
    const res = await PUT(req)
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-admin user', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const req = buildAuthenticatedRequest('/api/admin/settings', session.id, {
      method: 'PUT',
      body: JSON.stringify({ key: 'wan.shift', value: '5' }),
    })
    const res = await PUT(req)
    expect(res.status).toBe(403)
  })

  it('creates/updates a setting for admin', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/settings', session.id, {
      method: 'PUT',
      body: JSON.stringify({ key: 'wan.shift', value: '5', category: 'wan' }),
    })
    const res = await PUT(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.message).toBeDefined()
    expect(body.setting.key).toBe('wan.shift')
    expect(body.setting.value).toBe('5')
  })

  it('rejects unknown setting key', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/settings', session.id, {
      method: 'PUT',
      body: JSON.stringify({ key: 'arbitrary_key', value: 'bad' }),
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it('allows LTXA RTX settings', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)

    const rtxReq = buildAuthenticatedRequest('/api/admin/settings', session.id, {
      method: 'PUT',
      body: JSON.stringify({ key: 'ltxa.rtx_enabled', value: 'true' }),
    })
    const rtxRes = await PUT(rtxReq)
    expect(rtxRes.status).toBe(200)
  })

  it('rejects removed standalone LTX setting keys', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)

    const scheduledCfgReq = buildAuthenticatedRequest('/api/admin/settings', session.id, {
      method: 'PUT',
      body: JSON.stringify({ key: 'ltx.scheduled_cfg', value: '2.2' }),
    })
    const scheduledCfgRes = await PUT(scheduledCfgReq)
    expect(scheduledCfgRes.status).toBe(400)

    const oldLoraReq = buildAuthenticatedRequest('/api/admin/settings', session.id, {
      method: 'PUT',
      body: JSON.stringify({ key: 'ltx.lora_1_name', value: 'legacy' }),
    })
    const oldLoraRes = await PUT(oldLoraReq)
    expect(oldLoraRes.status).toBe(400)
  })

  it('returns 400 with missing key or value', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)

    const req1 = buildAuthenticatedRequest('/api/admin/settings', session.id, {
      method: 'PUT',
      body: JSON.stringify({ value: 'val' }),
    })
    const res1 = await PUT(req1)
    expect(res1.status).toBe(400)

    const req2 = buildAuthenticatedRequest('/api/admin/settings', session.id, {
      method: 'PUT',
      body: JSON.stringify({ key: 'wan.shift' }),
    })
    const res2 = await PUT(req2)
    expect(res2.status).toBe(400)
  })

  it('batch updates multiple settings', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/settings', session.id, {
      method: 'PUT',
      body: JSON.stringify({
        settings: [
          { key: 'wan.shift', value: '5' },
          { key: 'wan.scheduler', value: 'simple' },
        ],
      }),
    })
    const res = await PUT(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.settings).toHaveLength(2)
  })

  it('updates model enabled settings', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/settings', session.id, {
      method: 'PUT',
      body: JSON.stringify({
        key: 'ltx-wan.enabled',
        value: 'false',
        type: 'boolean',
        category: 'ltx-wan',
      }),
    })
    const res = await PUT(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.setting.key).toBe('ltx-wan.enabled')
    expect(body.setting.value).toBe('false')
  })

  it('updates LTXA ID LoRA settings', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/settings', session.id, {
      method: 'PUT',
      body: JSON.stringify({
        key: 'ltxa.id_lora_enabled',
        value: 'true',
        type: 'boolean',
        category: 'ltxa',
      }),
    })
    const res = await PUT(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.setting.key).toBe('ltxa.id_lora_enabled')
    expect(body.setting.value).toBe('true')
  })

  it('updates LTXA dynamic LoRA chain settings', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const value = JSON.stringify([
      {
        id: 'fake-chain-item-1',
        enabled: true,
        name: 'fake-admin-ltx-lora-a.safetensors',
        strength: 0.7,
        video: 1,
        videoToAudio: 0.6,
        audio: 0.5,
        audioToVideo: 0.8,
        other: 0,
      },
    ])
    const req = buildAuthenticatedRequest('/api/admin/settings', session.id, {
      method: 'PUT',
      body: JSON.stringify({
        key: 'ltxa.nsfw_lora_chain',
        value,
        type: 'string',
        category: 'ltxa',
      }),
    })
    const res = await PUT(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.setting.key).toBe('ltxa.nsfw_lora_chain')
    expect(body.setting.value).toBe(value)
  })

  it('updates LTXA second-pass settings', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/settings', session.id, {
      method: 'PUT',
      body: JSON.stringify({
        key: 'ltxa.second_pass_sigmas',
        value: 'fake-sigmas-from-admin',
        type: 'string',
        category: 'ltxa',
      }),
    })
    const res = await PUT(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.setting.key).toBe('ltxa.second_pass_sigmas')
    expect(body.setting.value).toBe('fake-sigmas-from-admin')
  })

  it('updates LTXA second-pass anchor settings', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/settings', session.id, {
      method: 'PUT',
      body: JSON.stringify({
        key: 'ltxa.second_pass_anchor_cache_mode',
        value: 'fake-second-pass-anchor-cache-mode-from-admin',
        type: 'string',
        category: 'ltxa',
      }),
    })
    const res = await PUT(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.setting.key).toBe('ltxa.second_pass_anchor_cache_mode')
    expect(body.setting.value).toBe('fake-second-pass-anchor-cache-mode-from-admin')
  })

  it('updates LTXA end image capability setting', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/settings', session.id, {
      method: 'PUT',
      body: JSON.stringify({
        key: 'ltxa.end_image_enabled',
        value: 'true',
        type: 'boolean',
        category: 'ltxa',
      }),
    })
    const res = await PUT(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.setting.key).toBe('ltxa.end_image_enabled')
    expect(body.setting.value).toBe('true')
  })
})
