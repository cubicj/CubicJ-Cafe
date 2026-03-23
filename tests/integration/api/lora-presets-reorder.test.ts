import { cleanTables } from '../../helpers/db'
import { createUser, OTHER_USER } from '../../helpers/fixtures'
import { createTestSession, buildRequest, buildAuthenticatedRequest } from '../../helpers/auth'
import { prisma } from '@/lib/database/prisma'

import { PUT } from '@/app/api/lora-presets/reorder/route'

beforeEach(async () => {
  await cleanTables()
})

async function createPreset(userId: number, name: string, order: number) {
  return prisma.loRAPreset.create({
    data: {
      userId,
      name,
      order,
      model: 'wan',
      isPublic: false,
    },
  })
}

describe('PUT /api/lora-presets/reorder', () => {
  it('returns 401 when not authenticated', async () => {
    const req = buildRequest('/api/lora-presets/reorder', {
      method: 'PUT',
      body: JSON.stringify({ presetIds: ['id1'] }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await PUT(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid body', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const req = buildAuthenticatedRequest('/api/lora-presets/reorder', session.id, {
      method: 'PUT',
      body: 'not json',
      headers: { 'content-type': 'application/json' },
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when presetIds is empty', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const req = buildAuthenticatedRequest('/api/lora-presets/reorder', session.id, {
      method: 'PUT',
      body: JSON.stringify({ presetIds: [] }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it('returns 403 when preset belongs to another user', async () => {
    const user = await createUser()
    const otherUser = await createUser(OTHER_USER)
    const otherPreset = await createPreset(otherUser.id, 'Other Preset', 0)

    const session = await createTestSession(user.id)
    const req = buildAuthenticatedRequest('/api/lora-presets/reorder', session.id, {
      method: 'PUT',
      body: JSON.stringify({ presetIds: [otherPreset.id] }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await PUT(req)
    expect(res.status).toBe(403)
  })

  it('reorders presets successfully', async () => {
    const user = await createUser()
    const preset1 = await createPreset(user.id, 'First', 0)
    const preset2 = await createPreset(user.id, 'Second', 1)
    const preset3 = await createPreset(user.id, 'Third', 2)

    const session = await createTestSession(user.id)
    const req = buildAuthenticatedRequest('/api/lora-presets/reorder', session.id, {
      method: 'PUT',
      body: JSON.stringify({ presetIds: [preset3.id, preset1.id, preset2.id] }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await PUT(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    const updated = await prisma.loRAPreset.findMany({
      where: { userId: user.id },
      orderBy: { order: 'asc' },
    })
    expect(updated[0].id).toBe(preset3.id)
    expect(updated[0].order).toBe(0)
    expect(updated[1].id).toBe(preset1.id)
    expect(updated[1].order).toBe(1)
    expect(updated[2].id).toBe(preset2.id)
    expect(updated[2].order).toBe(2)
  })
})
