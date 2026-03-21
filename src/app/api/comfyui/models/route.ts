import { NextResponse } from 'next/server'
import { ComfyUIClient } from '@/lib/comfyui/client'

import { createLogger } from '@/lib/logger';

const log = createLogger('comfyui');

export async function GET() {
  try {
    log.info('ComfyUI model list API called')
    
    const client = new ComfyUIClient()
    
    try {
      const models = await client.getModelList()
      
      log.info('Model list fetched', {
        diffusionModels: models.diffusionModels.length,
        textEncoders: models.textEncoders.length,
        vaes: models.vaes.length,
        upscaleModels: models.upscaleModels.length,
        clipVisions: models.clipVisions.length
      })
      
      return NextResponse.json({
        success: true,
        models
      })
    } catch (connectionError) {
      log.error('ComfyUI server connection failed', { error: connectionError instanceof Error ? connectionError.message : String(connectionError) })
      
      return NextResponse.json({
        success: false,
        error: 'ComfyUI 서버에 연결할 수 없습니다. 서버가 다운되었거나 응답하지 않습니다.',
        models: {
          diffusionModels: [],
          textEncoders: [],
          vaes: [],
          upscaleModels: [],
          clipVisions: []
        }
      }, { 
        status: 503 
      })
    }
    
  } catch (error) {
    log.error('Failed to fetch ComfyUI model list', { error: error instanceof Error ? error.message : String(error) })
    
    return NextResponse.json({
      success: false,
      error: '모델 목록을 가져오는 중 오류가 발생했습니다.'
    }, { 
      status: 500 
    })
  }
}