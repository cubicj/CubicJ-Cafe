import { cleanTables } from '../../helpers/db'
import { createUser, createQueueRequest } from '../../helpers/fixtures'
import { createTestSession, buildRequest, buildAuthenticatedRequest } from '../../helpers/auth'

import { GET } from '@/app/api/user/stats/route'

beforeEach(async () => {
  await cleanTables()
})

describe('GET /api/user/stats', () => {
  it('returns 401 when not authenticated', async () => {
    const req = buildRequest('/api/user/stats')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns zero stats for new user', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const req = buildAuthenticatedRequest('/api/user/stats', session.id)
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.totalQueueRequests).toBe(0)
    expect(body.loraPresetCount).toBe(0)
  })

  it('returns correct queue request count after creating requests', async () => {
    const user = await createUser()
    await createQueueRequest(user.id)
    await createQueueRequest(user.id, { prompt: 'second prompt', position: 2 })

    const session = await createTestSession(user.id)
    const req = buildAuthenticatedRequest('/api/user/stats', session.id)
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.totalQueueRequests).toBe(2)
  })
})
