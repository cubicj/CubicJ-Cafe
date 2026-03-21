import { bench, describe, beforeAll } from 'vitest'
import { cleanTables } from '../helpers/db'
import { createUser } from '../helpers/fixtures'
import { createTestSession, buildRequest, buildAuthenticatedRequest } from '../helpers/auth'
import { prisma } from '@/lib/database/prisma'
import { QueueStatus } from '@prisma/client'
import { GET as getQueue, POST as postQueue } from '@/app/api/queue/route'
import { GET as getSession } from '@/app/api/auth/session/route'

let sessionId: string
let queueItemId: string

beforeAll(async () => {
  await cleanTables()

  const user = await createUser()
  const session = await createTestSession(user.id)
  sessionId = session.id

  for (let i = 0; i < 10; i++) {
    await prisma.queueRequest.create({
      data: {
        userId: user.id,
        nickname: user.nickname,
        prompt: `bench prompt ${i}`,
        status: i < 8 ? QueueStatus.PENDING : QueueStatus.COMPLETED,
        position: i + 1,
        completedAt: i >= 8 ? new Date() : undefined,
      },
    })
  }

  const item = await prisma.queueRequest.findFirst({
    where: { status: QueueStatus.PENDING },
  })
  queueItemId = item!.id
})

describe('Auth Session API', () => {
  bench('GET /api/auth/session (unauthenticated)', async () => {
    const req = buildRequest('/api/auth/session')
    await getSession(req)
  })

  bench('GET /api/auth/session (authenticated)', async () => {
    const req = buildAuthenticatedRequest('/api/auth/session', sessionId)
    await getSession(req)
  })
})

describe('Queue API - GET', () => {
  bench('GET /api/queue?action=list', async () => {
    const req = buildRequest('/api/queue?action=list')
    await getQueue(req)
  })

  bench('GET /api/queue?action=stats', async () => {
    const req = buildRequest('/api/queue?action=stats')
    await getQueue(req)
  })

  bench('GET /api/queue?action=user (authenticated)', async () => {
    const req = buildAuthenticatedRequest('/api/queue?action=user', sessionId)
    await getQueue(req)
  })
})

describe('Queue API - POST', () => {
  bench('POST /api/queue cancel (own request)', async () => {
    const req = buildAuthenticatedRequest('/api/queue', sessionId, {
      method: 'POST',
      body: JSON.stringify({ action: 'cancel', requestId: queueItemId }),
      headers: { 'content-type': 'application/json' },
    })
    await postQueue(req)
  })
})
