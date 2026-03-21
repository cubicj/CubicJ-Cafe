import { cleanTables } from '../../helpers/db'
import { createUser } from '../../helpers/fixtures'
import { createTestSession, buildAuthenticatedRequest } from '../../helpers/auth'
import { prisma } from '@/lib/database/prisma'

beforeEach(async () => {
  await cleanTables()
})

describe('test infrastructure', () => {
  it('creates and queries a user in test DB', async () => {
    const user = await createUser()
    expect(user.discordId).toBe('test-user-123')

    const found = await prisma.user.findUnique({ where: { discordId: 'test-user-123' } })
    expect(found).not.toBeNull()
    expect(found!.nickname).toBe('TestUser')
  })

  it('creates authenticated request with session cookie', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const req = buildAuthenticatedRequest('/api/test', session.id)

    expect(req.cookies.get('session_id')?.value).toBe(session.id)
  })

  it('cleanTables isolates between tests', async () => {
    const count = await prisma.user.count()
    expect(count).toBe(0)
  })
})
