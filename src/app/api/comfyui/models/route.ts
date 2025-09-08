import { NextResponse } from 'next/server'
import { ComfyUIClient } from '@/lib/comfyui/client'

export async function GET() {
  try {
    console.log('📁 ComfyUI 모델 목록 조회 API 호출')
    
    const client = new ComfyUIClient()
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