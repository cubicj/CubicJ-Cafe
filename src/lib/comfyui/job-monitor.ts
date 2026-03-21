import { generationStore } from '../generation-store';
import { queueService } from '@/lib/database/queue';
import { QueueStatus } from '@prisma/client';
import { GenerationJob } from '@/types';
import { discordBot } from '../discord-bot';
import { serverManager } from './server-manager';
import { queueMonitor } from './queue-monitor';
import { VIDEO_OUTPUT_TYPES, MODEL_REGISTRY } from './workflows/registry';
import type { VideoModel } from './workflows/types';
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

interface ComfyUIWorkflowNode {
  class_type?: string;
  inputs?: Record<string, unknown> & {
    filename_prefix?: string;
  };
}

class ComfyUIJobMonitor {
  private monitoringJobs = new Set<string>();
  private monitoringInterval = 5000; // 5초마다 확인

  constructor() {
    // 서버 매니저를 통해 동적으로 서버별 클라이언트 사용
  }

  async startMonitoring(job: GenerationJob): Promise<void> {
    if (!job.promptId) {
      log.warn('Cannot monitor job without promptId', { jobId: job.id });
      return;
    }

    if (this.monitoringJobs.has(job.promptId)) {
      log.info('Already monitoring job', { promptId: job.promptId });
      return;
    }

    log.info('ComfyUI job monitoring started', { promptId: job.promptId });
    this.monitoringJobs.add(job.promptId);

    let retryCount = 0;
    const maxRetries = 10;
    const maxMonitoringTime = 30 * 60 * 1000; // 30분 최대 모니터링 시간
    const startTime = Date.now();

    const monitor = async () => {
      // 디버깅: 모니터링 체크 로그 완전 제거
      try {
        // 0. 모니터링 시간 초과 확인
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime > maxMonitoringTime) {
          log.warn('Monitoring timeout', { minutes: Math.round(elapsedTime / 1000 / 60), promptId: job.promptId });
          
          await queueService.updateRequest(job.id, {
            status: QueueStatus.FAILED,
            failedAt: new Date(),
            error: '모니터링 시간 초과 (30분)'
          });

          const failedJob: Partial<GenerationJob> = {
            status: 'failed',
            error: '모니터링 시간 초과',
            updatedAt: new Date()
          };
          generationStore.updateJob(job.promptId!, failedJob);
          
          // 모니터링 시간 초과로 서버 해제
          queueMonitor.releaseServerJob(job.id);
          
          this.monitoringJobs.delete(job.promptId!);
          return;
        }

        // 작업이 처리된 서버 정보 가져오기
        const queueRequest = await queueService.getRequestById(job.id);
        if (!queueRequest?.serverId) {
          throw new Error('서버 정보를 찾을 수 없습니다');
        }

        // CANCELLED 상태인 경우 모니터링 중단
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
        // 디버깅: 서버 객체 및 클라이언트 생성 로그 제거
        // 1. 서버 연결 상태 먼저 확인
        const isHealthy = await comfyUIClient.checkServerHealth();
        if (!isHealthy) {
          throw new Error('ComfyUI 서버 연결 실패');
        }

        // 2. 큐 상태 확인 (작업이 큐에서 제거되었는지 확인)
        const queueStatus = await comfyUIClient.getQueue();
        const isInRunning = queueStatus?.queue_running.some(item => item[1] === job.promptId) || false;
        const isInPending = queueStatus?.queue_pending.some(item => item[1] === job.promptId) || false;
        const isInQueue = isInRunning || isInPending;

        // 3. 히스토리 확인 (완료된 결과물 확인)
        const history = await comfyUIClient.getHistory(job.promptId!);
        const promptData = history[job.promptId!];
        const hasOutputs = promptData && promptData.outputs;

        // 4. 작업 완료 판정 (outputs 존재)
        if (hasOutputs) {
          log.info('ComfyUI job completed', { promptId: job.promptId });
          
          try {
            // 데이터베이스 상태 업데이트
            await queueService.updateRequest(job.id, {
              status: QueueStatus.COMPLETED,
              completedAt: new Date()
            });

            // generationStore도 업데이트 (호환성 유지)
            const updatedJob: Partial<GenerationJob> = {
              status: 'completed',
              updatedAt: new Date()
            };
            generationStore.updateJob(job.promptId!, updatedJob);
            
            // 작업 완료로 서버 해제
            queueMonitor.releaseServerJob(job.id);
            
            // Discord로 바로 전송 (파일 다운로드하지 않음)
            await this.sendVideoToDiscord(job, promptData.outputs);
            
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log.error('Discord send failed', {
              error: errorMessage,
              jobId: job.id,
              promptId: job.promptId,
              username: job.userInfo?.name
            });
            
            // Discord 전송 실패는 작업 자체를 실패로 처리하지 않고 완료로 처리
            // 대신 에러 로그만 남김
            log.warn('Job completed but Discord send failed', { jobId: job.id });
            
            // 데이터베이스는 COMPLETED로 업데이트 (전송 실패를 에러 필드에 기록)
            await queueService.updateRequest(job.id, {
              status: QueueStatus.COMPLETED,
              completedAt: new Date(),
              error: `작업 완료, Discord 전송 실패: ${errorMessage}`
            });

            // generationStore도 COMPLETED로 업데이트 (호환성 유지)
            const completedJob: Partial<GenerationJob> = {
              status: 'completed',
              error: `Discord 전송 실패: ${errorMessage}`,
              updatedAt: new Date()
            };
            generationStore.updateJob(job.promptId!, completedJob);
            
            // 작업 완료로 서버 해제
            queueMonitor.releaseServerJob(job.id);
          }

          this.monitoringJobs.delete(job.promptId!);
          return;
        }

        // 5. 작업 실패 판정 (큐에서 사라졌지만 outputs가 없는 경우)
        if (!isInQueue && !hasOutputs && promptData) {
          log.error('ComfyUI job failed (removed from queue but no outputs)', { promptId: job.promptId });
          
          // 히스토리에서 오류 정보 확인
          const errorInfo = this.extractErrorFromHistory(promptData);
          
          await queueService.updateRequest(job.id, {
            status: QueueStatus.FAILED,
            failedAt: new Date(),
            error: errorInfo || 'ComfyUI에서 작업이 실패했습니다 (outputs 없음)'
          });

          const failedJob: Partial<GenerationJob> = {
            status: 'failed',
            error: errorInfo || 'ComfyUI에서 작업이 실패했습니다',
            updatedAt: new Date()
          };
          generationStore.updateJob(job.promptId!, failedJob);
          
          // 작업 실패로 서버 해제
          queueMonitor.releaseServerJob(job.id);
          
          this.monitoringJobs.delete(job.promptId!);
          return;
        }

        // 6. 작업이 아직 진행 중이면 계속 모니터링
        // 디버깅: 작업 진행 중 로그 완전 제거
        retryCount = 0; // 성공하면 재시도 카운트 리셋
        setTimeout(monitor, this.monitoringInterval);

      } catch (error) {
        retryCount++;
        log.error('Job monitoring error', { retryCount, maxRetries, error: error instanceof Error ? error.message : String(error) });
        
        // 최대 재시도 후 실패 처리
        if (retryCount >= maxRetries) {
          log.error('Max retries exceeded, monitoring stopped', { promptId: job.promptId });
          this.monitoringJobs.delete(job.promptId!);
          
          // 최대 재시도 초과로 서버 해제
          queueMonitor.releaseServerJob(job.id);
          
          // 데이터베이스 상태 업데이트
          await queueService.updateRequest(job.id, {
            status: QueueStatus.FAILED,
            failedAt: new Date(),
            error: error instanceof Error ? error.message : '모니터링 실패'
          });

          // generationStore도 업데이트 (호환성 유지)
          const failedJob: Partial<GenerationJob> = {
            status: 'failed',
            error: error instanceof Error ? error.message : '모니터링 실패',
            updatedAt: new Date()
          };
          generationStore.updateJob(job.promptId!, failedJob);
        } else {
          // 재시도
          const retryDelay = Math.min(this.monitoringInterval * retryCount, 30000);
          log.info('Retrying monitoring', { retryDelay, retryCount, maxRetries });
          setTimeout(monitor, retryDelay);
        }
      }
    };

