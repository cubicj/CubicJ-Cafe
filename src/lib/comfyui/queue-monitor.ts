import { QueueService } from '@/lib/database/queue';
import { QueueStatus } from '@prisma/client';
import { ComfyUIClient } from './client';
import { buildWorkflow } from './workflow-router';
import { MODEL_REGISTRY } from './workflows/registry';
import type { GenerationParams, VideoModel } from './workflows/types';
import { jobMonitor } from './job-monitor';
import type { LoRAPresetData } from '@/types';

import { createLogger } from '@/lib/logger';
import { isComfyUIEnabled } from './comfyui-state';
import { getQueuePauseAfterPosition } from './queue-pause-state';
import { serverManager } from './server-manager';
import { getOpsSetting } from '@/lib/database/ops-settings';

const log = createLogger('queue');

class QueueMonitor {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private checkInterval = 5000;
  private currentlyProcessing = new Set<string>();
  private pauseLoggedOnce = false;
  private activeServers: Array<{ client: ComfyUIClient; name: string; type: 'local' | 'runpod'; url: string; currentJobId?: string }> = [];
  private lastModelByServer = new Map<string, string>();

  constructor() {}

  // 활성 서버 목록 업데이트 (캐시 추가)
  private lastServerUpdateTime = 0;
  private get serverUpdateInterval(): number {
    return getOpsSetting('ops.queue_health_check_interval_ms');
  }
  
  private async updateActiveServers(): Promise<void> {
    const now = Date.now();
    
    // 1분 이내에 이미 업데이트했으면 스킵
    if (now - this.lastServerUpdateTime < this.serverUpdateInterval) {
      return;
    }
    
    const newActiveServers: Array<{ client: ComfyUIClient; name: string; type: 'local' | 'runpod'; url: string; currentJobId?: string }> = [];

    // 로컬 서버 확인
    const localServer = serverManager.getServerById('local');
    if (localServer) {
      try {
        const localClient = serverManager.getClient(localServer);
        const isHealthy = await localClient.checkServerHealth();
        if (isHealthy) {
          const existingServer = this.activeServers.find(s => s.type === 'local');
          newActiveServers.push({
            client: localClient,
            name: '로컬 서버',
            type: 'local',
            url: localServer.url,
            currentJobId: existingServer?.currentJobId
          });
        }
      } catch (error) {
        log.debug('Local server health check failed', { error: error instanceof Error ? error.message : String(error) });
      }
    }

    const runpodServers = serverManager.getServerStats().servers.filter(s => s.type === 'RUNPOD');
    const runpodResults = await Promise.all(
      runpodServers.map(async (server) => {
        const runpodServer = serverManager.getServerById(server.id);
        if (!runpodServer) return null;
        const runpodClient = serverManager.getClient(runpodServer);
        try {
          const isHealthy = await runpodClient.checkServerHealth();
          if (isHealthy) {
            const existingServer = this.activeServers.find(s => s.url === server.url);
            return {
              client: runpodClient,
              name: `Runpod ${server.id}`,
              type: 'runpod' as const,
              url: server.url,
              currentJobId: existingServer?.currentJobId
            };
          }
        } catch (error) {
          log.debug('Runpod server health check failed', { url: server.url, error: error instanceof Error ? error.message : String(error) });
        }
        return null;
      })
    );
    newActiveServers.push(...runpodResults.filter((r): r is NonNullable<typeof r> => r !== null));

    const removedServers = this.activeServers.filter(
      old => !newActiveServers.some(s => s.url === old.url)
    );
    for (const server of removedServers) {
      try {
        server.client.disconnectWebSocket();
      } catch (error) {
        log.error('WebSocket disconnect failed for removed server', { server: server.name, error: error instanceof Error ? error.message : String(error) });
      }
    }

    this.activeServers = newActiveServers;
    this.lastServerUpdateTime = now;

    if (this.isRunning) {
      for (const server of this.activeServers) {
        if (!server.client.isWebSocketConnected()) {
          try {
            server.client.connectWebSocket();
          } catch (error) {
            log.error('WebSocket connect failed for new server', { server: server.name, error: error instanceof Error ? error.message : String(error) });
          }
        }
      }
    }
  }

  // 최대 동시 처리 개수 계산 (각 서버는 1개씩만 처리 가능)
  private getMaxConcurrentProcessing(): number {
    return this.activeServers.length; // 서버 개수 = 최대 동시 처리 개수
  }

