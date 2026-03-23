import { cleanTables } from '../../helpers/db'
import { createUser } from '../../helpers/fixtures'
import { createTestSession, buildRequest, buildAuthenticatedRequest } from '../../helpers/auth'
import { prisma } from '@/lib/database/prisma'

import { GET } from '@/app/api/lora-bundles/route'

beforeEach(async () => {
  await cleanTables()
})

describe('GET /api/lora-bundles', () => {
  it('returns 401 when not authenticated', async () => {
    const req = buildRequest('/api/lora-bundles')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns empty list when no bundles exist', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const req = buildAuthenticatedRequest('/api/lora-bundles', session.id)
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.bundles).toEqual([])
    expect(body.count).toBe(0)
  })

  it('returns bundles sorted by displayName', async () => {
    await prisma.loRABundle.createMany({
      data: [
        { displayName: 'Zebra Bundle', highLoRAFilename: 'zebra_high.safetensors', lowLoRAFilename: 'zebra_low.safetensors' },
        { displayName: 'Alpha Bundle', highLoRAFilename: 'alpha_high.safetensors', lowLoRAFilename: 'alpha_low.safetensors' },
        { displayName: 'Middle Bundle', highLoRAFilename: 'mid_high.safetensors', lowLoRAFilename: 'mid_low.safetensors' },
      ],
    })

    const user = await createUser()
    const session = await createTestSession(user.id)
    const req = buildAuthenticatedRequest('/api/lora-bundles', session.id)
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.count).toBe(3)
    expect(body.bundles[0].displayName).toBe('Alpha Bundle')
    expect(body.bundles[1].displayName).toBe('Middle Bundle')
    expect(body.bundles[2].displayName).toBe('Zebra Bundle')
  })
})
