import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { cleanTables } from '../../helpers/db'
import { createUser, createAdminUser } from '../../helpers/fixtures'
import { createTestSession, buildRequest, buildAuthenticatedRequest } from '../../helpers/auth'
import { GET, PUT } from '@/app/api/admin/settings/route'
import { LTX_KEYS } from '@/lib/database/system-settings'

beforeEach(async () => {
  await cleanTables()
})

describe('LTX 2.3 rebuild migration parity', () => {
  it('contains every active LTX settings key required by LTX_KEYS', () => {
    const sql = [
      '20260512_ltx23_workflow_rebuild',
      '20260512_z_ltx_second_pass_anchor_settings',
      '20260512_zz_ltx_content_mode_lora_settings',
    ]
      .map((migration) =>
        readFileSync(
          join(process.cwd(), `prisma/migrations/${migration}/migration.sql`),
          'utf8'
        )
      )
      .join('\n')
    const preservedKeys = new Set(['ltx.enabled', 'ltx.lora_enabled'])
    const missing = Object.values(LTX_KEYS)
      .filter((key) => !preservedKeys.has(key))
      .filter((key) => !sql.includes(`'${key}'`))

    expect(missing).toEqual([])
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
    expect(Object.keys(body.ltx)).toEqual(expect.arrayContaining(Object.values(LTX_KEYS)))
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

  it('rejects removed standalone LTX setting keys', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)

    const rtxReq = buildAuthenticatedRequest('/api/admin/settings', session.id, {
      method: 'PUT',
      body: JSON.stringify({ key: 'ltx.rtx_enabled', value: 'true' }),
    })
    const rtxRes = await PUT(rtxReq)
    expect(rtxRes.status).toBe(400)

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

  it('updates LTX ID LoRA settings', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/settings', session.id, {
      method: 'PUT',
      body: JSON.stringify({
        key: 'ltx.id_lora_enabled',
        value: 'true',
        type: 'boolean',
        category: 'ltx',
      }),
    })
    const res = await PUT(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.setting.key).toBe('ltx.id_lora_enabled')
    expect(body.setting.value).toBe('true')
  })

  it('updates LTX content-mode LoRA settings', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/settings', session.id, {
      method: 'PUT',
      body: JSON.stringify({
        key: 'ltx.nsfw_lora_1_name',
        value: 'fake-admin-nsfw-lora.safetensors',
        type: 'string',
        category: 'ltx',
      }),
    })
    const res = await PUT(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.setting.key).toBe('ltx.nsfw_lora_1_name')
    expect(body.setting.value).toBe('fake-admin-nsfw-lora.safetensors')
  })

  it('updates LTX second-pass settings', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/settings', session.id, {
      method: 'PUT',
      body: JSON.stringify({
        key: 'ltx.second_pass_sigmas',
        value: 'fake-sigmas-from-admin',
        type: 'string',
        category: 'ltx',
      }),
    })
    const res = await PUT(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.setting.key).toBe('ltx.second_pass_sigmas')
    expect(body.setting.value).toBe('fake-sigmas-from-admin')
  })

  it('updates LTX second-pass anchor settings', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/settings', session.id, {
      method: 'PUT',
      body: JSON.stringify({
        key: 'ltx.second_pass_anchor_cache_mode',
        value: 'fake-second-pass-anchor-cache-mode-from-admin',
        type: 'string',
        category: 'ltx',
      }),
    })
    const res = await PUT(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.setting.key).toBe('ltx.second_pass_anchor_cache_mode')
    expect(body.setting.value).toBe('fake-second-pass-anchor-cache-mode-from-admin')
  })
})
