import { ComfyUIClient } from './client'
import { createLogger } from '@/lib/logger'

const log = createLogger('comfyui')

export interface ComfyUIServer {
  id: string
  type: 'LOCAL' | 'RUNPOD'
  url: string
  isActive: boolean
  activeJobs: number
  maxJobs: number
  priority: number
}

export class ComfyUIServerManager {
  private servers: ComfyUIServer[] = []
  private clients: Map<string, ComfyUIClient> = new Map()

  constructor() {
    this.initializeServers()
  }

  private initializeServers() {
    this.servers = []
    
    const localUrl = process.env.COMFYUI_API_URL || 'http://localhost:8188'
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

  getAvailableServers(): ComfyUIServer[] {
    return this.servers
      .filter(server => server.isActive && server.activeJobs < server.maxJobs)
      .sort((a, b) => a.priority - b.priority || a.activeJobs - b.activeJobs)
  }

  selectBestServer(): ComfyUIServer | null {
    const availableServers = this.getAvailableServers()
    
    if (availableServers.length === 0) {
      log.warn('No available servers, attempting local server fallback')

      const localServer = this.servers.find(s => s.type === 'LOCAL')
      if (localServer) {
        log.info('Fallback to local server', { url: localServer.url })
        return localServer
      }

      log.error('All servers unavailable')
      return null
    }

    const bestServer = availableServers[0]
    log.info('Best server selected', { type: bestServer.type, id: bestServer.id, url: bestServer.url })
    
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

  incrementJobCount(serverId: string): void {
    const server = this.getServerById(serverId)
    if (server) {
      server.activeJobs++
    }
  }

  decrementJobCount(serverId: string): void {
    const server = this.getServerById(serverId)
    if (server && server.activeJobs > 0) {
      server.activeJobs--
    }
  }
}

export const serverManager = new ComfyUIServerManager()