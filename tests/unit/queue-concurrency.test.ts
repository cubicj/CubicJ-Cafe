import { vi } from 'vitest'
import { prisma } from '@/lib/database/prisma'
import { QueueService } from '@/lib/database/queue'
import { cleanTables } from '../helpers/db'

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

describe('queue concurrency', () => {
  beforeEach(async () => {
    await cleanTables()
  })

  it('assigns unique positions to concurrent createRequest calls', { timeout: 30000 }, async () => {
    const user = await prisma.user.create({
      data: {
        discordId: 'concurrency-user',
        discordUsername: 'concurrency-user',
        nickname: 'racer',
        avatar: null,
      },
    })

    const tasks = Array.from({ length: 5 }, (_, i) =>
      QueueService.createRequest({
        userId: user.id,
        nickname: `racer-${i}`,
        prompt: `concurrent ${i}`,
      }),
    )

    const settled = await Promise.allSettled(tasks)
    const fulfilledIds = settled
      .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
      .map((r) => r.value)
    const rejected = settled.filter((r) => r.status === 'rejected')

    expect(fulfilledIds.length).toBeGreaterThanOrEqual(1)
    expect(fulfilledIds.length).toBeLessThanOrEqual(2)
    expect(fulfilledIds.length + rejected.length).toBe(5)

    const created = await prisma.queueRequest.findMany({
      where: { id: { in: fulfilledIds } },
      select: { position: true },
    })
    const positions = created.map((r) => r.position).sort()
    expect(new Set(positions).size).toBe(positions.length)
  })
})
