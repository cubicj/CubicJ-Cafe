import type { ComfyUIWorkflow, ComfyUIResponse } from '@/types'
import { createLogger } from '@/lib/logger'
import { comfyuiFetch } from './client-http'
import WebSocket from 'ws'

const log = createLogger('comfyui')
import type { ComfyUIPromptRequest, ComfyUIQueueResponse, ComfyUIQueueStatus, ComfyUIHistoryResponse, DownloadedMedia, ModelListResponse, WsExecutedData, WsExecutionErrorData, WsMessage } from './client-types'
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
  private ws: WebSocket | null = null
  private wsConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectTimer: NodeJS.Timeout | null = null
  private executedCallbacks = new Map<string, (data: WsExecutedData) => void>()
  private errorCallbacks = new Map<string, (data: WsExecutionErrorData) => void>()

  constructor(options: {
    baseURL?: string
    timeout?: number
    maxRetries?: number
    useProxy?: boolean
  } = {}) {
    if (options.useProxy !== false && typeof window !== 'undefined') {
      this.baseURL = '/api/comfyui/proxy'
    } else {
      const rawURL = options.baseURL || process.env.COMFYUI_API_URL || 'http://127.0.0.1:8188'
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
    return `cubicj-cafe-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retries = 0
  ): Promise<T> {
    try {
      return await comfyuiFetch<T>(this.baseURL, endpoint, options, this.timeout)
    } catch (error) {
      if (retries < this.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)))
        return this.makeRequest<T>(endpoint, options, retries + 1)
      }
      throw error
    }
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
      log.error('ComfyUI workflow submit failed', {
        error: error instanceof Error ? error.message : String(error),
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
      log.warn('Queue status check failed', { error: error instanceof Error ? error.message : String(error) })
      return null
    }
  }

  async getQueue(): Promise<ComfyUIQueueStatus | null> {
    try {
      const response = await this.makeRequest<ComfyUIQueueStatus>('/queue')
      return response
    } catch (error) {
      log.warn('Queue list check failed', { error: error instanceof Error ? error.message : String(error) })
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

  connectWebSocket(): void {
    if (this.ws) {
      return
    }

    const url = this.getWebSocketURL()
    log.info('WebSocket connecting', { url })

    this.ws = new WebSocket(url)

    this.ws.on('open', () => {
      this.wsConnected = true
      this.reconnectAttempts = 0
      log.info('WebSocket connected', { url })
    })

    this.ws.on('message', (data: WebSocket.Data, isBinary: boolean) => {
      if (isBinary) return
      this.handleWsMessage(data.toString())
    })

    this.ws.on('close', () => {
      this.wsConnected = false
      log.warn('WebSocket disconnected')
      this.attemptReconnect()
    })

    this.ws.on('error', (error: Error) => {
      log.error('WebSocket error', { error: error.message })
    })
  }

  disconnectWebSocket(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.reconnectAttempts = this.maxReconnectAttempts

    if (this.ws) {
      this.ws.removeAllListeners()
      this.ws.close()
      this.ws = null
    }

    this.wsConnected = false
  }

  isWebSocketConnected(): boolean {
    return this.wsConnected
  }

  onExecuted(promptId: string, callback: (data: WsExecutedData) => void): void {
    this.executedCallbacks.set(promptId, callback)
  }

  onExecutionError(promptId: string, callback: (data: WsExecutionErrorData) => void): void {
    this.errorCallbacks.set(promptId, callback)
  }

  removeCallbacks(promptId: string): void {
    this.executedCallbacks.delete(promptId)
    this.errorCallbacks.delete(promptId)
  }

  private handleWsMessage(raw: string): void {
    let parsed: WsMessage
    try {
      parsed = JSON.parse(raw)
    } catch {
      log.warn('WebSocket malformed message ignored')
      return
    }

    if (parsed.type === 'executed') {
      const data = parsed.data as unknown as WsExecutedData
      const callback = this.executedCallbacks.get(data.prompt_id)
      if (callback) {
        callback(data)
      }
    } else if (parsed.type === 'execution_error') {
      const data = parsed.data as unknown as WsExecutionErrorData
      const callback = this.errorCallbacks.get(data.prompt_id)
      if (callback) {
        callback(data)
      }
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      log.error('WebSocket reconnect exhausted', { attempts: this.reconnectAttempts })
      return
    }

    const delay = Math.pow(2, this.reconnectAttempts) * 1000
    this.reconnectAttempts++
    log.info('WebSocket reconnecting', { attempt: this.reconnectAttempts, delayMs: delay })

    this.reconnectTimer = setTimeout(() => {
      this.ws?.removeAllListeners()
      this.ws = null
      this.connectWebSocket()
    }, delay)
  }

  async checkServerHealth(): Promise<boolean> {
    return this.serverManager.checkServerHealth()
  }

  async pingServer(): Promise<boolean> {
    return this.serverManager.pingServer()
  }

  async freeMemory(): Promise<void> {
    return this.serverManager.freeMemory()
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

  async getObjectInfo(): Promise<Record<string, unknown>> {
    return this.modelManager.getObjectInfo()
  }

  async getLoRAList(model: string = 'wan'): Promise<string[]> {
    return this.modelManager.getLoRAList(model)
  }

  async getSamplerList(): Promise<string[]> {
    return this.modelManager.getSamplerList()
  }

  async getModelList(): Promise<ModelListResponse> {
    return this.modelManager.getModelList()
  }

  async getNodeOptions(requests: import('./client-model-manager').NodeOptionsRequest): Promise<import('./client-model-manager').NodeOptionsResponse> {
    return this.modelManager.getNodeOptions(requests)
  }

  async uploadImage(file: File): Promise<string> {
    return this.mediaManager.uploadImage(file)
  }

  async uploadAudio(file: File): Promise<string> {
    return this.mediaManager.uploadAudio(file)
  }

  async getHistory(promptId?: string): Promise<ComfyUIHistoryResponse> {
    return this.mediaManager.getHistory(promptId)
  }

  async downloadMediaFromHistory(promptId: string): Promise<DownloadedMedia[]> {
    return this.mediaManager.downloadMediaFromHistory(promptId)
  }
}

export const comfyUIClient = new ComfyUIClient()