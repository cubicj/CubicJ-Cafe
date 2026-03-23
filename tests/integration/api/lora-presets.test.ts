import { cleanTables } from '../../helpers/db'
import { createUser } from '../../helpers/fixtures'
import { createTestSession, buildRequest, buildAuthenticatedRequest } from '../../helpers/auth'

import { GET, POST } from '@/app/api/lora-presets/route'
import {
  GET as GET_BY_ID,
  PUT,
  DELETE,
} from '@/app/api/lora-presets/[id]/route'

const LORA_ITEMS = [
  { loraFilename: 'test-lora-1.safetensors', loraName: 'Test LoRA 1', strength: 0.8, group: 'HIGH' as const },
  { loraFilename: 'test-lora-2.safetensors', loraName: 'Test LoRA 2', strength: 0.6, group: 'LOW' as const },
]

let sessionId: string

async function createPresetViaAPI(name: string, loraItems = LORA_ITEMS, model?: string) {
  const req = buildAuthenticatedRequest('/api/lora-presets', sessionId, {
    method: 'POST',
    body: JSON.stringify({ name, loraItems, model }),
  })
  const res = await POST(req)
  return res.json()
}

beforeEach(async () => {
  await cleanTables()
})

describe('GET /api/lora-presets', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await GET(buildRequest('/api/lora-presets'))
    expect(res.status).toBe(401)
  })

  it("returns user's presets", async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    sessionId = session.id

    await createPresetViaAPI('My Preset')

    const res = await GET(buildAuthenticatedRequest('/api/lora-presets', sessionId))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.presets.length).toBeGreaterThanOrEqual(1)

    const found = body.presets.find((p: { name: string }) => p.name === 'My Preset')
    expect(found).toBeDefined()
    expect(found.loraItems).toHaveLength(2)
  })
})

describe('POST /api/lora-presets', () => {
  it('returns 401 when not authenticated', async () => {
    const req = buildRequest('/api/lora-presets', {
      method: 'POST',
      body: JSON.stringify({ name: 'test', loraItems: LORA_ITEMS }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('creates preset with name and lora items', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    sessionId = session.id

    const req = buildAuthenticatedRequest('/api/lora-presets', sessionId, {
      method: 'POST',
      body: JSON.stringify({ name: 'New Preset', loraItems: LORA_ITEMS }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.preset.name).toBe('New Preset')
    expect(body.preset.loraItems).toHaveLength(2)
    expect(body.preset.loraItems[0].loraFilename).toBe('test-lora-1.safetensors')
  })

  it('returns 400 when name is missing', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)

    const req = buildAuthenticatedRequest('/api/lora-presets', session.id, {
      method: 'POST',
      body: JSON.stringify({ name: '', loraItems: LORA_ITEMS }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

describe('GET /api/lora-presets/[id]', () => {
  it('returns 401 when not authenticated', async () => {
    const req = buildRequest('/api/lora-presets/some-id')
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: 'some-id' }) })
    expect(res.status).toBe(401)
  })

  it('returns preset by id', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    sessionId = session.id

    const created = await createPresetViaAPI('Fetch Me')

    const req = buildAuthenticatedRequest(`/api/lora-presets/${created.preset.id}`, sessionId)
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: created.preset.id }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.preset.name).toBe('Fetch Me')
    expect(body.preset.loraItems).toHaveLength(2)
  })

  it('returns 404 for non-existent id', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)

    const req = buildAuthenticatedRequest('/api/lora-presets/nonexistent', session.id)
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: 'nonexistent' }) })
    expect(res.status).toBe(404)
  })
})

describe('PUT /api/lora-presets/[id]', () => {
  it('updates preset name and items', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    sessionId = session.id

    const created = await createPresetViaAPI('Original')

    const updatedItems = [
      { loraFilename: 'updated-lora.safetensors', loraName: 'Updated LoRA', strength: 1.0, group: 'LOW' as const },
    ]

    const req = buildAuthenticatedRequest(`/api/lora-presets/${created.preset.id}`, sessionId, {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated', loraItems: updatedItems }),
    })
    const res = await PUT(req, { params: Promise.resolve({ id: created.preset.id }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.preset.name).toBe('Updated')
    expect(body.preset.loraItems).toHaveLength(1)
    expect(body.preset.loraItems[0].loraFilename).toBe('updated-lora.safetensors')
  })

  it('returns error for non-existent id', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)

    const req = buildAuthenticatedRequest('/api/lora-presets/nonexistent', session.id, {
      method: 'PUT',
      body: JSON.stringify({ name: 'Nope' }),
    })
    const res = await PUT(req, { params: Promise.resolve({ id: 'nonexistent' }) })
    expect(res.status).toBeGreaterThanOrEqual(400)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })
})

describe('model-scoped presets', () => {
  it('GET filters presets by model query param', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    sessionId = session.id

    await createPresetViaAPI('WAN Preset', [{ loraFilename: 'wan-lora.safetensors', loraName: 'WAN', strength: 0.8, group: 'HIGH' as const }], 'wan')
    await createPresetViaAPI('LTX Preset', [{ loraFilename: 'ltx-lora.safetensors', loraName: 'LTX', strength: 0.7, group: 'HIGH' as const }], 'ltx')

    const wanRes = await GET(buildAuthenticatedRequest('/api/lora-presets?model=wan', sessionId))
    const wanData = await wanRes.json()
    const userWanPresets = wanData.presets.filter((p: any) => !p.isDefault && !p.isPublic)
    expect(userWanPresets.every((p: any) => p.model === 'wan')).toBe(true)

    const ltxRes = await GET(buildAuthenticatedRequest('/api/lora-presets?model=ltx', sessionId))
    const ltxData = await ltxRes.json()
    expect(ltxData.presets.every((p: any) => p.model === 'ltx')).toBe(true)
  })

  it('GET defaults to wan when no model param', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)

    const res = await GET(buildAuthenticatedRequest('/api/lora-presets', session.id))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.presets).toBeDefined()
  })

  it('POST stores model field on preset', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)

    const req = buildAuthenticatedRequest('/api/lora-presets', session.id, {
      method: 'POST',
      body: JSON.stringify({
        name: 'LTX Test',
        model: 'ltx',
        loraItems: [{ loraFilename: 'test.safetensors', loraName: 'Test', strength: 0.5, group: 'HIGH', order: 0 }],
      }),
    })
    const res = await POST(req)
    const data = await res.json()
    expect(data.preset.model).toBe('ltx')
  })
})

describe('DELETE /api/lora-presets/[id]', () => {
  it('deletes own preset', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    sessionId = session.id

    const created = await createPresetViaAPI('Delete Me')

    const req = buildAuthenticatedRequest(`/api/lora-presets/${created.preset.id}`, sessionId, {
      method: 'DELETE',
    })
    const res = await DELETE(req, { params: Promise.resolve({ id: created.preset.id }) })

    expect(res.status).toBe(200)
    const checkReq = buildAuthenticatedRequest(`/api/lora-presets/${created.preset.id}`, sessionId)
    const checkRes = await GET_BY_ID(checkReq, { params: Promise.resolve({ id: created.preset.id }) })
    expect(checkRes.status).toBe(404)
  })

  it('returns error for non-existent id', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)

    const req = buildAuthenticatedRequest('/api/lora-presets/nonexistent', session.id, {
      method: 'DELETE',
    })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'nonexistent' }) })
    expect(res.status).toBeGreaterThanOrEqual(400)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })
})
