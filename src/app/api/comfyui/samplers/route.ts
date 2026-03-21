import { NextResponse } from 'next/server'
import { ComfyUIClient } from '@/lib/comfyui/client'

import { createLogger } from '@/lib/logger';
import { isComfyUIEnabled } from '@/lib/comfyui/comfyui-state';

const log = createLogger('comfyui');

export async function GET() {
  try {
    if (!isComfyUIEnabled()) {
      return NextResponse.json({
        enabled: false,
        success: false,
        samplers: []
      });
    }
    log.info('ComfyUI sampler list API called')
    
    const client = new ComfyUIClient()
    
    try {
      const samplers = await client.getSamplerList()
      
      log.info('Sampler list fetched', {
        count: samplers.length,
        samplers: samplers
      })
      
      return NextResponse.json({
        success: true,
        samplers
      })
    } catch (connectionError) {
      log.error('ComfyUI server connection failed', { error: connectionError instanceof Error ? connectionError.message : String(connectionError) })
      
      return NextResponse.json({
        success: false,
        error: 'ComfyUI 서버에 연결할 수 없습니다. 서버가 다운되었거나 응답하지 않습니다.',
        samplers: []
      }, { 
        status: 503 
      })
    }
    
  } catch (error) {
    log.error('Failed to fetch ComfyUI sampler list', { error: error instanceof Error ? error.message : String(error) })
    
    return NextResponse.json({
      success: false,
      error: '샘플러 목록을 가져오는 중 오류가 발생했습니다.'
    }, { 
      status: 500 
    })
  }
}