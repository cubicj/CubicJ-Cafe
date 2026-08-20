import { GenerationJob } from '@/types'
import { discordBot } from '../discord-bot'
import type { ComfyUIServer } from './server-manager'
import type { VideoModel } from './workflows/types'
import type { VideoFileInfo } from './client-types'
import { createLogger } from '@/lib/logger'

const log = createLogger('comfyui')

interface QueueRequestContext {
  serverId: string | null
  startedAt: Date | null
  completedAt: Date | null
}

export async function sendVideoToDiscord(
  job: GenerationJob,
  videoInfo: VideoFileInfo,
  queueRequest: QueueRequestContext | null,
  server: Pick<ComfyUIServer, 'url'> | null,
): Promise<void> {
  try {
    if (!job.userInfo) {
      log.warn('No user info, skipping Discord send', { jobId: job.id })
      return
    }

    const videoModel = (job.videoModel as VideoModel) || 'wan'

    if (!queueRequest?.serverId) {
      throw new Error('서버 정보를 찾을 수 없습니다')
    }
    if (!server) {
      throw new Error(`서버를 찾을 수 없습니다: ${queueRequest.serverId}`)
    }
    const processingTime = getProcessingTimeSeconds(job, queueRequest)

    log.debug('Discord video send attempt', {
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

function getProcessingTimeSeconds(
  job: GenerationJob,
  queueRequest: QueueRequestContext
): number | undefined {
  const startedAt = queueRequest?.startedAt ?? job.createdAt
  const completedAt = queueRequest?.completedAt ?? job.updatedAt
  if (!startedAt || !completedAt) return undefined

  const seconds = Math.round((completedAt.getTime() - startedAt.getTime()) / 1000)
  return seconds >= 0 ? seconds : undefined
}
