import { NextResponse } from 'next/server'
import { ComfyUIClient } from '@/lib/comfyui/client'

export async function GET() {
  try {
    console.log('📁 ComfyUI 샘플러 목록 조회 API 호출')
    
    const client = new ComfyUIClient()
    
    try {
      const samplers = await client.getSamplerList()
      
      console.log('✅ 샘플러 목록 조회 성공:', {
        count: samplers.length,
        samplers: samplers
      })
      
      return NextResponse.json({
        success: true,
        samplers
      })
    } catch (connectionError) {
      console.error('❌ ComfyUI 서버 연결 실패:', connectionError)
      
      return NextResponse.json({
        success: false,
        error: 'ComfyUI 서버에 연결할 수 없습니다. 서버가 다운되었거나 응답하지 않습니다.',
        samplers: []
      }, { 
        status: 503 
      })
    }
    
  } catch (error) {
    console.error('❌ ComfyUI 샘플러 목록 조회 실패:', error)
    
    return NextResponse.json({
      success: false,
      error: '샘플러 목록을 가져오는 중 오류가 발생했습니다.'
    }, { 
      status: 500 
    })
  }
}