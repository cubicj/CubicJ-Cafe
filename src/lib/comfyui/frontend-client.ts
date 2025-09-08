// 프론트엔드 전용 ComfyUI 클라이언트 (fs 모듈 없음, 프록시만 사용)
class FrontendComfyUIClient {
  private timeout: number
  private maxRetries: number

  constructor(options: { timeout?: number; maxRetries?: number } = {}) {
    this.timeout = options.timeout || 30000
    this.maxRetries = options.maxRetries || 3
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retries = 0
  ): Promise<T> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(`/api/comfyui/proxy${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`API 오류: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      if (retries < this.maxRetries) {
        console.warn(`요청 실패 (${retries + 1}/${this.maxRetries}): 재시도 중`)
        await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)))
        return this.makeRequest<T>(endpoint, options, retries + 1)
      }
      throw error
    }
  }

  async checkServerHealth(): Promise<boolean> {
    try {
      await this.makeRequest('/system_stats', { method: 'GET' })
      return true
    } catch {
      console.error('서버 상태 확인 실패')
      return false
    }
  }
}

export const frontendComfyUIClient = new FrontendComfyUIClient({
  timeout: 5000,
  maxRetries: 1
})

// 상태 확인용 API (클라이언트에서 직접 fetch 사용)
export async function checkComfyUIStatus() {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8초 타임아웃
    
    const response = await fetch('/api/comfyui/status', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch {
    console.error('ComfyUI 상태 확인 실패')
    return {
      servers: [],
      summary: {
        local: { active: 0, total: 0 },
        runpod: { active: 0, total: 0 },
        totalActive: 0,
        totalServers: 0
      },
      error: '서버 연결 불가',
      timestamp: new Date().toISOString()
    }
  }
}