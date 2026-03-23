import { cleanTables } from '../../helpers/db'
import { createUser, createQueueRequest } from '../../helpers/fixtures'
import { queueService } from '@/lib/database/queue'

beforeEach(async () => {
  await cleanTables()
})

describe('PROCESSING job recovery', () => {
  it('resets PROCESSING requests to PENDING on startup', async () => {
    const user = await createUser()
    await createQueueRequest(user.id, { status: 'PROCESSING' })
    await createQueueRequest(user.id, { status: 'PROCESSING' })
    await createQueueRequest(user.id, { status: 'PENDING' })

    const result = await queueService.resetProcessingToPending()

    expect(result.count).toBe(2)

    const stats = await queueService.getQueueStats()
    expect(stats.processing).toBe(0)
    expect(stats.pending).toBe(3)
  })

  it('does nothing when no PROCESSING requests exist', async () => {
    const user = await createUser()
    await createQueueRequest(user.id, { status: 'PENDING' })

    const result = await queueService.resetProcessingToPending()

    expect(result.count).toBe(0)
  })
})
