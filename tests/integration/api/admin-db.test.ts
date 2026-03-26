import { cleanTables } from '../../helpers/db'
import { createUser, createAdminUser, createQueueRequest } from '../../helpers/fixtures'
import { createTestSession, buildRequest, buildAuthenticatedRequest } from '../../helpers/auth'
import { GET } from '@/app/api/admin/db/route'

beforeEach(async () => {
  await cleanTables()
})

describe('GET /api/admin/db', () => {
  it('returns 401 when not authenticated', async () => {
    const req = buildRequest('/api/admin/db')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-admin user', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const req = buildAuthenticatedRequest('/api/admin/db', session.id)
    const res = await GET(req)
    expect(res.status).toBe(403)
  })

  it('returns tables list when no table param', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/db', session.id)
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.tables).toBeDefined()
    expect(body.tables.length).toBe(3)

    const tableNames = body.tables.map((t: { name: string }) => t.name)
    expect(tableNames).toContain('users')
    expect(tableNames).toContain('queue_requests')
    expect(tableNames).toContain('lora_presets')

    for (const table of body.tables) {
      expect(typeof table.count).toBe('number')
      expect(typeof table.displayName).toBe('string')
    }
  })

  it('returns users data with pagination when table=users', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/db?table=users', session.id)
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toBeDefined()
    expect(body.totalCount).toBeGreaterThanOrEqual(1)
    expect(body.page).toBe(1)
    expect(body.totalPages).toBeGreaterThanOrEqual(1)
    expect(body.limit).toBe(25)
  })

  it('returns queue_requests data', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    await createQueueRequest(admin.id, { prompt: 'test video prompt' })

    const req = buildAuthenticatedRequest('/api/admin/db?table=queue_requests', session.id)
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toBeDefined()
    expect(body.data.length).toBe(1)
    expect(body.data[0].prompt).toBe('test video prompt')
    expect(body.totalCount).toBe(1)
  })

  it('returns 400 for unsupported table name', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/db?table=nonexistent', session.id)
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('supports orderBy and orderDirection params', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    await createUser({ discordId: 'user-a', discordUsername: 'aaa', nickname: 'AAA' })
    await createUser({ discordId: 'user-z', discordUsername: 'zzz', nickname: 'ZZZ' })

    const reqAsc = buildAuthenticatedRequest(
      '/api/admin/db?table=users&orderBy=nickname&orderDirection=asc',
      session.id
    )
    const resAsc = await GET(reqAsc)
    expect(resAsc.status).toBe(200)
    const bodyAsc = await resAsc.json()
    const nicknamesAsc = bodyAsc.data.map((u: { nickname: string }) => u.nickname)
    expect(nicknamesAsc.indexOf('AAA')).toBeLessThan(nicknamesAsc.indexOf('ZZZ'))

    const reqDesc = buildAuthenticatedRequest(
      '/api/admin/db?table=users&orderBy=nickname&orderDirection=desc',
      session.id
    )
    const resDesc = await GET(reqDesc)
    expect(resDesc.status).toBe(200)
    const bodyDesc = await resDesc.json()
    const nicknamesDesc = bodyDesc.data.map((u: { nickname: string }) => u.nickname)
    expect(nicknamesDesc.indexOf('ZZZ')).toBeLessThan(nicknamesDesc.indexOf('AAA'))
  })

  it('supports pagination with page and limit params', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    await createUser({ discordId: 'user-1', discordUsername: 'user1', nickname: 'User1' })
    await createUser({ discordId: 'user-2', discordUsername: 'user2', nickname: 'User2' })

    const req = buildAuthenticatedRequest('/api/admin/db?table=users&page=1&limit=2', session.id)
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.length).toBe(2)
    expect(body.limit).toBe(2)
    expect(body.totalCount).toBe(3)
    expect(body.totalPages).toBe(2)

    const reqPage2 = buildAuthenticatedRequest('/api/admin/db?table=users&page=2&limit=2', session.id)
    const resPage2 = await GET(reqPage2)
    expect(resPage2.status).toBe(200)
    const bodyPage2 = await resPage2.json()
    expect(bodyPage2.data.length).toBe(1)
    expect(bodyPage2.page).toBe(2)
  })
})
