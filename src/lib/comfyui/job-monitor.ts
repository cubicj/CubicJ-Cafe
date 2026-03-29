import { generationStore } from '../generation-store'
import { QueueService } from '@/lib/database/queue'
import { QueueStatus } from '@prisma/client'
import { GenerationJob } from '@/types'
import { serverManager } from './server-manager'
import { queueMonitor } from './queue-monitor'
import { sendVideoToDiscord } from './video-result-sender'
import type { WsExecutedData, WsExecutionErrorData, VideoFileInfo } from './client-types'
import { createLogger } from '@/lib/logger'

const log = createLogger('comfyui')

class ComfyUIJobMonitor {
  private monitoringJobs = new Set<string>()
  private timeoutTimers = new Map<string, NodeJS.Timeout>()
  private maxMonitoringTime = 30 * 60 * 1000

  async startMonitoring(job: GenerationJob): Promise<void> {
    if (!job.promptId) {
      log.warn('Cannot monitor job without promptId', { jobId: job.id })
      return
    }

    if (this.monitoringJobs.has(job.promptId)) {
      log.debug('Already monitoring job', { promptId: job.promptId })
      return
    }

    const queueRequest = await QueueService.getRequestById(job.id)
    if (!queueRequest?.serverId) {
      log.error('Cannot monitor job without server', { jobId: job.id })
      return
    }

    const server = serverManager.getServerById(queueRequest.serverId)
    if (!server) {
      log.error('Server not found for monitoring', { serverId: queueRequest.serverId })
      return
    }

    const client = serverManager.getClient(server)

    log.info('ComfyUI job monitoring started', { promptId: job.promptId })
    this.monitoringJobs.add(job.promptId)

    client.onExecuted(job.promptId, async (data: WsExecutedData) => {
      if (!data.output.gifs || data.output.gifs.length === 0) return

      const videoFile = data.output.gifs[0]
      const videoInfo: VideoFileInfo = {
        filename: videoFile.filename,
        subfolder: videoFile.subfolder,
        type: videoFile.type,
      }

      await this.handleCompletion(job, videoInfo, client)
    })

    client.onExecutionError(job.promptId, async (data: WsExecutionErrorData) => {
      const errorMessage = `Node ${data.node_id} (${data.node_type}): ${data.exception_message}`
      await this.failJob(job, errorMessage, client)
    })

    const timer = setTimeout(async () => {
      log.warn('Monitoring timeout', { minutes: 30, promptId: job.promptId })
      await this.failJob(job, '모니터링 시간 초과 (30분)', client)
    }, this.maxMonitoringTime)

    this.timeoutTimers.set(job.promptId, timer)
  }

  stopMonitoring(promptId: string): void {
    this.cleanup(promptId)
    log.debug('Job monitoring stopped', { promptId })
  }

  isMonitoring(promptId: string): boolean {
    return this.monitoringJobs.has(promptId)
  }

  getActiveMonitoringCount(): number {
    return this.monitoringJobs.size
  }

  private async handleCompletion(
    job: GenerationJob,
    videoInfo: VideoFileInfo,
    client: { removeCallbacks: (promptId: string) => void }
  ): Promise<void> {
    const queueRequest = await QueueService.getRequestById(job.id)
    if (queueRequest?.status === 'CANCELLED') {
      log.info('Cancelled job monitoring stopped', { jobId: job.id })
      queueMonitor.releaseServerJob(job.id)
      this.cleanup(job.promptId!, client)
      return
    }

    try {
      await QueueService.updateRequest(job.id, {
        status: QueueStatus.COMPLETED,
        completedAt: new Date(),
      })

      generationStore.updateJob(job.promptId!, {
        status: 'completed',
        updatedAt: new Date(),
      })

      queueMonitor.releaseServerJob(job.id)
      await sendVideoToDiscord(job, videoInfo)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      log.error('Discord send failed', {
        error: errorMessage,
        jobId: job.id,
        promptId: job.promptId,
        username: job.userInfo?.name,
      })

      log.warn('Job completed but Discord send failed', { jobId: job.id })
      await QueueService.updateRequest(job.id, {
        status: QueueStatus.COMPLETED_WITH_ERROR,
        completedAt: new Date(),
        error: `Discord 전송 실패: ${errorMessage}`,
      })

      generationStore.updateJob(job.promptId!, {
        status: 'completed',
        error: `Discord 전송 실패: ${errorMessage}`,
        updatedAt: new Date(),
      })

      queueMonitor.releaseServerJob(job.id)
    }

    this.cleanup(job.promptId!, client)
  }

  private async failJob(
    job: GenerationJob,
    errorMessage: string,
    client: { removeCallbacks: (promptId: string) => void }
  ): Promise<void> {
    await QueueService.updateRequest(job.id, {
      status: QueueStatus.FAILED,
      failedAt: new Date(),
      error: errorMessage,
    })

    generationStore.updateJob(job.promptId!, {
      status: 'failed',
      error: errorMessage,
      updatedAt: new Date(),
    })

    queueMonitor.releaseServerJob(job.id)
    this.cleanup(job.promptId!, client)
  }

  private cleanup(promptId: string, client?: { removeCallbacks: (promptId: string) => void }): void {
    this.monitoringJobs.delete(promptId)
    const timer = this.timeoutTimers.get(promptId)
    if (timer) {
      clearTimeout(timer)
      this.timeoutTimers.delete(promptId)
    }
    client?.removeCallbacks(promptId)
  }
}

export const jobMonitor = new ComfyUIJobMonitor()
