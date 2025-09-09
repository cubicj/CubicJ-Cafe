import { NextResponse } from 'next/server'
import { serverManager } from '@/lib/comfyui/server-manager'

export async function GET() {
  try {
    // 서버 헬스 체크 후 사용 가능한 서버 선택
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

    // 선택된 서버의 클라이언트 생성
    const quickClient = serverManager.getClient(bestServer)
    
    // 디버깅: 서버 선택 로그 완전 제거

    // WAN 경로의 실제 LoRA 파일 목록 조회 (서버 연결 실패 시 적절한 에러 처리)
    let loras: string[]
    try {
      loras = await quickClient.getLoRAList()
    } catch (connectionError) {
      console.error('❌ 선택된 서버 연결 실패:', bestServer.id, connectionError)
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
    
    console.log('✅ WAN LoRA 목록 성공:', loras.length + '개')

    // LoRA 파일들을 카테고리별로 분류
    const categorizedLoras = {
      all: loras,
      safetensors: loras.filter(f => f.endsWith('.safetensors')),
      ckpt: loras.filter(f => f.endsWith('.ckpt')),
      pt: loras.filter(f => f.endsWith('.pt')),
      // High/Low 폴더별 분류 (실제 폴더 구조 기반)
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
    console.error('❌ WAN LoRA 목록 조회 실패:', error)
    
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