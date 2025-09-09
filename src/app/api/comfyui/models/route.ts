import { NextResponse } from 'next/server'
import { ComfyUIClient } from '@/lib/comfyui/client'

export async function GET() {
  try {
    console.log('📁 ComfyUI 모델 목록 조회 API 호출')
    
    const client = new ComfyUIClient()
    
    try {
      const models = await client.getModelList()
      
      console.log('✅ 모델 목록 조회 성공:', {
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
      console.error('❌ ComfyUI 서버 연결 실패:', connectionError)
      
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
    console.error('❌ ComfyUI 모델 목록 조회 실패:', error)
    
    return NextResponse.json({
      success: false,
      error: '모델 목록을 가져오는 중 오류가 발생했습니다.'
    }, { 
      status: 500 
    })
  }
}