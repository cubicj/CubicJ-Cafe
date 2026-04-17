import { generationStore } from '../generation-store'
import { QueueService } from '@/lib/database/queue'
import { QueueStatus } from '@prisma/client'
import { GenerationJob } from '@/types'
import { serverManager } from './server-manager'
import { queueMonitor } from './queue-monitor'
import { sendVideoToDiscord } from './video-result-sender'
import type { WsExecutedData, WsExecutionErrorData, VideoFileInfo } from './client-types'
import type { ComfyUIClient } from './client-core'
import { createLogger } from '@/lib/logger'
import { getOpsSetting } from '@/lib/database/ops-settings'

const log = createLogger('comfyui')

class ComfyUIJobMonitor {
  private monitoringJobs = new Set<string>()
  private timeoutTimers = new Map<string, NodeJS.Timeout>()
  private pollingTimers = new Map<string, NodeJS.Timeout>()
  private get maxMonitoringTime(): number {
    return getOpsSetting('ops.job_monitor_timeout_ms')
  }
  private get pollingIntervalMs(): number {
    return getOpsSetting('ops.ws_history_poll_interval_ms')
  }

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
      if (!data.output?.gifs || data.output.gifs.length === 0) return

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

    const pollInterval = setInterval(() => this.pollHistory(job, client), this.pollingIntervalMs)
    this.pollingTimers.set(job.promptId, pollInterval)

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

  private async pollHistory(
    job: GenerationJob,
    client: ComfyUIClient,
  ): Promise<void> {
    if (client.isWebSocketConnected()) return

    try {
      const history = await client.getHistory(job.promptId!)
      const entry = history[job.promptId!]
      if (!entry) return

      const errorMsg = entry.status?.messages?.find((m) => m[0] === 'execution_error')
      if (errorMsg) {
        const errPayload = errorMsg[1] as { node_id?: string; node_type?: string; exception_message?: string }
        await this.failJob(
          job,
          `Node ${errPayload.node_id} (${errPayload.node_type}): ${errPayload.exception_message}`,
          client,
        )
        return
      }

      const gifsList: Array<{ filename: string; subfolder: string; type: string }> = []
      for (const nodeOutput of Object.values(entry.outputs ?? {})) {
        if (nodeOutput.gifs) gifsList.push(...nodeOutput.gifs)
      }

      if (gifsList.length > 0) {
        const videoFile = gifsList[0]
        await this.handleCompletion(
          job,
          { filename: videoFile.filename, subfolder: videoFile.subfolder, type: videoFile.type },
          client,
        )
      }
    } catch (e) {
      log.warn('History poll failed (will retry next interval)', {
        promptId: job.promptId,
        error: e instanceof Error ? e.message : String(e),
      })
    }
  }

  private async handleCompletion(
    job: GenerationJob,
    videoInfo: VideoFileInfo,
    client: { removeCallbacks: (promptId: string) => void }
  ): Promise<void> {
    if (!this.monitoringJobs.has(job.promptId!)) return
    this.monitoringJobs.delete(job.promptId!)

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
    if (!this.monitoringJobs.has(job.promptId!)) return
    this.monitoringJobs.delete(job.promptId!)

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
    const poll = this.pollingTimers.get(promptId)
    if (poll) {
      clearInterval(poll)
      this.pollingTimers.delete(promptId)
    }
    client?.removeCallbacks(promptId)
  }
}

export const jobMonitor = new ComfyUIJobMonitor()
