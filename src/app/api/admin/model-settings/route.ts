import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth/admin'
import { sessionManager } from '@/lib/auth/session'
import { getModelSettings, updateModelSettings, ModelSettings } from '@/lib/database/model-settings'

export async function GET(request: NextRequest) {
  try {
    const sessionId = sessionManager.getSessionIdFromRequest(request)
    const session = sessionId ? await sessionManager.validateSession(sessionId) : null
    
    if (!session?.user?.discordId) {
      return NextResponse.json({
        success: false,
        error: '인증이 필요합니다.'
      }, { status: 401 })
    }

    if (!isAdmin(session.user.discordId)) {
      return NextResponse.json({
        success: false,
        error: '관리자 권한이 필요합니다.'
      }, { status: 403 })
    }

    const modelSettings = await getModelSettings()
    
    console.log('✅ 모델 설정 조회 성공:', modelSettings)
    
    return NextResponse.json({
      success: true,
      settings: modelSettings
    })
    
  } catch (error) {
    console.error('❌ 모델 설정 조회 실패:', error)
    
    return NextResponse.json({
      success: false,
      error: '모델 설정을 가져오는 중 오류가 발생했습니다.'
    }, { 
      status: 500 
    })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sessionId = sessionManager.getSessionIdFromRequest(request)
    const session = sessionId ? await sessionManager.validateSession(sessionId) : null
    
    if (!session?.user?.discordId) {
      return NextResponse.json({
        success: false,
        error: '인증이 필요합니다.'
      }, { status: 401 })
    }

    if (!isAdmin(session.user.discordId)) {
      return NextResponse.json({
        success: false,
        error: '관리자 권한이 필요합니다.'
      }, { status: 403 })
    }

    let body: Partial<ModelSettings>
    try {
      const requestText = await request.text()
      if (!requestText || requestText.trim() === '') {
        throw new Error('빈 요청 본문입니다.')
      }
      body = JSON.parse(requestText)
    } catch (parseError) {
      console.error('요청 JSON 파싱 에러:', parseError)
      return NextResponse.json({
        success: false,
        error: '잘못된 JSON 형식입니다.'
      }, { status: 400 })
    }
    
    console.log('🔧 모델 설정 업데이트 요청:', body)
    
    await updateModelSettings(body)
    
    const updatedSettings = await getModelSettings()
    
    console.log('✅ 모델 설정 업데이트 성공:', updatedSettings)
    
    return NextResponse.json({
      success: true,
      settings: updatedSettings,
      message: '모델 설정이 성공적으로 업데이트되었습니다.'
    })
    
  } catch (error) {
    console.error('❌ 모델 설정 업데이트 실패:', error)
    
    return NextResponse.json({
      success: false,
      error: '모델 설정 업데이트 중 오류가 발생했습니다.'
    }, { 
      status: 500 
    })
  }
}