    // 최초 모니터링 시작
    setTimeout(monitor, this.monitoringInterval);
  }

  stopMonitoring(promptId: string): void {
    this.monitoringJobs.delete(promptId);
    log.info('Job monitoring stopped', { promptId });
  }

  isMonitoring(promptId: string): boolean {
    return this.monitoringJobs.has(promptId);
  }

  getActiveMonitoringCount(): number {
    return this.monitoringJobs.size;
  }

  private extractErrorFromHistory(promptData: ComfyUIHistoryData): string | null {
    try {
      // ComfyUI 히스토리에서 오류 정보 추출
      if (promptData.status && promptData.status.status_str === 'error') {
        return `ComfyUI 실행 오류: ${promptData.status.completed ? 'completed with error' : 'execution failed'}`;
      }
      
      // 노드별 오류 확인
      if (promptData.outputs) {
        for (const [nodeId, nodeOutput] of Object.entries(promptData.outputs)) {
          if (nodeOutput.error || nodeOutput.exception) {
            return `노드 ${nodeId} 오류: ${nodeOutput.error || nodeOutput.exception}`;
          }
        }
      }
      
      // 프롬프트 오류 확인
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

  private async sendVideoToDiscord(job: GenerationJob, outputs: Record<string, ComfyUINodeOutput>): Promise<void> {
    try {
      if (!job.userInfo) {
        log.info('No user info, skipping Discord send', { jobId: job.id });
        return;
      }

      const videoModel = (job.videoModel as VideoModel) || 'wan';
      const outputConfig = VIDEO_OUTPUT_TYPES[videoModel];
      const modelConfig = MODEL_REGISTRY[videoModel];

      let videoFound = false;
      for (const [, nodeOutput] of Object.entries(outputs)) {
        const outputFiles = (nodeOutput as Record<string, unknown>)[outputConfig.outputField] as Array<{ filename: string; subfolder?: string }> | undefined;
        if (outputFiles && outputFiles.length > 0) {
          const video = outputFiles[0];
          videoFound = true;

          const queueRequest = await queueService.getRequestById(job.id);
          if (!queueRequest?.serverId) {
            throw new Error('서버 정보를 찾을 수 없습니다');
          }

          const server = serverManager.getServerById(queueRequest.serverId);
          if (!server) {
            throw new Error(`서버를 찾을 수 없습니다: ${queueRequest.serverId}`);
          }

          const processingTime = job.updatedAt && job.createdAt
            ? Math.round((job.updatedAt.getTime() - job.createdAt.getTime()) / 1000)
            : undefined;

          log.info('Discord video send started', {
            jobId: job.id,
            videoFile: video.filename,
            videoModel,
            serverUrl: server.url
          });

          await discordBot.sendVideoToDiscord({
            filename: video.filename,
            subfolder: video.subfolder || '',
            prompt: job.prompt,
            username: job.userInfo.name,
            userAvatar: job.userInfo.image,
            processingTime,
            isNSFW: job.isNSFW,
            discordId: job.userInfo.discordId,
            comfyUIServerUrl: server.url,
            videoModel
          });

          log.info('Discord video send complete', { jobId: job.id });
          break;
        }
      }

      if (!videoFound) {
        log.info('No output field, attempting filename extraction from history', { jobId: job.id });

        const queueRequest = await queueService.getRequestById(job.id);
        if (!queueRequest?.serverId) {
          log.info('No server info, skipping Discord send', { jobId: job.id });
          return;
        }

        const server = serverManager.getServerById(queueRequest.serverId);
        if (!server) {
          log.info('Server not found, skipping Discord send', { serverId: queueRequest.serverId });
          return;
        }

        const comfyUIClient = serverManager.getClient(server);

        try {
          const history = await comfyUIClient.getHistory(job.promptId!);
          const promptData = history[job.promptId!];

          if (!promptData) {
            log.info('No prompt data found in history');
            return;
          }

          let videoFilename = null;

          if (promptData.prompt && Array.isArray(promptData.prompt)) {
            for (const promptItem of promptData.prompt) {
              if (promptItem && typeof promptItem === 'object') {
                for (const [nodeId, nodeData] of Object.entries(promptItem)) {
                  if (nodeData && typeof nodeData === 'object') {
                    const node = nodeData as ComfyUIWorkflowNode;
                    if (node.class_type && outputConfig.classTypes.includes(node.class_type)) {
                      if (node.inputs && node.inputs.filename_prefix) {
                        const filenamePrefix = node.inputs?.filename_prefix;
                        if (!filenamePrefix || typeof filenamePrefix !== 'string') continue;
                        const subfolderPattern = new RegExp('^' + modelConfig.defaultSubfolder + '/');
                        const baseFilename = filenamePrefix.replace(subfolderPattern, '');
                        videoFilename = `${baseFilename}_00001.mp4`;
                        log.info('Filename extracted from video node', {
                          nodeId,
                          classType: node.class_type,
                          filenamePrefix,
                          videoFilename
                        });
                        break;
                      }
                    }
                  }
                }
                if (videoFilename) break;
              }
            }
          }

          if (!videoFilename) {
            log.info('No video output node found in history');
            return;
          }

          log.info('Discord send with extracted filename', {
            jobId: job.id,
            videoFilename,
            serverUrl: server.url
          });

          const processingTime = job.updatedAt && job.createdAt
            ? Math.round((job.updatedAt.getTime() - job.createdAt.getTime()) / 1000)
            : undefined;

          await discordBot.sendVideoToDiscord({
            filename: videoFilename,
            subfolder: modelConfig.defaultSubfolder,
            prompt: job.prompt,
            username: job.userInfo.name,
            userAvatar: job.userInfo.image,
            processingTime,
            isNSFW: job.isNSFW,
            discordId: job.userInfo.discordId,
            comfyUIServerUrl: server.url,
            videoModel
          });

          log.info('Discord send with extracted filename complete', { jobId: job.id });
          return;

        } catch (error) {
          log.error('Filename extraction failed, skipping Discord send', { jobId: job.id, error: error instanceof Error ? error.message : String(error) });
          return;
        }
      }

    } catch (error) {
      log.error('Discord video send failed', { error: error instanceof Error ? error.message : String(error) });
    }
  }
}

export const jobMonitor = new ComfyUIJobMonitor();