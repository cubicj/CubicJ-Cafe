import { QueueService } from '@/lib/database/queue';
import { QueueStatus, ReferenceKind } from '@/generated/prisma/enums';
import { buildWorkflow } from './workflow-router';
import { MODEL_REGISTRY } from './workflows/registry';
import type { VideoModel } from './workflows/types';
import { prepareGenerationParams } from './workflows/prepare-params';
import { jobMonitor } from './job-monitor';
import type { LoRAPresetData } from '@/types';

import { createLogger } from '@/lib/logger';
import { isComfyUIEnabled } from './comfyui-state';
import { getQueuePauseAfterPosition } from './queue-pause-state';
import { serverManager, type ActiveServer } from './server-manager';

type ClaimedQueueRequest = NonNullable<Awaited<ReturnType<typeof QueueService.getAndClaimNextPendingRequest>>>;

const REFERENCE_MIME_BY_EXTENSION: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  wav: 'audio/wav',
  mp3: 'audio/mpeg',
  flac: 'audio/flac',
  ogg: 'audio/ogg',
};

const log = createLogger('queue');

class QueueMonitor {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private checkInterval = 5000;
  private currentlyProcessing = new Set<string>();
  private pauseLoggedOnce = false;
  private processingInFlight = false;
  private processQueueRerun = false;
  private lastModelByServer = new Map<string, string>();

  constructor() {}

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

