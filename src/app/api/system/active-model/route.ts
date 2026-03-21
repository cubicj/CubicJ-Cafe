import { NextRequest, NextResponse } from 'next/server'
import { getActiveModel, setActiveModel } from '@/lib/database/model-settings'
import { MODEL_REGISTRY } from '@/lib/comfyui/workflows/registry'
import type { VideoModel } from '@/lib/comfyui/workflows/types'
import { sessionManager } from '@/lib/auth/session'
import { isAdmin } from '@/lib/auth/admin'

export async function GET() {
  try {
    const model = await getActiveModel()
    const config = MODEL_REGISTRY[model]
    return NextResponse.json({
      model,
      displayName: config.displayName,
      capabilities: config.capabilities,
    })
  } catch (error) {
    console.error('활성 모델 조회 오류:', error)
    return NextResponse.json(
      { error: '활성 모델을 조회할 수 없습니다.' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sessionId = sessionManager.getSessionIdFromRequest(request)
    const session = sessionId ? await sessionManager.validateSession(sessionId) : null
    if (!session?.user?.discordId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    if (!isAdmin(session.user.discordId)) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const { model } = await request.json()
    if (!model || !(model in MODEL_REGISTRY)) {
      return NextResponse.json({ error: '유효하지 않은 모델입니다.' }, { status: 400 })
    }

    await setActiveModel(model as VideoModel)
    const config = MODEL_REGISTRY[model as VideoModel]
    return NextResponse.json({
      success: true,
      model,
      displayName: config.displayName,
      capabilities: config.capabilities,
    })
  } catch (error) {
    console.error('활성 모델 변경 오류:', error)
    return NextResponse.json(
      { error: '활성 모델 변경에 실패했습니다.' },
      { status: 500 }
    )
  }
}
