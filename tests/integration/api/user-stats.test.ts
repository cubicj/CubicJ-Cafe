import { vi } from 'vitest'
import { cleanTables } from '../../helpers/db'
import { createUser, createQueueRequest } from '../../helpers/fixtures'

const mockGetServerSession = vi.fn()
vi.mock('@/lib/auth/server', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}))

import { GET } from '@/app/api/user/stats/route'

beforeEach(async () => {
  await cleanTables()
  mockGetServerSession.mockReset()
})

describe('GET /api/user/stats', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns zero stats for new user', async () => {
    const user = await createUser()
    mockGetServerSession.mockResolvedValue({
      user: { id: user.id, discordId: user.discordId, discordUsername: user.discordUsername, nickname: user.nickname },
    })
    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.totalQueueRequests).toBe(0)
    expect(body.loraPresetCount).toBe(0)
  })

  it('returns correct queue request count after creating requests', async () => {
    const user = await createUser()
    await createQueueRequest(user.id)
    await createQueueRequest(user.id, { prompt: 'second prompt', position: 2 })

    mockGetServerSession.mockResolvedValue({
      user: { id: user.id, discordId: user.discordId, discordUsername: user.discordUsername, nickname: user.nickname },
    })
    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.totalQueueRequests).toBe(2)
  })
})
