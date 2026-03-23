import { generationStore } from '../generation-store';
import { QueueService } from '@/lib/database/queue';
import { QueueStatus } from '@prisma/client';
import { GenerationJob } from '@/types';
import { serverManager } from './server-manager';
import { queueMonitor } from './queue-monitor';
import { sendVideoToDiscord } from './video-result-sender';
import { createLogger } from '@/lib/logger';

const log = createLogger('comfyui');

interface ComfyUIHistoryStatus {
  status_str?: string;
  completed?: boolean;
}

interface ComfyUINodeOutput {
  error?: string;
  exception?: string;
  gifs?: Array<{ filename: string; subfolder?: string }>;
}

interface ComfyUIPromptItem {
  error?: string;
  [nodeId: string]: unknown;
}

interface ComfyUIHistoryData {
  status?: ComfyUIHistoryStatus;
  outputs?: Record<string, ComfyUINodeOutput>;
  prompt?: ComfyUIPromptItem[];
}

class ComfyUIJobMonitor {
  private monitoringJobs = new Set<string>();
  private monitoringInterval = 5000;

  async startMonitoring(job: GenerationJob): Promise<void> {
    if (!job.promptId) {
      log.warn('Cannot monitor job without promptId', { jobId: job.id });
      return;
    }

    if (this.monitoringJobs.has(job.promptId)) {
      log.debug('Already monitoring job', { promptId: job.promptId });
      return;
    }

    log.info('ComfyUI job monitoring started', { promptId: job.promptId });
    this.monitoringJobs.add(job.promptId);

    let retryCount = 0;
    const maxRetries = 10;
    const maxMonitoringTime = 30 * 60 * 1000;
    const startTime = Date.now();

    const monitor = async () => {
      try {
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime > maxMonitoringTime) {
          log.warn('Monitoring timeout', { minutes: Math.round(elapsedTime / 1000 / 60), promptId: job.promptId });

          await this.failJob(job, '모니터링 시간 초과 (30분)');
          return;
        }

        const queueRequest = await QueueService.getRequestById(job.id);
        if (!queueRequest?.serverId) {
          throw new Error('서버 정보를 찾을 수 없습니다');
        }

        if (queueRequest.status === 'CANCELLED') {
          log.info('Cancelled job monitoring stopped', { jobId: job.id });
          queueMonitor.releaseServerJob(job.id);
          this.monitoringJobs.delete(job.promptId!);
          return;
        }

        const server = serverManager.getServerById(queueRequest.serverId);
        if (!server) {
          throw new Error(`서버를 찾을 수 없습니다: ${queueRequest.serverId}`);
        }

        const comfyUIClient = serverManager.getClient(server);
        const isHealthy = await comfyUIClient.checkServerHealth();
        if (!isHealthy) {
          throw new Error('ComfyUI 서버 연결 실패');
        }

        const queueStatus = await comfyUIClient.getQueue();
        const isInRunning = queueStatus?.queue_running.some(item => item[1] === job.promptId) || false;
        const isInPending = queueStatus?.queue_pending.some(item => item[1] === job.promptId) || false;
        const isInQueue = isInRunning || isInPending;

        const history = await comfyUIClient.getHistory(job.promptId!);
        const promptData = history[job.promptId!];
        const hasOutputs = promptData && promptData.outputs;

        if (hasOutputs) {
          log.info('ComfyUI job completed', { promptId: job.promptId });
          await this.handleCompletion(job, promptData.outputs!);
          return;
        }

        if (!isInQueue && !hasOutputs && promptData) {
          log.error('ComfyUI job failed (removed from queue but no outputs)', { promptId: job.promptId });
          const errorInfo = this.extractErrorFromHistory(promptData);
          await this.failJob(job, errorInfo || 'ComfyUI에서 작업이 실패했습니다 (outputs 없음)');
          return;
        }

        retryCount = 0;
        setTimeout(monitor, this.monitoringInterval);

      } catch (error) {
        retryCount++;
        log.error('Job monitoring error', { retryCount, maxRetries, error: error instanceof Error ? error.message : String(error) });

        if (retryCount >= maxRetries) {
          log.error('Max retries exceeded, monitoring stopped', { promptId: job.promptId });
          await this.failJob(job, error instanceof Error ? error.message : '모니터링 실패');
        } else {
          const retryDelay = Math.min(this.monitoringInterval * retryCount, 30000);
          log.debug('Retrying monitoring', { retryDelay, retryCount, maxRetries });
          setTimeout(monitor, retryDelay);
        }
      }
    };

    setTimeout(monitor, this.monitoringInterval);
  }

  stopMonitoring(promptId: string): void {
    this.monitoringJobs.delete(promptId);
    log.debug('Job monitoring stopped', { promptId });
  }

  isMonitoring(promptId: string): boolean {
    return this.monitoringJobs.has(promptId);
  }

  getActiveMonitoringCount(): number {
    return this.monitoringJobs.size;
  }

  private async handleCompletion(job: GenerationJob, outputs: Record<string, ComfyUINodeOutput>): Promise<void> {
    try {
      await QueueService.updateRequest(job.id, {
        status: QueueStatus.COMPLETED,
        completedAt: new Date()
      });

      generationStore.updateJob(job.promptId!, {
        status: 'completed',
        updatedAt: new Date()
      });

      queueMonitor.releaseServerJob(job.id);
      await sendVideoToDiscord(job, outputs);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error('Discord send failed', {
        error: errorMessage,
        jobId: job.id,
        promptId: job.promptId,
        username: job.userInfo?.name
      });

      log.warn('Job completed but Discord send failed', { jobId: job.id });
      await QueueService.updateRequest(job.id, {
        status: QueueStatus.COMPLETED,
        completedAt: new Date(),
        error: `작업 완료, Discord 전송 실패: ${errorMessage}`
      });

      generationStore.updateJob(job.promptId!, {
        status: 'completed',
        error: `Discord 전송 실패: ${errorMessage}`,
        updatedAt: new Date()
      });

      queueMonitor.releaseServerJob(job.id);
    }

    this.monitoringJobs.delete(job.promptId!);
  }

  private async failJob(job: GenerationJob, errorMessage: string): Promise<void> {
    await QueueService.updateRequest(job.id, {
      status: QueueStatus.FAILED,
      failedAt: new Date(),
      error: errorMessage
    });

    generationStore.updateJob(job.promptId!, {
      status: 'failed',
      error: errorMessage,
      updatedAt: new Date()
    });

    queueMonitor.releaseServerJob(job.id);
    this.monitoringJobs.delete(job.promptId!);
  }

  private extractErrorFromHistory(promptData: ComfyUIHistoryData): string | null {
    try {
      if (promptData.status && promptData.status.status_str === 'error') {
        return `ComfyUI 실행 오류: ${promptData.status.completed ? 'completed with error' : 'execution failed'}`;
      }

      if (promptData.outputs) {
        for (const [nodeId, nodeOutput] of Object.entries(promptData.outputs)) {
          if (nodeOutput.error || nodeOutput.exception) {
            return `노드 ${nodeId} 오류: ${nodeOutput.error || nodeOutput.exception}`;
          }
        }
      }

      if (promptData.prompt && Array.isArray(promptData.prompt)) {
        for (const promptItem of promptData.prompt) {
          if (promptItem.error) {
            return `프롬프트 오류: ${promptItem.error}`;
          }
        }
      }

      return null;
    } catch (error) {
      log.warn('Failed to extract error info from history', { error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }
}

export const jobMonitor = new ComfyUIJobMonitor();
