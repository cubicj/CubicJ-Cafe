import { NextResponse } from 'next/server'
import { ComfyUIClient } from '@/lib/comfyui/client'
import { createLogger } from '@/lib/logger';
import { isComfyUIEnabled } from '@/lib/comfyui/comfyui-state';
import { createRouteHandler } from '@/lib/api/route-handler';

const statusCheckOptions = { timeout: 2000, maxRetries: 0 } as const;
const localStatusClient = new ComfyUIClient(statusCheckOptions);

const log = createLogger('comfyui');

interface ServerStatus {
  type: 'local' | 'runpod'
  name: string
  status: 'connected' | 'disconnected' | 'error'
  queue?: {
    remaining: number
  }
  error?: string
}

export const GET = createRouteHandler(
  { auth: 'user' },
  async () => {
    try {
      if (!isComfyUIEnabled()) {
        return {
          enabled: false,
          servers: [],
          summary: {
            local: { active: 0, total: 0 },
            runpod: { active: 0, total: 0 },
            totalActive: 0,
            totalServers: 0
          },
          timestamp: new Date().toISOString()
        };
      }
      const serverCheckPromises: Promise<ServerStatus>[] = []

      const localServerPromise = async (): Promise<ServerStatus> => {
        try {
          const isHealthy = await localStatusClient.pingServer()
          let queueInfo = null

          if (isHealthy) {
            try {
              queueInfo = await localStatusClient.getQueueStatus()
            } catch {
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

      const runpodUrls = (process.env.COMFYUI_RUNPOD_URLS || '').split(',').filter(url => url.trim());
      runpodUrls.forEach((url, i) => {
        const runpodServerPromise = async (): Promise<ServerStatus> => {
          try {
            const runpodClient = new ComfyUIClient({
              baseURL: url,
              ...statusCheckOptions,
            })

            const isHealthy = await runpodClient.pingServer()
            let queueInfo = null

            if (isHealthy) {
              try {
                queueInfo = await runpodClient.getQueueStatus()
              } catch {
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

      const servers = await Promise.all(serverCheckPromises)

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
    } catch {
      log.error('ComfyUI status API error: server connection failed')

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
);
