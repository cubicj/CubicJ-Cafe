import { prisma } from '@/lib/database/prisma'
import type { User } from '@prisma/client'

export const TEST_USER = {
  discordId: 'test-user-123',
  discordUsername: 'testuser',
  nickname: 'TestUser',
} as const

export const ADMIN_USER = {
  discordId: 'admin-discord-123',
  discordUsername: 'adminuser',
  nickname: 'AdminUser',
} as const

export const OTHER_USER = {
  discordId: 'other-user-456',
  discordUsername: 'otheruser',
  nickname: 'OtherUser',
} as const

export async function createUser(overrides?: Partial<typeof TEST_USER>): Promise<User> {
  return prisma.user.create({
    data: { ...TEST_USER, ...overrides },
  })
}

export async function createAdminUser(): Promise<User> {
  return prisma.user.create({
    data: ADMIN_USER,
  })
}
