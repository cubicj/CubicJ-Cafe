import { comfyUIClient } from './client';
import { ComfyUIClient } from './client';
// env removed - using process.env directly

interface ServerStatus {
  type: 'local' | 'runpod'
  name: string
  status: 'connected' | 'disconnected' | 'error'
  queue?: {
    remaining: number
  }
  error?: string
}

export async function getComfyUIServerStatus() {
  try {
    const servers: ServerStatus[] = []
    
    // 로컬 서버 체크
    try {
      const isHealthy = await comfyUIClient.checkServerHealth()
      let queueInfo = null
      
      if (isHealthy) {
        queueInfo = await comfyUIClient.getQueueStatus()
      }
      
      servers.push({
        type: 'local',
        name: '로컬 서버',
        status: isHealthy ? 'connected' : 'disconnected',
        queue: queueInfo ? {
          remaining: queueInfo.exec_info.queue_remaining
        } : undefined
      })
    } catch {
      servers.push({
        type: 'local',
        name: '로컬 서버',
        status: 'error',
        error: '연결 실패'
      })
    }

    // Runpod 서버들 체크
    const runpodUrls = (process.env.COMFYUI_RUNPOD_URLS || '').split(',').filter(url => url.trim());
    for (let i = 0; i < runpodUrls.length; i++) {
      const url = runpodUrls[i]
      const runpodClient = new ComfyUIClient({ 
        baseURL: url,
        timeout: 10000,
        maxRetries: 1
      })
      
      try {
        const isHealthy = await runpodClient.checkServerHealth()
        let queueInfo = null
        
        if (isHealthy) {
          queueInfo = await runpodClient.getQueueStatus()
        }
        
        servers.push({
          type: 'runpod',
          name: `Runpod ${i + 1}`,
          status: isHealthy ? 'connected' : 'disconnected',
          queue: queueInfo ? {
            remaining: queueInfo.exec_info.queue_remaining
          } : undefined
        })
      } catch {
        servers.push({
          type: 'runpod',
          name: `Runpod ${i + 1}`,
          status: 'error',
          error: '연결 실패'
        })
      }
    }

    // 통계 계산
    const localServers = servers.filter(s => s.type === 'local')
    const runpodServers = servers.filter(s => s.type === 'runpod')
    
    const localActive = localServers.filter(s => s.status === 'connected').length
    const runpodActive = runpodServers.filter(s => s.status === 'connected').length
    
    return {
      servers,
      summary: {
        local: {
          active: localActive,
          total: localServers.length
        },
        runpod: {
          active: runpodActive,
          total: runpodServers.length
        },
        totalActive: localActive + runpodActive,
        totalServers: servers.length
      },
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('ComfyUI 서버 상태 확인 실패:', error)
    
    return {
      servers: [],
      summary: {
        local: { active: 0, total: 0 },
        runpod: { active: 0, total: 0 },
        totalActive: 0,
        totalServers: 0
      },
      error: '서버 상태 확인 실패',
      timestamp: new Date().toISOString()
    }
  }
}