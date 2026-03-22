import { cleanTables } from '../../helpers/db'
import { createUser } from '../../helpers/fixtures'
import { createTestSession, buildAuthenticatedRequest, buildRequest } from '../../helpers/auth'
import { GET, POST } from '@/app/api/setup/nickname/route'

beforeEach(async () => {
  await cleanTables()
})

describe('POST /api/setup/nickname', () => {
  it('returns 401 when not authenticated', async () => {
    const req = buildRequest('/api/setup/nickname', {
      method: 'POST',
      body: JSON.stringify({ nickname: 'NewNick' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('updates nickname successfully', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const req = buildAuthenticatedRequest('/api/setup/nickname', session.id, {
      method: 'POST',
      body: JSON.stringify({ nickname: 'NewNickname' }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.user.nickname).toBe('NewNickname')
  })

  it('rejects nickname shorter than 2 characters', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const req = buildAuthenticatedRequest('/api/setup/nickname', session.id, {
      method: 'POST',
      body: JSON.stringify({ nickname: 'A' }),
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it('rejects nickname longer than 20 characters', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const req = buildAuthenticatedRequest('/api/setup/nickname', session.id, {
      method: 'POST',
      body: JSON.stringify({ nickname: 'A'.repeat(21) }),
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it('rejects nickname with special characters', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const req = buildAuthenticatedRequest('/api/setup/nickname', session.id, {
      method: 'POST',
      body: JSON.stringify({ nickname: 'Bad@Name!' }),
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it('rejects duplicate nickname taken by another user', async () => {
    await createUser({ discordId: 'other-111', discordUsername: 'other', nickname: 'TakenName' })
    const user = await createUser()
    const session = await createTestSession(user.id)
    const req = buildAuthenticatedRequest('/api/setup/nickname', session.id, {
      method: 'POST',
      body: JSON.stringify({ nickname: 'TakenName' }),
    })
    const res = await POST(req)

    expect(res.status).toBe(409)
  })
})

describe('GET /api/setup/nickname', () => {
  it('returns available true for unused nickname', async () => {
    const req = buildRequest('/api/setup/nickname?check=FreshName')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.available).toBe(true)
  })

  it('returns available false for taken nickname', async () => {
    await createUser({ nickname: 'TakenName' })
    const req = buildRequest('/api/setup/nickname?check=TakenName')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.available).toBe(false)
  })
})
