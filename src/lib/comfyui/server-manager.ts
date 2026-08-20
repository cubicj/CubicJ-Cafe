import { ComfyUIClient } from './client'
import { createLogger } from '@/lib/logger'
import { getOpsSetting } from '@/lib/database/ops-settings'

const log = createLogger('comfyui')
const queueLog = createLogger('queue')

export interface ComfyUIServer {
  id: string
  type: 'LOCAL' | 'RUNPOD'
  url: string
  isActive: boolean
  activeJobs: number
  maxJobs: number
  priority: number
}

export interface ActiveServer {
  id: string
  client: ComfyUIClient
  name: string
  type: 'local' | 'runpod'
  url: string
  currentJobId?: string
}

export class ComfyUIServerManager {
  private servers: ComfyUIServer[] = []
  private clients: Map<string, ComfyUIClient> = new Map()
  private activeServers: ActiveServer[] = []
  private lastServerUpdateTime = 0
  private streamingActive = false
  private slotReleasedListener: (() => void) | null = null

  constructor() {
    this.initializeServers()
  }

  private initializeServers() {
    this.servers = []
    
    const localUrl = process.env.COMFYUI_API_URL || 'http://127.0.0.1:8188'
    this.servers.push({
      id: 'local',
      type: 'LOCAL',
      url: localUrl,
      isActive: false,
      activeJobs: 0,
      maxJobs: 1,
      priority: 2
    })

    const runpodUrls = process.env.COMFYUI_RUNPOD_URLS
    if (runpodUrls) {
      const urls = runpodUrls.split(',').map(url => {
        const trimmed = url.trim()
        return trimmed.replace(/\/$/, '')
      }).filter(Boolean)
      
      urls.forEach((url, index) => {
        this.servers.push({
          id: `runpod-${index}`,
          type: 'RUNPOD',
          url,
          isActive: false,
          activeJobs: 0,
          maxJobs: 1,
          priority: 1
        })
      })
    }

  }

  async checkServerHealth(): Promise<void> {
    const healthChecks = this.servers.map(async (server) => {
      try {
        const client = this.getClient(server)
        const isHealthy = await client.pingServer()
        server.isActive = isHealthy
        
        if (isHealthy) {
          const queueStatus = await client.getQueueStatus()
          server.activeJobs = queueStatus?.exec_info?.queue_remaining || 0
        } else {
          server.activeJobs = 0
        }
        
      } catch (error) {
        server.isActive = false
        server.activeJobs = 0
        log.warn('Server health check failed', { serverId: server.id, error: error instanceof Error ? error.message : String(error) })
      }
    })

    await Promise.all(healthChecks)
  }

  // 활성 서버 목록 업데이트 (캐시 추가)
  async updateActiveServers(): Promise<void> {
    const now = Date.now()

    // 1분 이내에 이미 업데이트했으면 스킵
    if (now - this.lastServerUpdateTime < getOpsSetting('ops.queue_health_check_interval_ms')) {
      return
    }

    const newActiveServers: ActiveServer[] = []

    // 로컬 서버 확인
    const localServer = this.getServerById('local')
    if (localServer) {
      try {
        const localClient = this.getClient(localServer)
        const isHealthy = await localClient.checkServerHealth()
        if (isHealthy) {
          const existingServer = this.activeServers.find(server => server.type === 'local')
          newActiveServers.push({
            id: localServer.id,
            client: localClient,
            name: '로컬 서버',
            type: 'local',
            url: localServer.url,
            currentJobId: existingServer?.currentJobId,
          })
        }
      } catch (error) {
        queueLog.debug('Local server health check failed', { error: error instanceof Error ? error.message : String(error) })
      }
    }

    const runpodServers = this.servers.filter(server => server.type === 'RUNPOD')
    const runpodResults = await Promise.all(
      runpodServers.map(async server => {
        const runpodClient = this.getClient(server)
        try {
          const isHealthy = await runpodClient.checkServerHealth()
          if (isHealthy) {
            const existingServer = this.activeServers.find(activeServer => activeServer.url === server.url)
            return {
              id: server.id,
              client: runpodClient,
              name: `Runpod ${server.id}`,
              type: 'runpod' as const,
              url: server.url,
              currentJobId: existingServer?.currentJobId,
            }
          }
        } catch (error) {
          queueLog.debug('Runpod server health check failed', { url: server.url, error: error instanceof Error ? error.message : String(error) })
        }
        return null
      }),
    )
    newActiveServers.push(...runpodResults.filter((server): server is NonNullable<typeof server> => server !== null))

    const removedServers = this.activeServers.filter(
      oldServer => !newActiveServers.some(server => server.url === oldServer.url),
    )
    for (const server of removedServers) {
      try {
        server.client.disconnectWebSocket()
      } catch (error) {
        queueLog.error('WebSocket disconnect failed for removed server', { server: server.name, error: error instanceof Error ? error.message : String(error) })
      }
    }

    this.activeServers = newActiveServers
    this.lastServerUpdateTime = now

    if (this.streamingActive) {
      for (const server of this.activeServers) {
        if (!server.client.isWebSocketConnected()) {
          try {
            server.client.connectWebSocket()
          } catch (error) {
            queueLog.error('WebSocket connect failed for new server', { server: server.name, error: error instanceof Error ? error.message : String(error) })
          }
        }
      }
    }
  }