    serverManager.setSlotReleasedListener(() => {
      this.processQueue().catch(error => {
        log.error('Queue processing after release failed', { error: error instanceof Error ? error.message : String(error) });
      });
    });
    serverManager.enableStreaming();

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
    serverManager.disableStreaming();
    this.isRunning = false;
    log.info('Queue Monitor stopped');
  }

  private async processQueue(): Promise<void> {
    if (this.processingInFlight) {
      this.processQueueRerun = true;
      return;
    }

    this.processingInFlight = true;

    try {
      if (!isComfyUIEnabled()) return;
      // 1. 활성 서버 목록 업데이트 (주기적으로)
      await serverManager.updateActiveServers();

      const maxConcurrent = serverManager.getMaxConcurrentProcessing();

      // 2. 사용 가능한 서버 개수 확인 (실제 서버 상태 기반)
      const availableServerCount = serverManager.getAvailableServerCount();

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

        const selectedServer = serverManager.selectAvailableServer();
        if (!selectedServer) {
          break;
        }

        // 원자적으로 다음 요청을 가져와서 PROCESSING 상태로 변경
        const claimedRequest = await QueueService.getAndClaimNextPendingRequest();

        if (!claimedRequest) {
          // 디버깅: 처리할 요청 없음 로그 제거 (정상 상황)
          break;
        }

        log.debug('Request assigned to server', {
          requestId: claimedRequest.id,
          server: selectedServer.name,
          slot: i + 1
        });

        // 즉시 서버에 할당 (race condition 방지)
        serverManager.assignJobToServer(selectedServer, claimedRequest.id);

        // 병렬 처리 시작
        this.currentlyProcessing.add(claimedRequest.id);
        const promise = this.processQueueRequestWithServer(claimedRequest, selectedServer)
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
    } finally {
      this.processingInFlight = false;
      if (this.processQueueRerun) {
        this.processQueueRerun = false;
        void this.processQueue();
      }
    }
  }

  async forceRefreshQueue(): Promise<{
    status: ReturnType<QueueMonitor['getStatus']>;
    releasedSlots: number;
    releasedMemoryJobs: number;
  }> {
    if (!this.isRunning) {
      this.start();
    }

    QueueService.invalidateCache();
    serverManager.resetActiveServerRefresh();
    await serverManager.updateActiveServers();

    const { releasedSlots, releasedMemoryJobs } = await this.reconcileProcessingState();
    await this.processQueue();

    log.info('Queue force refresh completed', {
      releasedSlots,
      releasedMemoryJobs,
      status: this.getStatus()
    });

    return {
      status: this.getStatus(),
      releasedSlots,
      releasedMemoryJobs
    };
  }

  private async reconcileProcessingState(): Promise<{ releasedSlots: number; releasedMemoryJobs: number }> {
    const processingIds = new Set(await QueueService.getProcessingRequestIds());
    const releasedSlots = serverManager.reconcileProcessingSlots(processingIds);
    let releasedMemoryJobs = 0;

    for (const requestId of Array.from(this.currentlyProcessing)) {
      if (!processingIds.has(requestId)) {
        this.currentlyProcessing.delete(requestId);
        releasedMemoryJobs += 1;
      }
    }

    return { releasedSlots, releasedMemoryJobs };
  }


  // 특정 서버로 요청 처리
  async processQueueRequestWithServer(
    requestOrId: ClaimedQueueRequest | string,
    server: ActiveServer
  ): Promise<void> {
    const requestId = typeof requestOrId === 'string' ? requestOrId : requestOrId.id;
    const request = typeof requestOrId === 'string'
      ? await QueueService.getRequestById(requestOrId)
      : requestOrId;
    if (!request) {
      log.error('Request not found', { requestId });
      return;
    }


    try {
      const requestedVideoModel = request.videoModel || 'wan';
      const modelConfig = MODEL_REGISTRY[requestedVideoModel as VideoModel];
      if (!modelConfig) {
        throw new Error(`Unsupported video model: ${requestedVideoModel}`);
      }
      const videoModel = requestedVideoModel as VideoModel;

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
      } else if (!modelConfig.capabilities.referenceInputs && (!modelConfig.capabilities.startImageOptional || !request.endImageBlob)) {
        log.warn('Image blob not found', { requestId: request.id, imageFile: request.imageFile });
        throw new Error('이미지 데이터가 없습니다.');
      }

      const actualServerId = server.id;

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

      let references;
      let resolution;
      if (modelConfig.capabilities.referenceInputs) {
        const referenceRows = await QueueService.getReferenceFileRows(request.id);
        references = await this.uploadReferenceFiles(referenceRows, server.client);
        resolution = request.resolutionMode === 'custom'
          ? { mode: 'custom' as const, aspectWidth: request.aspectWidth!, aspectHeight: request.aspectHeight! }
          : { mode: 'firstImage' as const };
      }

      const inputImage = uploadedImageName || request.imageFile || undefined;
      const effectiveIsNSFW = modelConfig.capabilities.nsfw ? Boolean(request.isNSFW) : false;

      const params = await prepareGenerationParams(videoModel, {
        request: {
          prompt: request.prompt,
          videoDuration: request.videoDuration,
          isNSFW: effectiveIsNSFW,
        },
        inputImage,
        endImage: uploadedEndImageName || undefined,
        referenceAudio: uploadedAudioName || undefined,
        references,
        resolution,
        client: server.client,
      });

      const workflow = await buildWorkflow(params);

      log.debug('Workflow built', {
        server: server.name,
        requestId: requestId,
        videoModel,
        prompt: request.prompt.substring(0, 50),
        preset: loraPreset?.presetName,
        highLoras: loraPreset?.loraItems.filter(item => item.group === 'HIGH').length || 0,
        lowLoras: loraPreset?.loraItems.filter(item => item.group === 'LOW').length || 0
      });

      const currentStatus = await QueueService.getRequestStatus(requestId);
      if (currentStatus !== QueueStatus.PROCESSING) {
        log.info('Workflow submission skipped because request is no longer processing', {
          requestId,
          status: currentStatus,
        });
        serverManager.releaseServer(requestId);
        return;
      }

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
        isNSFW: effectiveIsNSFW,
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

      serverManager.releaseServer(requestId);

      await QueueService.markRequestFailedIfProcessing(requestId, {
        failedAt: new Date(),
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      });
    }
  }

  private async uploadReferenceFiles(
    rows: Awaited<ReturnType<typeof QueueService.getReferenceFileRows>>,
    client: ActiveServer['client']
  ) {
    if (rows.length === 0) {
      throw new Error('Reference files not found for reference request');
    }
    const images: string[] = [];
    const videos: { name: string; includeSoundtrack: boolean }[] = [];
    const audios: string[] = [];

    for (const row of rows) {
      const blob = await QueueService.getReferenceFileBlob(row.id);
      if (!blob) {
        throw new Error(`Reference blob missing: ${row.filename}`);
      }
      const extension = row.filename.split('.').pop()?.toLowerCase() ?? '';
      const mimeType = REFERENCE_MIME_BY_EXTENSION[extension] ?? 'application/octet-stream';
      const file = new File([new Uint8Array(blob)], row.filename, { type: mimeType });

      if (row.kind === ReferenceKind.IMAGE) {
        images.push(await client.uploadImage(file));
      } else if (row.kind === ReferenceKind.VIDEO) {
        videos.push({ name: await client.uploadVideo(file), includeSoundtrack: row.includeSoundtrack });
      } else {
        audios.push(await client.uploadAudio(file));
      }
    }

    return { images, videos, audios };
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
    const activeServers = serverManager.getActiveServers();
    return {
      running: this.isRunning,
      checkInterval: this.checkInterval,
      activeServers: activeServers.length,
      currentlyProcessing: this.currentlyProcessing.size,
      maxConcurrent: serverManager.getMaxConcurrentProcessing(),
      serverDetails: activeServers.map(s => ({ name: s.name, type: s.type }))
    };
  }

  public releaseServerJob(requestId: string): void {
    serverManager.releaseServer(requestId);
  }
}

export const queueMonitor = new QueueMonitor();
