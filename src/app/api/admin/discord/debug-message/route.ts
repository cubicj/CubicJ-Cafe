import { NextResponse } from 'next/server'
import { GenerationMode, QueueStatus } from '@prisma/client'
import { createRouteHandler } from '@/lib/api/route-handler'
import { prisma } from '@/lib/database/prisma'
import { QueueService } from '@/lib/database/queue'
import { discordBot } from '@/lib/discord-bot'
import { createLogger } from '@/lib/logger'
import { parseBody } from '@/lib/validations/parse'
import { discordDebugMessageSchema } from '@/lib/validations/schemas/admin'

const log = createLogger('admin')

export const POST = createRouteHandler(
  { auth: 'admin', category: 'admin' },
  async (req) => {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Discord debug message is disabled in production.' }, { status: 403 })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const parsed = parseBody(discordDebugMessageSchema, body)
    if (!parsed.success) return parsed.response

    const { prompt, model, isNSFW, processingTime } = parsed.data
    const lastRequest = await prisma.queueRequest.findFirst({
      orderBy: { position: 'desc' },
      select: { position: true },
    })

    const request = await prisma.queueRequest.create({
      data: {
        userId: Number(req.user!.id),
        nickname: req.user!.nickname,
        prompt,
        status: QueueStatus.CANCELLED,
        position: (lastRequest?.position ?? 0) + 1,
        isNSFW,
        videoModel: model,
        generationMode: GenerationMode.START_ONLY,
        videoDuration: 5,
        failedAt: new Date(),
        error: 'Discord debug message',
      },
    })
    QueueService.invalidateCache()

    await discordBot.sendDebugVideoResultMessage({
      requestId: request.id,
      isNSFW,
      discordId: req.user!.discordId,
      videoModel: model,
      processingTime,
    })

    log.info('Discord debug message sent', {
      requestId: request.id,
      model,
      admin: req.user!.discordId,
    })

    return { requestId: request.id }
  }
)
