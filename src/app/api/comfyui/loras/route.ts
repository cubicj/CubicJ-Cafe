import { NextResponse } from 'next/server'
import { serverManager } from '@/lib/comfyui/server-manager'
import { createLogger } from '@/lib/logger';
import { isComfyUIEnabled } from '@/lib/comfyui/comfyui-state';
import { createRouteHandler, AuthenticatedRequest } from '@/lib/api/route-handler';

const log = createLogger('comfyui');

export const GET = createRouteHandler(
  { auth: 'user' },
  async (req: AuthenticatedRequest) => {
    if (!isComfyUIEnabled()) {
      return {
        enabled: false,
        loras: [],
        categorized: { all: [], safetensors: [], ckpt: [], pt: [], high: [], low: [] },
        count: 0,
        serverInfo: null,
        timestamp: new Date().toISOString()
      };
    }
    const { searchParams } = new URL(req.url)
    const model = searchParams.get('model') || 'wan'

    await serverManager.checkServerHealth()
    const bestServer = serverManager.selectBestServer()

    if (!bestServer) {
      return NextResponse.json(
        {
          error: 'ComfyUI 서버에 연결할 수 없습니다. 모든 서버가 사용 불가능합니다.',
          loras: [],
          serverUrl: null
        },
        { status: 503 }
      )
    }

    const quickClient = serverManager.getClient(bestServer)

    let loras: string[]
    try {
      loras = await quickClient.getLoRAList(model)
    } catch (connectionError) {
      log.error('Selected server connection failed', { serverId: bestServer.id, error: connectionError instanceof Error ? connectionError.message : String(connectionError) })
      return NextResponse.json(
        {
          error: `선택된 서버(${bestServer.type})에 연결할 수 없습니다. 서버가 다운되었거나 응답하지 않습니다.`,
          loras: [],
          serverInfo: {
            id: bestServer.id,
            type: bestServer.type,
            url: bestServer.url,
            healthy: false
          }
        },
        { status: 503 }
      )
    }

    log.debug('LoRA list fetched', { model, count: loras.length })

    const categorizedLoras = model === 'ltx'
      ? {
          all: loras,
          safetensors: loras.filter(f => f.endsWith('.safetensors')),
          ckpt: [] as string[],
          pt: [] as string[],
          high: [] as string[],
          low: [] as string[],
        }
      : {
          all: loras,
          safetensors: loras.filter(f => f.endsWith('.safetensors')),
          ckpt: loras.filter(f => f.endsWith('.ckpt')),
          pt: loras.filter(f => f.endsWith('.pt')),
          high: loras.filter(f => f.includes('WAN\\High\\')),
          low: loras.filter(f => f.includes('WAN\\Low\\')),
        }

    return {
      loras,
      categorized: categorizedLoras,
      count: loras.length,
      serverInfo: {
        id: bestServer.id,
        type: bestServer.type,
        url: bestServer.url,
        healthy: true
      },
      timestamp: new Date().toISOString()
    }
  }
);
