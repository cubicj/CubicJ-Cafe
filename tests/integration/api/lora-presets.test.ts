import { vi } from 'vitest'
import { cleanTables } from '../../helpers/db'
import { createUser } from '../../helpers/fixtures'
import { buildRequest } from '../../helpers/auth'
import type { User } from '@prisma/client'

vi.mock('@/lib/auth/server', () => ({
  getServerSession: vi.fn(),
}))

import { getServerSession } from '@/lib/auth/server'
import { GET, POST } from '@/app/api/lora-presets/route'
import {
  GET as GET_BY_ID,
  PUT,
  DELETE,
} from '@/app/api/lora-presets/[id]/route'

const mockedGetServerSession = vi.mocked(getServerSession)

const LORA_ITEMS = [
  { loraFilename: 'test-lora-1.safetensors', loraName: 'Test LoRA 1', strength: 0.8, group: 'HIGH' as const },
  { loraFilename: 'test-lora-2.safetensors', loraName: 'Test LoRA 2', strength: 0.6, group: 'LOW' as const },
]

function mockSession(user: User) {
  mockedGetServerSession.mockResolvedValue({
    user: {
      id: String(user.id),
      discordId: user.discordId,
      discordUsername: user.discordUsername,
      nickname: user.nickname,
      avatar: user.avatar || undefined,
      name: user.discordUsername,
      image: null,
    },
  })
}

function mockNoSession() {
  mockedGetServerSession.mockResolvedValue(null)
}

async function createPresetViaAPI(name: string, loraItems = LORA_ITEMS) {
  const req = buildRequest('/api/lora-presets', {
    method: 'POST',
    body: JSON.stringify({ name, loraItems }),
  })
  const res = await POST(req)
  return res.json()
}

beforeEach(async () => {
  await cleanTables()
  mockedGetServerSession.mockReset()
})

describe('GET /api/lora-presets', () => {
  it('returns 401 when not authenticated', async () => {
    mockNoSession()
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("returns user's presets", async () => {
    const user = await createUser()
    mockSession(user)

    await createPresetViaAPI('My Preset')

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.presets.length).toBeGreaterThanOrEqual(1)

    const found = body.presets.find((p: { name: string }) => p.name === 'My Preset')
    expect(found).toBeDefined()
    expect(found.loraItems).toHaveLength(2)
  })
})

describe('POST /api/lora-presets', () => {
  it('returns 401 when not authenticated', async () => {
    mockNoSession()
    const req = buildRequest('/api/lora-presets', {
      method: 'POST',
      body: JSON.stringify({ name: 'test', loraItems: LORA_ITEMS }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('creates preset with name and lora items', async () => {
    const user = await createUser()
    mockSession(user)

    const req = buildRequest('/api/lora-presets', {
      method: 'POST',
      body: JSON.stringify({ name: 'New Preset', loraItems: LORA_ITEMS }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.preset.name).toBe('New Preset')
    expect(body.preset.loraItems).toHaveLength(2)
    expect(body.preset.loraItems[0].loraFilename).toBe('test-lora-1.safetensors')
  })

  it('returns 400 when name is missing', async () => {
    const user = await createUser()
    mockSession(user)

    const req = buildRequest('/api/lora-presets', {
      method: 'POST',
      body: JSON.stringify({ name: '', loraItems: LORA_ITEMS }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

describe('GET /api/lora-presets/[id]', () => {
  it('returns 401 when not authenticated', async () => {
    mockNoSession()
    const req = buildRequest('/api/lora-presets/some-id')
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: 'some-id' }) })
    expect(res.status).toBe(401)
  })

  it('returns preset by id', async () => {
    const user = await createUser()
    mockSession(user)

    const created = await createPresetViaAPI('Fetch Me')

    const req = buildRequest(`/api/lora-presets/${created.preset.id}`)
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: created.preset.id }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.preset.name).toBe('Fetch Me')
    expect(body.preset.loraItems).toHaveLength(2)
  })

  it('returns 404 for non-existent id', async () => {
    const user = await createUser()
    mockSession(user)

    const req = buildRequest('/api/lora-presets/nonexistent')
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: 'nonexistent' }) })
    expect(res.status).toBe(404)
  })
})

describe('PUT /api/lora-presets/[id]', () => {
  it('updates preset name and items', async () => {
    const user = await createUser()
    mockSession(user)

    const created = await createPresetViaAPI('Original')

    const updatedItems = [
      { loraFilename: 'updated-lora.safetensors', loraName: 'Updated LoRA', strength: 1.0, group: 'LOW' as const },
    ]

    const req = buildRequest(`/api/lora-presets/${created.preset.id}`, {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated', loraItems: updatedItems }),
    })
    const res = await PUT(req, { params: Promise.resolve({ id: created.preset.id }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.preset.name).toBe('Updated')
    expect(body.preset.loraItems).toHaveLength(1)
    expect(body.preset.loraItems[0].loraFilename).toBe('updated-lora.safetensors')
  })

  it('returns error for non-existent id', async () => {
    const user = await createUser()
    mockSession(user)

    const req = buildRequest('/api/lora-presets/nonexistent', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Nope' }),
    })
    const res = await PUT(req, { params: Promise.resolve({ id: 'nonexistent' }) })
    expect(res.status).toBeGreaterThanOrEqual(400)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })
})

describe('DELETE /api/lora-presets/[id]', () => {
  it('deletes own preset', async () => {
    const user = await createUser()
    mockSession(user)

    const created = await createPresetViaAPI('Delete Me')

    const req = buildRequest(`/api/lora-presets/${created.preset.id}`, {
      method: 'DELETE',
    })
    const res = await DELETE(req, { params: Promise.resolve({ id: created.preset.id }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)

    const checkReq = buildRequest(`/api/lora-presets/${created.preset.id}`)
    const checkRes = await GET_BY_ID(checkReq, { params: Promise.resolve({ id: created.preset.id }) })
    expect(checkRes.status).toBe(404)
  })

  it('returns error for non-existent id', async () => {
    const user = await createUser()
    mockSession(user)

    const req = buildRequest('/api/lora-presets/nonexistent', {
      method: 'DELETE',
    })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'nonexistent' }) })
    expect(res.status).toBeGreaterThanOrEqual(400)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })
})
