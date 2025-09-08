import { queueService } from '@/lib/database/queue';
import { QueueStatus } from '@prisma/client';
import { ComfyUIClient } from './client';
import { buildWanWorkflow } from './workflow-builder';
import { jobMonitor } from './job-monitor';
// env removed - using process.env directly
import type { LoRAPresetData } from '@/types';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { scheduleFileCleanup } from '@/lib/utils/file-cleanup';
import { logger } from '@/lib/logger';

class QueueMonitor {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private checkInterval = 5000; // 5초마다 확인
  private comfyUIClient: ComfyUIClient;
  private currentlyProcessing = new Set<string>(); // 현재 처리 중인 요청 추적
  private activeServers: Array<{ client: ComfyUIClient; name: string; type: 'local' | 'runpod'; url: string; currentJobId?: string }> = [];

  constructor() {
    // 서버용 ComfyUI 클라이언트 (프록시 사용 안함, 더 긴 타임아웃)
    this.comfyUIClient = new ComfyUIClient({ 
      useProxy: false,
      timeout: 15000,
      maxRetries: 2
    });
  }

  // 활성 서버 목록 업데이트 (캐시 추가)
  private lastServerUpdateTime = 0;
  private serverUpdateInterval = 60000; // 1분마다만 서버 상태 확인
  
  private async updateActiveServers(): Promise<void> {
    const now = Date.now();
    
    // 1분 이내에 이미 업데이트했으면 스킵
    if (now - this.lastServerUpdateTime < this.serverUpdateInterval) {
      return;
    }
    
    const newActiveServers: Array<{ client: ComfyUIClient; name: string; type: 'local' | 'runpod'; url: string; currentJobId?: string }> = [];

    // 로컬 서버 확인
    const localUrl = process.env.COMFYUI_API_URL || 'http://localhost:8188';
    try {
      const isHealthy = await this.comfyUIClient.checkServerHealth();
      if (isHealthy) {
        // 기존 서버에서 현재 작업 ID 보존
        const existingServer = this.activeServers.find(s => s.type === 'local');
        newActiveServers.push({
          client: this.comfyUIClient,
          name: '로컬 서버',
          type: 'local',
          url: localUrl,
          currentJobId: existingServer?.currentJobId
        });
      }
    } catch {
      // 로그 빈도 줄임
    }

    // Runpod 서버들 확인
    const runpodUrls = (process.env.COMFYUI_RUNPOD_URLS || '').split(',').filter(url => url.trim());
    for (let i = 0; i < runpodUrls.length; i++) {
      const url = runpodUrls[i];
      const runpodClient = new ComfyUIClient({ 
        baseURL: url,
        timeout: 10000,
        maxRetries: 1,
        useProxy: false
      });
      
      try {
        const isHealthy = await runpodClient.checkServerHealth();
        if (isHealthy) {
          // 기존 서버에서 현재 작업 ID 보존
          const existingServer = this.activeServers.find(s => s.url === url);
          newActiveServers.push({
            client: runpodClient,
            name: `Runpod ${i + 1}`,
            type: 'runpod',
            url: url,
            currentJobId: existingServer?.currentJobId
          });
        }
      } catch {
        // 로그 빈도 줄임
      }
    }

    this.activeServers = newActiveServers;
    this.lastServerUpdateTime = now;
    
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
      logger.warn('Queue Monitor already running');
      return;
    }

    // 이전 인터벌이 남아있다면 정리
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = true;
    logger.info('Queue Monitor started');

