import type { ComfyUIWorkflow, ComfyUIResponse } from '@/types'
import type { ComfyUIPromptRequest, ComfyUIQueueResponse, ComfyUIQueueStatus, ComfyUIHistoryResponse, DownloadedMedia, ModelListResponse } from './client-types'
import { ComfyUIServerManager } from './client-server-manager'
import { ComfyUIModelManager } from './client-model-manager'
import { ComfyUIMediaManager } from './client-media-manager'

export class ComfyUIClient {
  private baseURL: string
  private clientId: string
  private timeout: number
  private maxRetries: number
  private isRunpodServer: boolean
  private serverManager: ComfyUIServerManager
  private modelManager: ComfyUIModelManager
  private mediaManager: ComfyUIMediaManager

  constructor(options: {
    baseURL?: string
    timeout?: number
    maxRetries?: number
    useProxy?: boolean
  } = {}) {
    if (options.useProxy !== false && typeof window !== 'undefined') {
      this.baseURL = '/api/comfyui/proxy'
    } else {
      const rawURL = options.baseURL || process.env.COMFYUI_API_URL || 'http://localhost:8188'
      this.baseURL = rawURL.replace(/\/$/, '')
    }
    
    this.isRunpodServer = this.baseURL.includes('runpod.io') || 
                         this.baseURL.includes('runpod.net') || 
                         (!this.baseURL.includes('192.168.') && !this.baseURL.includes('localhost') && !this.baseURL.includes('127.0.0.1'))
    this.clientId = this.generateClientId()
    this.timeout = options.timeout || 10000
    this.maxRetries = options.maxRetries || 3

    this.serverManager = new ComfyUIServerManager(this.baseURL, this.timeout)
    this.modelManager = new ComfyUIModelManager(this.baseURL, this.timeout, this.isRunpodServer, this.serverManager)
    this.mediaManager = new ComfyUIMediaManager(this.baseURL, this.timeout)
  }

  private generateClientId(): string {
    return `cubicj-cafe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retries = 0
  ): Promise<T> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const headers: Record<string, string> = { ...options.headers as Record<string, string> }
      if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json'
      }

      const fullUrl = `${this.baseURL}${endpoint}`
      
      const response = await fetch(fullUrl, {
        ...options,
        signal: controller.signal,
        headers,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(
          `ComfyUI API 오류: ${response.status} ${response.statusText}`
        )
      }

      return await response.json()
    } catch (error) {
      if (retries < this.maxRetries) {
        await this.delay(1000 * (retries + 1))
        return this.makeRequest<T>(endpoint, options, retries + 1)
      }
      throw error
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async submitPrompt(workflow: ComfyUIWorkflow): Promise<ComfyUIResponse> {
    const promptRequest: ComfyUIPromptRequest = {
      prompt: workflow,
      client_id: this.clientId,
    }

    try {
      const response = await this.makeRequest<ComfyUIResponse>('/prompt', {
        method: 'POST',
        body: JSON.stringify(promptRequest),
      })

      return response
    } catch (error) {
      console.error('❌ ComfyUI 워크플로우 전송 실패:', {
        error: error instanceof Error ? error.message : error,
        baseURL: this.baseURL,
        endpoint: '/prompt'
      })
      throw new Error(
        `ComfyUI API 연결 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      )
    }
  }

  async getQueueStatus(): Promise<ComfyUIQueueResponse | null> {
    try {
      const response = await this.makeRequest<{ exec_info?: { queue_remaining: number } }>('/queue')
      return response.exec_info ? response as ComfyUIQueueResponse : null
    } catch (error) {
      console.warn('큐 상태 확인 실패:', error)
      return null
    }
  }

  async getQueue(): Promise<ComfyUIQueueStatus | null> {
    try {
      const response = await this.makeRequest<ComfyUIQueueStatus>('/queue')
      return response
    } catch (error) {
      console.warn('큐 목록 확인 실패:', error)
      return null
    }
  }

  getWebSocketURL(): string {
    const baseURL = this.baseURL.replace(/^https?:\/\//, '')
    return `ws://${baseURL}/ws?clientId=${this.clientId}`
  }

  getClientId(): string {
    return this.clientId
  }

  getBaseURL(): string {
    return this.baseURL
  }

  // Server Manager 메소드들
  async checkServerHealth(): Promise<boolean> {
    return this.serverManager.checkServerHealth()
  }

  async pingServer(): Promise<boolean> {
    return this.serverManager.pingServer()
  }

  async interruptProcessing(): Promise<void> {
    return this.serverManager.interruptProcessing()
  }

  async getRunpodServers(): Promise<string[]> {
    return this.serverManager.getRunpodServers()
  }

  async checkActiveRunpodServers(): Promise<string[]> {
    return this.serverManager.checkActiveRunpodServers()
  }

  // Model Manager 메소드들
  async getObjectInfo(): Promise<Record<string, unknown>> {
    return this.modelManager.getObjectInfo()
  }

  async getLoRAList(): Promise<string[]> {
    return this.modelManager.getLoRAList()
  }

  async getSamplerList(): Promise<string[]> {
    return this.modelManager.getSamplerList()
  }

  async getModelList(): Promise<ModelListResponse> {
    return this.modelManager.getModelList()
  }

  // Media Manager 메소드들
  async uploadImage(file: File): Promise<string> {
    return this.mediaManager.uploadImage(file)
  }

  async getHistory(promptId?: string): Promise<ComfyUIHistoryResponse> {
    return this.mediaManager.getHistory(promptId)
  }

  async downloadMediaFromHistory(promptId: string): Promise<DownloadedMedia[]> {
    return this.mediaManager.downloadMediaFromHistory(promptId)
  }
}

export const comfyUIClient = new ComfyUIClient()