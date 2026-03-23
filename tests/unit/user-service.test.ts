import { cleanTables } from '../helpers/db'
import { UserService } from '@/lib/database/users'

beforeEach(async () => {
  await cleanTables()
})

const makeUserData = (overrides?: Partial<Parameters<typeof UserService.create>[0]>) => ({
  discordId: '123456789',
  discordUsername: 'testuser',
  nickname: 'TestNick',
  ...overrides,
})

describe('UserService', () => {
  describe('create', () => {
    it('creates user with correct fields', async () => {
      const data = makeUserData({ avatar: 'https://cdn.example.com/avatar.png' })
      const user = await UserService.create(data)

      expect(user).not.toBeNull()
      expect(user!.discordId).toBe(data.discordId)
      expect(user!.discordUsername).toBe(data.discordUsername)
      expect(user!.nickname).toBe(data.nickname)
      expect(user!.avatar).toBe(data.avatar)
    })

it('returns null on duplicate discordId', async () => {
      await UserService.create(makeUserData())
      const duplicate = await UserService.create(makeUserData({ nickname: 'Other' }))

      expect(duplicate).toBeNull()
    })
  })

  describe('findByDiscordId', () => {
    it('returns user when exists', async () => {
      const created = await UserService.create(makeUserData())
      const found = await UserService.findByDiscordId(created!.discordId)

      expect(found).not.toBeNull()
      expect(found!.id).toBe(created!.id)
    })

    it('returns null when not found', async () => {
      const found = await UserService.findByDiscordId('nonexistent')
      expect(found).toBeNull()
    })
  })

  describe('findByNickname', () => {
    it('returns user when exists', async () => {
      const created = await UserService.create(makeUserData())
      const found = await UserService.findByNickname(created!.nickname)

      expect(found).not.toBeNull()
      expect(found!.id).toBe(created!.id)
    })

    it('returns null when not found', async () => {
      const found = await UserService.findByNickname('nobody')
      expect(found).toBeNull()
    })
  })

  describe('isNicknameExists', () => {
    it('returns true for existing nickname', async () => {
      await UserService.create(makeUserData())
      expect(await UserService.isNicknameExists('TestNick')).toBe(true)
    })

    it('returns false for non-existing nickname', async () => {
      expect(await UserService.isNicknameExists('nobody')).toBe(false)
    })
  })

  describe('update', () => {
    it('updates user fields', async () => {
      const created = await UserService.create(makeUserData())
      const updated = await UserService.update(created!.discordId, {
        nickname: 'NewNick',
        avatar: 'https://cdn.example.com/new.png',
      })

      expect(updated).not.toBeNull()
      expect(updated!.nickname).toBe('NewNick')
      expect(updated!.avatar).toBe('https://cdn.example.com/new.png')
    })

    it('returns null for non-existent user', async () => {
      const result = await UserService.update('nonexistent', { nickname: 'X' })
      expect(result).toBeNull()
    })
  })

  describe('updateLastLogin', () => {
    it('sets lastLoginAt to approximately current time', async () => {
      const created = await UserService.create(makeUserData())
      const before = Date.now()
      const updated = await UserService.updateLastLogin(created!.discordId)
      const after = Date.now()

      expect(updated).not.toBeNull()
      expect(updated!.lastLoginAt).not.toBeNull()
      const loginTime = updated!.lastLoginAt!.getTime()
      expect(loginTime).toBeGreaterThanOrEqual(before)
      expect(loginTime).toBeLessThanOrEqual(after)
    })

    it('returns null for non-existent user', async () => {
      const result = await UserService.updateLastLogin('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('delete', () => {
    it('deletes existing user and returns true', async () => {
      const created = await UserService.create(makeUserData())
      const result = await UserService.delete(created!.discordId)

      expect(result).toBe(true)
      expect(await UserService.findByDiscordId(created!.discordId)).toBeNull()
    })

    it('returns false for non-existent user', async () => {
      const result = await UserService.delete('nonexistent')
      expect(result).toBe(false)
    })
  })

  describe('findAll', () => {
    it('returns all users ordered by createdAt desc', async () => {
      await UserService.create(makeUserData({ discordId: '1', nickname: 'First' }))
      await UserService.create(makeUserData({ discordId: '2', nickname: 'Second' }))
      await UserService.create(makeUserData({ discordId: '3', nickname: 'Third' }))

      const users = await UserService.findAll()

      expect(users).toHaveLength(3)
      expect(users[0].nickname).toBe('Third')
      expect(users[2].nickname).toBe('First')
    })

    it('returns empty array when no users', async () => {
      const users = await UserService.findAll()
      expect(users).toEqual([])
    })
  })
})