    this.intervalId = setInterval(async () => {
      try {
        await this.processQueue();
      } catch (error) {
        console.error('❌ Queue 처리 중 오류:', error);
      }
    }, this.checkInterval);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    logger.info('Queue Monitor stopped');
  }

  private async processQueue(): Promise<void> {
    // 1. 활성 서버 목록 업데이트 (주기적으로)
    await this.updateActiveServers();

    const maxConcurrent = this.getMaxConcurrentProcessing();
    
    // 2. 사용 가능한 서버 개수 확인 (실제 서버 상태 기반)
    const availableServerCount = this.activeServers.filter(server => !server.currentJobId).length;
    
    // 3. 메모리와 데이터베이스 모두에서 처리 중인 요청 수 확인
    const actualProcessingCount = await queueService.getProcessingCount();
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
      // 사용 가능한 서버 선택
      const selectedServer = this.selectAvailableServer();
      if (!selectedServer) {
        break;
      }

      // 원자적으로 다음 요청을 가져와서 PROCESSING 상태로 변경
      const claimedRequest = await queueService.getAndClaimNextPendingRequest();
      
      if (!claimedRequest) {
        // 디버깅: 처리할 요청 없음 로그 제거 (정상 상황)
        break;
      }

      logger.logGenerationEvent('Request assigned to server', { 
        requestId: claimedRequest.id, 
        server: selectedServer.name, 
        slot: i + 1 
      });

      // 즉시 서버에 할당 (race condition 방지)
      this.assignJobToServer(selectedServer, claimedRequest.id);

      // 병렬 처리 시작
      this.currentlyProcessing.add(claimedRequest.id);
      const promise = this.processQueueRequestWithServer(claimedRequest.id, selectedServer)
        .finally(() => {
          this.currentlyProcessing.delete(claimedRequest.id);
        });
      
      promises.push(promise);
    }

    // 모든 병렬 처리 시작 (await하지 않음 - 비동기 실행)
    if (promises.length > 0) {
      logger.logGenerationEvent('Parallel processing started', { count: promises.length });
    }
  }


  // 특정 서버로 요청 처리
  async processQueueRequestWithServer(
    requestId: string, 
    server: { client: ComfyUIClient; name: string; type: 'local' | 'runpod'; url: string; currentJobId?: string }
  ): Promise<void> {
    const request = await queueService.getRequestById(requestId);
    if (!request) {
      console.error(`요청을 찾을 수 없습니다: ${requestId}`);
      return;
    }


    try {
      // LoRA 프리셋 데이터 파싱
      let loraPreset: LoRAPresetData | null = null;
      if (request.loraPresetData) {
        try {
          loraPreset = JSON.parse(request.loraPresetData);
        } catch (parseError) {
          console.error('LoRA 프리셋 데이터 파싱 실패:', parseError);
        }
      }

      // 임시 파일을 읽어서 ComfyUI에 업로드
      let uploadedImageName = null
      
      
      if (request.imageData && existsSync(request.imageData)) {
        try {
          // 임시 파일을 File 객체로 변환 (ComfyUI에서도 고유한 파일명 사용)
          const imageBuffer = await readFile(request.imageData)
          const blob = new Blob([new Uint8Array(imageBuffer)], { type: 'image/png' })
          // 기존 임시 파일명을 그대로 사용 (이미 고유함)
          const comfyUIFileName = request.imageFile || `upload_${request.id}_${Date.now()}.png`
          const file = new File([blob], comfyUIFileName, { type: 'image/png' })
          
          // ComfyUI에 파일 업로드
          uploadedImageName = await server.client.uploadImage(file)
          
          // 업로드 성공 후 임시 파일 정리 예약 (10분 후)
          scheduleFileCleanup(request.imageData, 10)
        } catch (error) {
          console.error('❌ 이미지 업로드 실패:', error)
          throw new Error(`이미지 업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
        }
      } else {
        console.warn('⚠️ 이미지 파일이 없습니다.', {
          requestId: request.id,
          imageFile: request.imageFile,
          imagePath: request.imageData,
          fileExists: request.imageData ? existsSync(request.imageData) : false
        })
        throw new Error('이미지 파일이 없습니다.')
      }

      // ComfyUI 워크플로우 빌드 (서버 정보 전달)
      const serverInfo = {
        id: server.type === 'runpod' ? 'runpod-temp' : 'local',
        type: server.type === 'runpod' ? 'RUNPOD' as const : 'LOCAL' as const,
        url: server.url,
        isActive: true,
        activeJobs: 0,
        maxJobs: 1,
        priority: server.type === 'runpod' ? 1 : 2
      }
      
      // 끝 이미지 처리 - 먼저 끝 이미지 업로드 (있는 경우)
      let uploadedEndImageName = null;
      if (request.endImageFile && request.endImageData && existsSync(request.endImageData)) {
        const endImageBuffer = await readFile(request.endImageData);
        const endImageBlob = new Blob([new Uint8Array(endImageBuffer)], { type: 'image/png' });
        const endImageFile = new File([endImageBlob], request.endImageFile, { type: 'image/png' });
        uploadedEndImageName = await server.client.uploadImage(endImageFile);
        
        // 업로드 성공 후 임시 파일 정리 예약 (10분 후)
        scheduleFileCleanup(request.endImageData, 10);
      }

      const workflow = await buildWanWorkflow({
        prompt: request.prompt,
        inputImage: uploadedImageName || request.imageFile || 'input_image.png',
        endImage: uploadedEndImageName || undefined,
        loraPreset: loraPreset || undefined,
        videoLength: request.workflowLength || (16 * (request.duration || 5) + 1)
      }, serverInfo);

      logger.logGenerationEvent('Workflow built', {
        server: server.name,
        requestId: requestId,
        prompt: request.prompt.substring(0, 50),
        preset: loraPreset?.presetName,
        highLoras: loraPreset?.loraItems.filter(item => item.group === 'HIGH').length || 0,
        lowLoras: loraPreset?.loraItems.filter(item => item.group === 'LOW').length || 0
      });

      // 선택된 서버에 워크플로우 전송
      const response = await server.client.submitPrompt(workflow);
      
      logger.logGenerationEvent('Workflow submitted', {
        server: server.name,
        requestId: requestId,
        promptId: response.prompt_id
      });

      // 요청 상태 업데이트 (prompt_id 저장)
      await queueService.updateRequest(requestId, {
        jobId: response.prompt_id
      });


      // Job Monitor로 실제 작업 완료 모니터링 시작
      const job = {
        id: requestId,
        userId: request.userId.toString(),
        promptId: response.prompt_id,
        prompt: request.prompt,
        status: 'processing' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        isNSFW: Boolean(request.isNSFW),
        userInfo: {
          name: request.user?.nickname || request.nickname,
          image: request.user?.avatar || undefined,
          discordId: request.user?.discordId || undefined
        }
      };

      await jobMonitor.startMonitoring(job);

    } catch (error) {
      console.error(`❌ 요청 처리 실패 (${server.name}): ${requestId}`, error);
      
      await queueService.updateRequest(requestId, {
        status: QueueStatus.FAILED,
        failedAt: new Date(),
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      });
    }
  }

  // 레거시 메서드 (호환성 유지)
  async processQueueRequest(requestId: string): Promise<void> {
    const request = await queueService.getRequestById(requestId);
    if (!request) {
      console.error(`요청을 찾을 수 없습니다: ${requestId}`);
      return;
    }


    try {
      // LoRA 프리셋 데이터 파싱
      let loraPreset: LoRAPresetData | null = null;
      if (request.loraPresetData) {
        try {
          loraPreset = JSON.parse(request.loraPresetData);
        } catch (parseError) {
          console.error('LoRA 프리셋 데이터 파싱 실패:', parseError);
        }
      }

      // 임시 파일을 읽어서 ComfyUI에 업로드 (레거시)
      let uploadedImageName = null
      
      
      if (request.imageData && existsSync(request.imageData)) {
        try {
          // 임시 파일을 File 객체로 변환 (ComfyUI에서도 고유한 파일명 사용)
          const imageBuffer = await readFile(request.imageData)
          const blob = new Blob([new Uint8Array(imageBuffer)], { type: 'image/png' })
          // 기존 임시 파일명을 그대로 사용 (이미 고유함) - 레거시
          const comfyUIFileName = request.imageFile || `upload_${request.id}_${Date.now()}.png`
          const file = new File([blob], comfyUIFileName, { type: 'image/png' })
          
          // ComfyUI에 파일 업로드
          uploadedImageName = await this.comfyUIClient.uploadImage(file)
          
          // 업로드 성공 후 임시 파일 정리 예약 (10분 후)
          scheduleFileCleanup(request.imageData, 10)
        } catch (error) {
          console.error('❌ 이미지 업로드 실패 (레거시):', error)
          throw new Error(`이미지 업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
        }
      } else {
        console.warn('⚠️ 이미지 파일이 없습니다. (레거시)', {
          requestId: request.id,
          imageFile: request.imageFile,
          imagePath: request.imageData,
          fileExists: request.imageData ? existsSync(request.imageData) : false
        })
        throw new Error('이미지 파일이 없습니다.')
      }

      // ComfyUI 워크플로우 빌드 (레거시 - 로컬만 사용)
      const legacyServerInfo = {
        id: 'local',
        type: 'LOCAL' as const,
        url: process.env.COMFYUI_API_URL || 'http://localhost:8188',
        isActive: true,
        activeJobs: 0,
        maxJobs: 1,
        priority: 2
      }
      
      // 끝 이미지 처리 - 레거시 처리 (있는 경우)
      let uploadedEndImageName = null;
      if (request.endImageFile && request.endImageData && existsSync(request.endImageData)) {
        const endImageBuffer = await readFile(request.endImageData);
        const endImageBlob = new Blob([new Uint8Array(endImageBuffer)], { type: 'image/png' });
        const endImageFile = new File([endImageBlob], request.endImageFile, { type: 'image/png' });
        uploadedEndImageName = await this.comfyUIClient.uploadImage(endImageFile);
        
        // 업로드 성공 후 임시 파일 정리 예약 (10분 후)
        scheduleFileCleanup(request.endImageData, 10);
      }

      const workflow = await buildWanWorkflow({
        prompt: request.prompt,
        inputImage: uploadedImageName || request.imageFile || 'input_image.png',
        endImage: uploadedEndImageName || undefined,
        loraPreset: loraPreset || undefined,
        videoLength: request.workflowLength || (16 * (request.duration || 5) + 1)
      }, legacyServerInfo);


      // ComfyUI에 워크플로우 전송
      const response = await this.comfyUIClient.submitPrompt(workflow);
      

      // 요청 상태 업데이트 (prompt_id 저장, 상태는 PROCESSING 유지)
      await queueService.updateRequest(requestId, {
        jobId: response.prompt_id
      });


      // Job Monitor로 실제 작업 완료 모니터링 시작
      const job = {
        id: requestId,
        userId: request.userId.toString(),
        promptId: response.prompt_id,
        prompt: request.prompt,
        status: 'processing' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        isNSFW: Boolean(request.isNSFW),
        userInfo: {
          name: request.user?.nickname || request.nickname,
          image: request.user?.avatar || undefined,
          discordId: request.user?.discordId || undefined
        }
      };

      await jobMonitor.startMonitoring(job);

    } catch (error) {
      console.error(`❌ 요청 처리 실패: ${requestId}`, error);
      
      // 에러 시 서버 해제 (요청 ID로 서버 찾기)
      const serverToRelease = this.activeServers.find(s => s.currentJobId === requestId);
      if (serverToRelease) {
        this.releaseJobFromServer(serverToRelease, requestId);
      }
      
      await queueService.updateRequest(requestId, {
        status: QueueStatus.FAILED,
        failedAt: new Date(),
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      });
    } finally {
      // 작업 완료/실패와 관계없이 메모리에서 제거
      // (실제 서버 해제는 job monitor에서 처리)
    }
  }

  private buildPrompt(userPrompt: string, lora?: string | null, loraStrength?: number | null): string {
    let finalPrompt = userPrompt.trim();
    
    // 품질 프롬프트 추가
    const qualityPrompt = "best quality, 8k, highly detailed, cinematic";
    finalPrompt = `${finalPrompt}, ${qualityPrompt}`;
    
    // LoRA 추가
    if (lora && lora !== 'none' && loraStrength) {
      finalPrompt = `${finalPrompt}, <lora:${lora}:${loraStrength}>`;
    }
    
    return finalPrompt;
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
  
  // 서버에 작업 할당
  private assignJobToServer(server: { client: ComfyUIClient; name: string; type: 'local' | 'runpod'; url: string; currentJobId?: string }, requestId: string): void {
    const serverIndex = this.activeServers.findIndex(s => s.url === server.url);
    if (serverIndex !== -1) {
      this.activeServers[serverIndex].currentJobId = requestId;
    }
  }
  
  // 서버에서 작업 해제
  private releaseJobFromServer(server: { client: ComfyUIClient; name: string; type: 'local' | 'runpod'; url: string; currentJobId?: string }, requestId: string): void {
    const serverIndex = this.activeServers.findIndex(s => s.url === server.url);
    if (serverIndex !== -1 && this.activeServers[serverIndex].currentJobId === requestId) {
      this.activeServers[serverIndex].currentJobId = undefined;
    }
  }
  
  // 외부에서 작업 완료 시 호출할 수 있는 메서드
  public releaseServerJob(requestId: string): void {
    const server = this.activeServers.find(s => s.currentJobId === requestId);
    if (server) {
      server.currentJobId = undefined;
      logger.logGenerationEvent('Server job released', { server: server.name, requestId });
    }
  }
}

export const queueMonitor = new QueueMonitor();