import { NextResponse } from 'next/server'
import { ComfyUIClient } from '@/lib/comfyui/client'
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

export async function GET() {
  try {
    // 서버 체크 함수들을 병렬로 실행
    const serverCheckPromises: Promise<ServerStatus>[] = []
    
    // 로컬 서버 체크 (빠른 ping 사용)
    const localServerPromise = async (): Promise<ServerStatus> => {
      try {
        const localClient = new ComfyUIClient({ 
          timeout: 2000, // 2초로 단축
          maxRetries: 0   // 재시도 없음
        })
        
        // 빠른 ping 체크
        const isHealthy = await localClient.pingServer()
        let queueInfo = null
        
        if (isHealthy) {
          try {
            queueInfo = await localClient.getQueueStatus()
          } catch {
            // 큐 정보 조회 실패해도 서버는 연결된 것으로 처리
          }
        }
        
        return {
          type: 'local',
          name: '로컬 서버',
          status: isHealthy ? 'connected' : 'disconnected',
          queue: queueInfo ? {
            remaining: queueInfo.exec_info.queue_remaining
          } : undefined
        }
      } catch {
        return {
          type: 'local',
          name: '로컬 서버',
          status: 'error',
          error: '연결 실패'
        }
      }
    }
    
    serverCheckPromises.push(localServerPromise())

    // Runpod 서버들 체크 (병렬로)
    const runpodUrls = (process.env.COMFYUI_RUNPOD_URLS || '').split(',').filter(url => url.trim());
    runpodUrls.forEach((url, i) => {
      const runpodServerPromise = async (): Promise<ServerStatus> => {
        try {
          const runpodClient = new ComfyUIClient({ 
            baseURL: url,
            timeout: 2000, // 2초로 단축
            maxRetries: 0   // 재시도 없음
          })
          
          // 빠른 ping 체크
          const isHealthy = await runpodClient.pingServer()
          let queueInfo = null
          
          if (isHealthy) {
            try {
              queueInfo = await runpodClient.getQueueStatus()
            } catch {
              // 큐 정보 조회 실패해도 서버는 연결된 것으로 처리
            }
          }
          
          return {
            type: 'runpod',
            name: `Runpod ${i + 1}`,
            status: isHealthy ? 'connected' : 'disconnected',
            queue: queueInfo ? {
              remaining: queueInfo.exec_info.queue_remaining
            } : undefined
          }
        } catch {
          return {
            type: 'runpod',
            name: `Runpod ${i + 1}`,
            status: 'error',
            error: '연결 실패'
          }
        }
      }
      
      serverCheckPromises.push(runpodServerPromise())
    })
    
    // 모든 서버 체크를 병렬로 실행
    const servers = await Promise.all(serverCheckPromises)

    // 통계 계산
    const localServers = servers.filter(s => s.type === 'local')
    const runpodServers = servers.filter(s => s.type === 'runpod')
    
    const localActive = localServers.filter(s => s.status === 'connected').length
    const runpodActive = runpodServers.filter(s => s.status === 'connected').length
    
    return NextResponse.json({
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
    })
  } catch {
    console.error('ComfyUI 상태 확인 API 오류: 서버 연결 실패')
    
    return NextResponse.json({
      servers: [],
      summary: {
        local: { active: 0, total: 0 },
        runpod: { active: 0, total: 0 },
        totalActive: 0,
        totalServers: 0
      },
      error: '서버 상태 확인 실패',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}