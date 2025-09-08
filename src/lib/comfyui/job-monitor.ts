import { generationStore } from '../generation-store';
import { queueService } from '@/lib/database/queue';
import { QueueStatus } from '@prisma/client';
import { GenerationJob } from '@/types';
import { discordBot } from '../discord-bot';
import { serverManager } from './server-manager';
import { queueMonitor } from './queue-monitor';

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
      console.warn('promptId가 없는 작업은 모니터링할 수 없습니다:', job.id);
      return;
    }

    if (this.monitoringJobs.has(job.promptId)) {
      console.log('이미 모니터링 중인 작업:', job.promptId);
      return;
    }

    console.log('ComfyUI 작업 모니터링 시작:', job.promptId);
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
          console.log(`⏰ 모니터링 시간 초과 (${Math.round(elapsedTime / 1000 / 60)}분):`, job.promptId);
          
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
          console.log(`⏹️ 취소된 작업 모니터링 중단: ${job.id}`);
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
          console.log('✅ ComfyUI 작업 완료:', job.promptId);
          
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
            console.error(`\u274c Discord 전송 실패 (Job: ${job.id}):`, {
              error: errorMessage,
              stack: error instanceof Error ? error.stack : undefined,
              jobId: job.id,
              promptId: job.promptId,
              username: job.userInfo?.name
            });
            
            // Discord 전송 실패는 작업 자체를 실패로 처리하지 않고 완료로 처리
            // 대신 에러 로그만 남김
            console.warn(`\u26a0\ufe0f 작업 ${job.id}는 완료되었지만 Discord 전송에 실패했습니다.`);
            
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
          console.log('❌ ComfyUI 작업 실패 (큐에서 제거되었지만 outputs 없음):', job.promptId);
          
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
        console.error(`작업 모니터링 오류 (${retryCount}/${maxRetries}):`, error);
        
        // 최대 재시도 후 실패 처리
        if (retryCount >= maxRetries) {
          console.error(`최대 재시도 횟수 초과로 모니터링 중단: ${job.promptId}`);
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
          console.log(`${retryDelay}ms 후 재시도 (${retryCount}/${maxRetries})`);
          setTimeout(monitor, retryDelay);
        }
      }
    };

    // 최초 모니터링 시작
    setTimeout(monitor, this.monitoringInterval);
  }

  stopMonitoring(promptId: string): void {
    this.monitoringJobs.delete(promptId);
    console.log('작업 모니터링 중단:', promptId);
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
      console.warn('히스토리에서 오류 정보 추출 실패:', error);
      return null;
    }
  }

  private async sendVideoToDiscord(job: GenerationJob, outputs: Record<string, ComfyUINodeOutput>): Promise<void> {
    try {
      if (!job.userInfo) {
        console.log('사용자 정보가 없어 디스코드 전송을 건너뜁니다:', job.id);
        return;
      }

      // ComfyUI outputs에서 비디오 파일 찾기 (gifs 필드에서 mp4 파일 찾기)
      let videoFound = false;
      for (const [, nodeOutput] of Object.entries(outputs)) {
        if (nodeOutput.gifs && nodeOutput.gifs.length > 0) {
          const video = nodeOutput.gifs[0];
          videoFound = true;

          // 작업이 처리된 서버 정보 가져오기
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

          console.log('🎬 Discord 비디오 전송 시작:', { 
            jobId: job.id, 
            videoFile: video.filename,
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
            comfyUIServerUrl: server.url  // 동적 서버 URL 전달
          });

          console.log('✅ Discord 비디오 전송 완료:', job.id);
          break;
        }
      }

      // gifs 필드가 없을 때 히스토리에서 파일명 추출
      if (!videoFound) {
        console.log('gifs 필드가 없어 히스토리에서 파일명 추출 시도:', job.id);
        
        // 작업이 처리된 서버 정보 가져오기
        const queueRequest = await queueService.getRequestById(job.id);
        if (!queueRequest?.serverId) {
          console.log('서버 정보가 없어 디스코드 전송을 건너뜁니다:', job.id);
          return;
        }

        const server = serverManager.getServerById(queueRequest.serverId);
        if (!server) {
          console.log(`서버를 찾을 수 없어 디스코드 전송을 건너뜁니다: ${queueRequest.serverId}`);
          return;
        }

        const comfyUIClient = serverManager.getClient(server);

        try {
          // 히스토리 다시 조회해서 prompt 데이터 확보
          const history = await comfyUIClient.getHistory(job.promptId!);
          const promptData = history[job.promptId!];
          
          if (!promptData) {
            console.log('히스토리에서 prompt 데이터를 찾을 수 없습니다');
            return;
          }

          // 히스토리에서 VHS_VideoCombine 노드의 filename_prefix 추출
          let videoFilename = null;
          
          if (promptData.prompt && Array.isArray(promptData.prompt)) {
            // VHS_VideoCombine 노드 찾기
            for (const promptItem of promptData.prompt) {
              if (promptItem && typeof promptItem === 'object') {
                for (const [nodeId, nodeData] of Object.entries(promptItem)) {
                  if (nodeData && typeof nodeData === 'object' && 
                      (nodeData as ComfyUIWorkflowNode).class_type === 'VHS_VideoCombine') {
                    const vhsNode = nodeData as ComfyUIWorkflowNode;
                    if (vhsNode.inputs && vhsNode.inputs.filename_prefix) {
                      // filename_prefix에서 WAN/ 부분 제거하고 _00001.mp4 추가
                      const filenamePrefix = vhsNode.inputs?.filename_prefix;
                      if (!filenamePrefix || typeof filenamePrefix !== 'string') continue;
                      const baseFilename = filenamePrefix.replace(/^WAN\//, '');
                      videoFilename = `${baseFilename}_00001.mp4`;
                      console.log('🎯 VHS_VideoCombine에서 파일명 추출:', {
                        nodeId,
                        filenamePrefix,
                        videoFilename
                      });
                      break;
                    }
                  }
                }
                if (videoFilename) break;
              }
            }
          }

          if (!videoFilename) {
            console.log('히스토리에서 VHS_VideoCombine 노드를 찾을 수 없습니다');
            return;
          }
          
          console.log('🎬 추출된 파일명으로 Discord 전송 시작:', { 
            jobId: job.id, 
            videoFilename,
            serverUrl: server.url 
          });

          const processingTime = job.updatedAt && job.createdAt 
            ? Math.round((job.updatedAt.getTime() - job.createdAt.getTime()) / 1000)
            : undefined;

          await discordBot.sendVideoToDiscord({
            filename: videoFilename,
            subfolder: 'WAN',
            prompt: job.prompt,
            username: job.userInfo.name,
            userAvatar: job.userInfo.image,
            processingTime,
            isNSFW: job.isNSFW,
            discordId: job.userInfo.discordId,
            comfyUIServerUrl: server.url
          });

          console.log('✅ 추출된 파일명으로 Discord 전송 완료:', job.id);
          return;
          
        } catch (error) {
          console.error('히스토리에서 파일명 추출 중 오류:', error);
          console.log('파일명 추출 실패로 디스코드 전송을 건너뜁니다:', job.id);
          return;
        }
      }

    } catch (error) {
      console.error('❌ 디스코드 비디오 전송 실패:', error);
      // 디스코드 전송 실패는 전체 작업을 실패시키지 않음
    }
  }
}

export const jobMonitor = new ComfyUIJobMonitor();