  // 사용 가능한 서버 선택 (Runpod 우선, 작업 상태 기반)
  private selectAvailableServer(): { client: ComfyUIClient; name: string; type: 'local' | 'runpod'; url: string; currentJobId?: string } | null {
    if (this.activeServers.length === 0) return null;
    
    // 1. Runpod 서버 중 사용 가능한 것 우선 선택
    const availableRunpodServers = this.activeServers.filter(server => 
      server.type === 'runpod' && !server.currentJobId
    );
    
    if (availableRunpodServers.length > 0) {
      return availableRunpodServers[0];
    }
    
    // 2. 로컬 서버 중 사용 가능한 것 선택
    const availableLocalServers = this.activeServers.filter(server => 
      server.type === 'local' && !server.currentJobId
    );
    
    if (availableLocalServers.length > 0) {
      return availableLocalServers[0];
    }
    
    // 3. 모든 서버가 사용 중이면 null 반환 (대기)
    return null;
  }

  start(): void {
    if (this.isRunning) {
      log.warn('Queue Monitor already running');
      return;
    }

    // 이전 인터벌이 남아있다면 정리
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = true;
    log.info('Queue Monitor started');

    this.connectActiveWebSockets();

    this.processQueue().catch(error => {
      log.error('Initial queue processing error', { error: error instanceof Error ? error.message : String(error) });
    });

    this.intervalId = setInterval(async () => {
      try {
        await this.processQueue();
      } catch (error) {
        log.error('Queue processing error', { error: error instanceof Error ? error.message : String(error) });
      }
    }, this.checkInterval);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.disconnectAllWebSockets();
    this.isRunning = false;
    log.info('Queue Monitor stopped');
  }

  private async processQueue(): Promise<void> {
    if (!isComfyUIEnabled()) return;
    // 1. 활성 서버 목록 업데이트 (주기적으로)
    await this.updateActiveServers();

    const maxConcurrent = this.getMaxConcurrentProcessing();
    
    // 2. 사용 가능한 서버 개수 확인 (실제 서버 상태 기반)
    const availableServerCount = this.activeServers.filter(server => !server.currentJobId).length;
    
    // 3. 메모리와 데이터베이스 모두에서 처리 중인 요청 수 확인
    const actualProcessingCount = await QueueService.getProcessingCount();
    const memoryProcessingCount = this.currentlyProcessing.size;
    
    // 더 큰 값을 사용 (Race Condition 방지)
    const currentProcessingCount = Math.max(actualProcessingCount, memoryProcessingCount);

    // 활성 서버가 없으면 처리 불가
    if (maxConcurrent === 0 || availableServerCount === 0) {
      return;
    }

    // 4. 서버별 상태와 전체 처리량 모두 체크
    const actualAvailableSlots = Math.min(
      availableServerCount, // 사용 가능한 서버 수
      maxConcurrent - currentProcessingCount // 전체 처리 가능 슬롯
    );
    
    if (actualAvailableSlots <= 0) {
      return;
    }

    // 디버깅: 동시 처리 현황 로그 완전 제거

    // 5. 사용 가능한 서버 수만큼만 요청 처리
    const promises: Promise<void>[] = [];

    for (let i = 0; i < actualAvailableSlots; i++) {
      const pauseAfterPosition = getQueuePauseAfterPosition();
      if (pauseAfterPosition !== null) {
        const nextPendingPosition = await QueueService.peekNextPendingPosition();
        if (nextPendingPosition === null || nextPendingPosition > pauseAfterPosition) {
          if (!this.pauseLoggedOnce) {
            log.info('Queue paused by reservation', { pauseAfterPosition });
            this.pauseLoggedOnce = true;
          }
          break;
        }
      } else {
        this.pauseLoggedOnce = false;
      }

      const selectedServer = this.selectAvailableServer();
      if (!selectedServer) {
        break;
      }

      // 원자적으로 다음 요청을 가져와서 PROCESSING 상태로 변경
      const claimedRequest = await QueueService.getAndClaimNextPendingRequest();
      
      if (!claimedRequest) {
        // 디버깅: 처리할 요청 없음 로그 제거 (정상 상황)
        break;
      }

      log.info('Request assigned to server', {
        requestId: claimedRequest.id,
        server: selectedServer.name,
        slot: i + 1
      });

      // 즉시 서버에 할당 (race condition 방지)
      this.assignJobToServer(selectedServer, claimedRequest.id);

      // 병렬 처리 시작
      this.currentlyProcessing.add(claimedRequest.id);
      const promise = this.processQueueRequestWithServer(claimedRequest.id, selectedServer)
        .catch(error => {
          log.error('Queue request processing failed', {
            requestId: claimedRequest.id,
            error: error instanceof Error ? error.message : String(error),
          });
        })
        .finally(() => {
          this.currentlyProcessing.delete(claimedRequest.id);
        });
      
      promises.push(promise);
    }

    // 모든 병렬 처리 시작 (await하지 않음 - 비동기 실행)
    if (promises.length > 0) {
      log.debug('Parallel processing started', { count: promises.length });
    }
  }


