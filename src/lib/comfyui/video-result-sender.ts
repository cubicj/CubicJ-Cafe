import { QueueService } from '@/lib/database/queue'
import { GenerationJob } from '@/types'
import { discordBot } from '../discord-bot'
import { serverManager } from './server-manager'
import type { VideoModel } from './workflows/types'
import type { VideoFileInfo } from './client-types'
import { createLogger } from '@/lib/logger'

const log = createLogger('comfyui')

export async function sendVideoToDiscord(
  job: GenerationJob,
  videoInfo: VideoFileInfo
): Promise<void> {
  try {
    if (!job.userInfo) {
      log.warn('No user info, skipping Discord send', { jobId: job.id })
      return
    }

    const videoModel = (job.videoModel as VideoModel) || 'wan'

    const { queueRequest, server } = await resolveServer(job.id)
    const processingTime = getProcessingTimeSeconds(job, queueRequest)

    log.info('Discord video send attempt', {
      jobId: job.id,
      filename: videoInfo.filename,
      subfolder: videoInfo.subfolder,
      fileType: videoInfo.type,
      videoModel,
      serverUrl: server.url,
    })

    await discordBot.sendVideoToDiscord({
      filename: videoInfo.filename,
      subfolder: videoInfo.subfolder,
      fileType: videoInfo.type,
      prompt: job.prompt,
      username: job.userInfo.name,
      userAvatar: job.userInfo.image,
      processingTime,
      isNSFW: job.isNSFW,
      discordId: job.userInfo.discordId,
      requestId: job.id,
      comfyUIServerUrl: server.url,
      videoModel,
    })

    log.debug('Discord video send complete', { jobId: job.id })
  } catch (error) {
    log.error('Discord video send failed', {
      jobId: job.id,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

async function resolveServer(jobId: string) {
  const queueRequest = await QueueService.getRequestById(jobId)
  if (!queueRequest?.serverId) {
    throw new Error('서버 정보를 찾을 수 없습니다')
  }

  const server = serverManager.getServerById(queueRequest.serverId)
  if (!server) {
    throw new Error(`서버를 찾을 수 없습니다: ${queueRequest.serverId}`)
  }

  return { queueRequest, server }
}

function getProcessingTimeSeconds(
  job: GenerationJob,
  queueRequest: Awaited<ReturnType<typeof QueueService.getRequestById>>
): number | undefined {
  const startedAt = queueRequest?.startedAt ?? job.createdAt
  const completedAt = queueRequest?.completedAt ?? job.updatedAt
  if (!startedAt || !completedAt) return undefined

  const seconds = Math.round((completedAt.getTime() - startedAt.getTime()) / 1000)
  return seconds >= 0 ? seconds : undefined
}