  resetActiveServerRefresh(): void {
    this.lastServerUpdateTime = 0
  }

  getActiveServers(): readonly ActiveServer[] {
    return this.activeServers
  }

  // 최대 동시 처리 개수 계산 (각 서버는 1개씩만 처리 가능)
  getMaxConcurrentProcessing(): number {
    return this.activeServers.length // 서버 개수 = 최대 동시 처리 개수
  }

  getAvailableServerCount(): number {
    return this.activeServers.filter(server => !server.currentJobId).length
  }

  // 사용 가능한 서버 선택 (Runpod 우선, 작업 상태 기반)
  selectAvailableServer(): ActiveServer | null {
    if (this.activeServers.length === 0) return null

    // 1. Runpod 서버 중 사용 가능한 것 우선 선택
    const availableRunpodServers = this.activeServers.filter(
      server => server.type === 'runpod' && !server.currentJobId,
    )
    if (availableRunpodServers.length > 0) {
      return availableRunpodServers[0]
    }

    // 2. 로컬 서버 중 사용 가능한 것 선택
    const availableLocalServers = this.activeServers.filter(
      server => server.type === 'local' && !server.currentJobId,
    )
    if (availableLocalServers.length > 0) {
      return availableLocalServers[0]
    }

    // 3. 모든 서버가 사용 중이면 null 반환 (대기)
    return null
  }

  // 서버에 작업 할당
  assignJobToServer(server: ActiveServer, requestId: string): void {
    const activeServer = this.activeServers.find(candidate => candidate.url === server.url)
    if (activeServer) {
      activeServer.currentJobId = requestId
    }
  }

  // 작업 완료/실패 시 서버 슬롯 해제
  releaseServer(requestId: string): void {
    const server = this.activeServers.find(candidate => candidate.currentJobId === requestId)
    if (server) {
      server.currentJobId = undefined
      queueLog.debug('Server job released', { server: server.name, requestId })
      this.slotReleasedListener?.()
    }
  }

  setSlotReleasedListener(listener: (() => void) | null): void {
    this.slotReleasedListener = listener
  }

  reconcileProcessingSlots(processingIds: Set<string>): number {
    let releasedSlots = 0

    for (const server of this.activeServers) {
      if (server.currentJobId && !processingIds.has(server.currentJobId)) {
        queueLog.warn('Releasing orphaned server slot during force refresh', {
          server: server.name,
          requestId: server.currentJobId,
        })
        server.currentJobId = undefined
        releasedSlots += 1
      }
    }

    return releasedSlots
  }

  enableStreaming(): void {
    this.streamingActive = true
    void this.connectActiveWebSockets()
  }

  disableStreaming(): void {
    for (const server of this.activeServers) {
      try {
        server.client.disconnectWebSocket()
      } catch (error) {
        queueLog.error('WebSocket disconnect failed', { server: server.name, error: error instanceof Error ? error.message : String(error) })
      }
    }
    this.streamingActive = false
  }

  private async connectActiveWebSockets(): Promise<void> {
    await this.updateActiveServers()
    for (const server of this.activeServers) {
      try {
        server.client.connectWebSocket()
      } catch (error) {
        queueLog.error('WebSocket connect failed', { server: server.name, error: error instanceof Error ? error.message : String(error) })
      }
    }
  }

  selectBestServer(): ComfyUIServer | null {
    const availableServers = this.servers
      .filter(server => server.isActive && server.activeJobs < server.maxJobs)
      .sort((a, b) => a.priority - b.priority || a.activeJobs - b.activeJobs)
    
    if (availableServers.length === 0) {
      log.warn('No available servers')
      return null
    }

    const bestServer = availableServers[0]
    log.debug('Best server selected', { type: bestServer.type, id: bestServer.id, url: bestServer.url })
    
    return bestServer
  }

  getClient(server: ComfyUIServer): ComfyUIClient {
    let client = this.clients.get(server.id)
    
    if (!client) {
      client = new ComfyUIClient({
        baseURL: server.url,
        useProxy: false
      })
      this.clients.set(server.id, client)
    }
    
    return client
  }

  getServerById(serverId: string): ComfyUIServer | null {
    return this.servers.find(server => server.id === serverId) || null
  }

  getServerStats() {
    return {
      total: this.servers.length,
      active: this.servers.filter(s => s.isActive).length,
      local: {
        total: this.servers.filter(s => s.type === 'LOCAL').length,
        active: this.servers.filter(s => s.type === 'LOCAL' && s.isActive).length
      },
      runpod: {
        total: this.servers.filter(s => s.type === 'RUNPOD').length,
        active: this.servers.filter(s => s.type === 'RUNPOD' && s.isActive).length
      },
      servers: this.servers.map(s => ({
        id: s.id,
        type: s.type,
        url: s.url,
        isActive: s.isActive,
        activeJobs: s.activeJobs,
        maxJobs: s.maxJobs,
        priority: s.priority
      }))
    }
  }

}

export const serverManager = new ComfyUIServerManager()
