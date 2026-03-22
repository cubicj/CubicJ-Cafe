import { NextResponse } from 'next/server'
import { serverManager } from '@/lib/comfyui/server-manager'

import { createLogger } from '@/lib/logger';
import { isComfyUIEnabled } from '@/lib/comfyui/comfyui-state';

const log = createLogger('comfyui');

export async function GET() {
  try {
    if (!isComfyUIEnabled()) {
      return NextResponse.json({
        enabled: false,
        success: false,
        loras: [],
        categorized: { all: [], safetensors: [], ckpt: [], pt: [], high: [], low: [] },
        count: 0,
        serverInfo: null,
        timestamp: new Date().toISOString()
      });
    }
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
      loras = await quickClient.getLoRAList()
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
    
    log.info('WAN LoRA list success', { count: loras.length })

    const categorizedLoras = {
      all: loras,
      safetensors: loras.filter(f => f.endsWith('.safetensors')),
      ckpt: loras.filter(f => f.endsWith('.ckpt')),
      pt: loras.filter(f => f.endsWith('.pt')),
      high: loras.filter(f => f.includes('WAN\\High\\')),
      low: loras.filter(f => f.includes('WAN\\Low\\'))
    }

    return NextResponse.json({
      success: true,
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
    })

  } catch (error) {
    log.error('Failed to fetch WAN LoRA list', { error: error instanceof Error ? error.message : String(error) })
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'LoRA 목록 조회에 실패했습니다.',
        loras: [],
        serverInfo: {
          url: null,
          healthy: false
        },
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}