  // 특정 서버로 요청 처리
  async processQueueRequestWithServer(
    requestId: string, 
    server: { client: ComfyUIClient; name: string; type: 'local' | 'runpod'; url: string; currentJobId?: string }
  ): Promise<void> {
    const request = await QueueService.getRequestById(requestId);
    if (!request) {
      log.error('Request not found', { requestId });
      return;
    }


    try {
      const videoModel = (request.videoModel as VideoModel) || 'wan';
      const modelConfig = MODEL_REGISTRY[videoModel];

      const lastModel = this.lastModelByServer.get(server.url);
      if (lastModel && lastModel !== videoModel) {
        log.info('Model switch detected, freeing VRAM', { server: server.name, from: lastModel, to: videoModel });
        try {
          await server.client.freeMemory();
        } catch (error) {
          log.warn('VRAM free failed, continuing anyway', { error: error instanceof Error ? error.message : String(error) });
        }
      }

      let loraPreset: LoRAPresetData | null = null;
      if (modelConfig.capabilities.loraPresets && request.loraPresetData) {
        try {
          loraPreset = JSON.parse(request.loraPresetData);
        } catch (parseError) {
          log.error('LoRA preset data parse failed', { error: parseError instanceof Error ? parseError.message : String(parseError) });
        }
      }

      let uploadedImageName = null


      if (request.imageBlob) {
        try {
          const blob = new Blob([request.imageBlob], { type: 'image/png' });
          const comfyUIFileName = request.imageFile || `upload_${request.id}_${Date.now()}.png`;
          const file = new File([blob], comfyUIFileName, { type: 'image/png' });
          uploadedImageName = await server.client.uploadImage(file);
        } catch (error) {
          log.error('Image upload failed', { error: error instanceof Error ? error.message : String(error) });
          throw new Error(`이미지 업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        }
      } else {
        log.warn('Image blob not found', { requestId: request.id, imageFile: request.imageFile });
        throw new Error('이미지 데이터가 없습니다.');
      }

      const actualServerId = this.resolveServerId(server);
      const serverInfo = {
        id: actualServerId,
        type: server.type === 'runpod' ? 'RUNPOD' as const : 'LOCAL' as const,
        url: server.url,
        isActive: true,
        activeJobs: 0,
        maxJobs: 1,
        priority: server.type === 'runpod' ? 1 : 2
      }

      let uploadedEndImageName = null;
      if (request.endImageBlob && request.endImageFile) {
        const endBlob = new Blob([request.endImageBlob], { type: 'image/png' });
        const endFile = new File([endBlob], request.endImageFile, { type: 'image/png' });
        uploadedEndImageName = await server.client.uploadImage(endFile);
      }

      let uploadedAudioName = null;
      if (request.audioBlob && request.audioFile) {
        const audioBlob = new Blob([request.audioBlob], { type: 'audio/wav' });
        const audioFile = new File([audioBlob], request.audioFile, { type: 'audio/wav' });
        uploadedAudioName = await server.client.uploadAudio(audioFile);
      }

      const inputImage = uploadedImageName || request.imageFile || 'input_image.png';

      let params: GenerationParams;
      if (videoModel === 'wan') {
        params = {
          model: 'wan',
          prompt: request.prompt,
          inputImage,
          videoDuration: request.videoDuration,
          loraPreset: loraPreset || undefined,
          endImage: uploadedEndImageName || undefined,
        };
      } else if (videoModel === 'ltx-wan') {
        params = {
          model: 'ltx-wan',
          prompt: request.prompt,
          inputImage,
          videoDuration: request.videoDuration,
          endImage: uploadedEndImageName || undefined,
          referenceAudio: uploadedAudioName || undefined,
        };
      } else {
        params = {
          model: 'ltx',
          prompt: request.prompt,
          inputImage,
          videoDuration: request.videoDuration,
          endImage: uploadedEndImageName || undefined,
          referenceAudio: uploadedAudioName || undefined,
        };
      }

      const workflow = await buildWorkflow(params, serverInfo);

      log.debug('Workflow built', {
        server: server.name,
        requestId: requestId,
        videoModel,
        prompt: request.prompt.substring(0, 50),
        preset: loraPreset?.presetName,
        highLoras: loraPreset?.loraItems.filter(item => item.group === 'HIGH').length || 0,
        lowLoras: loraPreset?.loraItems.filter(item => item.group === 'LOW').length || 0
      });

      // 선택된 서버에 워크플로우 전송
      const response = await server.client.submitPrompt(workflow);
      
      this.lastModelByServer.set(server.url, videoModel);

      log.info('Workflow submitted', {
        server: server.name,
        requestId: requestId,
        promptId: response.prompt_id
      });

      await QueueService.updateRequest(requestId, {
        jobId: response.prompt_id,
        serverId: actualServerId,
        workflowJson: JSON.stringify(workflow),
      });

      await QueueService.clearImageBlobs(requestId);

      const job = {
        id: requestId,
        userId: request.userId.toString(),
        promptId: response.prompt_id,
        prompt: request.prompt,
        status: 'processing' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        isNSFW: Boolean(request.isNSFW),
        videoModel,
        userInfo: {
          name: request.user?.nickname || request.nickname,
          image: request.user?.avatar || undefined,
          discordId: request.user?.discordId || undefined
        }
      };

      await jobMonitor.startMonitoring(job);

    } catch (error) {
      log.error('Request processing failed', { server: server.name, requestId, error: error instanceof Error ? error.message : String(error) });

      this.releaseServerJob(requestId);

      await QueueService.updateRequest(requestId, {
        status: QueueStatus.FAILED,
        failedAt: new Date(),
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      });
    }
  }

  private async connectActiveWebSockets(): Promise<void> {
    await this.updateActiveServers();
    for (const server of this.activeServers) {
      try {
        server.client.connectWebSocket();
      } catch (error) {
        log.error('WebSocket connect failed', { server: server.name, error: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  private disconnectAllWebSockets(): void {
    for (const server of this.activeServers) {
      try {
        server.client.disconnectWebSocket();
      } catch (error) {
        log.error('WebSocket disconnect failed', { server: server.name, error: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }

  getStatus(): { 
    running: boolean; 
    checkInterval: number;
    activeServers: number;
    currentlyProcessing: number;
    maxConcurrent: number;
    serverDetails: Array<{ name: string; type: string }>;
  } {
    return {
      running: this.isRunning,
      checkInterval: this.checkInterval,
      activeServers: this.activeServers.length,
      currentlyProcessing: this.currentlyProcessing.size,
      maxConcurrent: this.getMaxConcurrentProcessing(),
      serverDetails: this.activeServers.map(s => ({ name: s.name, type: s.type }))
    };
  }
  
  private resolveServerId(server: { type: 'local' | 'runpod'; url: string }): string {
    if (server.type === 'local') return 'local';
    const runpodUrls = (process.env.COMFYUI_RUNPOD_URLS || '').split(',').map(u => u.trim()).filter(Boolean);
    const index = runpodUrls.indexOf(server.url);
    return index !== -1 ? `runpod-${index}` : 'runpod-0';
  }

  // 서버에 작업 할당
  private assignJobToServer(server: { client: ComfyUIClient; name: string; type: 'local' | 'runpod'; url: string; currentJobId?: string }, requestId: string): void {
    const serverIndex = this.activeServers.findIndex(s => s.url === server.url);
    if (serverIndex !== -1) {
      this.activeServers[serverIndex].currentJobId = requestId;
    }
  }
  
  // 작업 완료/실패 시 서버 슬롯 해제
  public releaseServerJob(requestId: string): void {
    const server = this.activeServers.find(s => s.currentJobId === requestId);
    if (server) {
      server.currentJobId = undefined;
      log.debug('Server job released', { server: server.name, requestId });
      this.processQueue().catch(error => {
        log.error('Queue processing after release failed', { error: error instanceof Error ? error.message : String(error) });
      });
    }
  }
}

export const queueMonitor = new QueueMonitor();