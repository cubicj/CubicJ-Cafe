import { vi } from 'vitest'
import { QueueStatus } from '@prisma/client'
import { prisma } from '@/lib/database/prisma'
import { cleanTables } from '../../helpers/db'
import { createAdminUser, createUser } from '../../helpers/fixtures'
import { createTestSession, buildAuthenticatedRequest, buildRequest } from '../../helpers/auth'
import { POST } from '@/app/api/admin/discord/debug-message/route'
import { discordBot } from '@/lib/discord-bot'

vi.mock('@/lib/discord-bot', () => ({
  discordBot: {
    sendDebugVideoResultMessage: vi.fn().mockResolvedValue(undefined),
  },
}))

beforeEach(async () => {
  await cleanTables()
  vi.unstubAllEnvs()
  vi.mocked(discordBot.sendDebugVideoResultMessage).mockClear()
})

describe('POST /api/admin/discord/debug-message', () => {
  it('returns 401 without authentication', async () => {
    const req = buildRequest('/api/admin/discord/debug-message', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'debug prompt' }),
      headers: { 'content-type': 'application/json' },
    })

    const res = await POST(req)

    expect(res.status).toBe(401)
  })

  it('returns 403 for non-admin users', async () => {
    const user = await createUser()
    const session = await createTestSession(user.id)
    const req = buildAuthenticatedRequest('/api/admin/discord/debug-message', session.id, {
      method: 'POST',
      body: JSON.stringify({ prompt: 'debug prompt' }),
      headers: { 'content-type': 'application/json' },
    })

    const res = await POST(req)

    expect(res.status).toBe(403)
  })

  it('returns 403 in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/discord/debug-message', session.id, {
      method: 'POST',
      body: JSON.stringify({ prompt: 'debug prompt' }),
      headers: { 'content-type': 'application/json' },
    })

    const res = await POST(req)

    expect(res.status).toBe(403)
    expect(discordBot.sendDebugVideoResultMessage).not.toHaveBeenCalled()
  })

  it('creates a non-runnable debug request and sends the real result card', async () => {
    const admin = await createAdminUser()
    const session = await createTestSession(admin.id)
    const req = buildAuthenticatedRequest('/api/admin/discord/debug-message', session.id, {
      method: 'POST',
      body: JSON.stringify({
        prompt: 'debug prompt',
        model: 'ltxa',
        isNSFW: true,
        processingTime: 60,
      }),
      headers: { 'content-type': 'application/json' },
    })

    const res = await POST(req)
    const body = await res.json()
    const request = await prisma.queueRequest.findUniqueOrThrow({
      where: { id: body.requestId },
    })

    expect(res.status).toBe(200)
    expect(request.status).toBe(QueueStatus.CANCELLED)
    expect(request.prompt).toBe('debug prompt')
    expect(request.videoModel).toBe('ltxa')
    expect(discordBot.sendDebugVideoResultMessage).toHaveBeenCalledWith({
      requestId: request.id,
      isNSFW: true,
      discordId: admin.discordId,
      videoModel: 'ltxa',
      processingTime: 60,
    })
  })
})
