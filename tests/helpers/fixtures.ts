import { prisma } from '@/lib/database/prisma'
import { QueueService } from '@/lib/database/queue'
import { QueueStatus, type User } from '@prisma/client'

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

export async function createUser(overrides?: { discordId?: string; discordUsername?: string; nickname?: string }): Promise<User> {
  return prisma.user.create({
    data: { ...TEST_USER, ...overrides },
  })
}

export async function createAdminUser(): Promise<User> {
  return prisma.user.create({
    data: ADMIN_USER,
  })
}

export async function createQueueRequest(userId: number, overrides?: {
  prompt?: string
  status?: QueueStatus
  position?: number
  videoModel?: string
  nickname?: string
}) {
  const request = await prisma.queueRequest.create({
    data: {
      userId,
      nickname: overrides?.nickname || 'TestUser',
      prompt: overrides?.prompt || 'test prompt',
      status: overrides?.status || QueueStatus.PENDING,
      position: overrides?.position || 1,
      videoModel: overrides?.videoModel || 'wan',
      duration: 5,
      workflowLength: 81,
    },
  })
  QueueService.invalidateCache()
  return request
}
