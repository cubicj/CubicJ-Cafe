import { logger } from '@/lib/logger'

export class ComfyUIServerManager {
  private baseURL: string
  private timeout: number
  
  constructor(baseURL: string, timeout: number = 10000) {
    this.baseURL = baseURL
    this.timeout = timeout
  }

  async checkServerHealth(): Promise<boolean> {
    try {
      await this.makeRequest('/system_stats', { method: 'GET' })
      return true
    } catch {
      return false
    }
  }

  async pingServer(): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2000)

      const response = await fetch(`${this.baseURL}/`, {
        method: 'HEAD',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      return response.ok
    } catch {
      return false
    }
  }

  async interruptProcessing(): Promise<void> {
    try {
      await this.makeRequest('/interrupt', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      logger.logComfyUIEvent('Processing interrupted successfully')
    } catch (error) {
      console.error('ComfyUI 처리 중단 실패:', error)
      throw error
    }
  }

  async getRunpodServers(): Promise<string[]> {
    const runpodUrlsEnv = process.env.COMFYUI_RUNPOD_URLS
    if (!runpodUrlsEnv || runpodUrlsEnv.trim() === '') {
      return []
    }
    
    return runpodUrlsEnv
      .split(',')
      .map(url => url.trim())
      .filter(url => url !== '' && url !== 'https://dummy-runpod-server.test')
  }

  async checkActiveRunpodServers(): Promise<string[]> {
    const runpodServers = await this.getRunpodServers()
    if (runpodServers.length === 0) {
      return []
    }

    const activeServers: string[] = []
    
    for (const serverUrl of runpodServers) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000)

        const response = await fetch(`${serverUrl}/`, {
          method: 'HEAD',
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        
        if (response.ok) {
          activeServers.push(serverUrl)
          logger.logComfyUIEvent('Runpod server active', { server: serverUrl })
        } else {
          logger.warn('Runpod server inactive', { server: serverUrl, status: response.status })
        }
      } catch (error) {
        logger.warn('Runpod server connection failed', { server: serverUrl, error })
      }
    }

    return activeServers
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
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
  }
}