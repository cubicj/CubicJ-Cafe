import { NextRequest, NextResponse } from 'next/server'
import { withAdmin, AuthenticatedRequest } from '@/lib/auth/middleware'
import { getModelSettings, updateModelSettings, ModelSettings } from '@/lib/database/model-settings'

import { createLogger } from '@/lib/logger';

const log = createLogger('admin');

export async function GET(request: NextRequest) {
  return withAdmin(request, async () => {
    try {
      const modelSettings = await getModelSettings()

      log.info('Model settings fetched:', modelSettings)

      return NextResponse.json({
        success: true,
        settings: modelSettings
      })
    } catch (error) {
      log.error('Failed to fetch model settings', { error: error instanceof Error ? error.message : String(error) })

      return NextResponse.json({
        success: false,
        error: '모델 설정을 가져오는 중 오류가 발생했습니다.'
      }, {
        status: 500
      })
    }
  })
}

export async function PUT(request: NextRequest) {
  return withAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      let body: Partial<ModelSettings>
      try {
        const requestText = await req.text()
        if (!requestText || requestText.trim() === '') {
          throw new Error('빈 요청 본문입니다.')
        }
        body = JSON.parse(requestText)
      } catch (parseError) {
        log.error('Request JSON parse error', { error: parseError instanceof Error ? parseError.message : String(parseError) })
        return NextResponse.json({
          success: false,
          error: '잘못된 JSON 형식입니다.'
        }, { status: 400 })
      }

      log.info('Model settings update request:', body)

      await updateModelSettings(body)

      const updatedSettings = await getModelSettings()

      log.info('Model settings updated:', updatedSettings)

      return NextResponse.json({
        success: true,
        settings: updatedSettings,
        message: '모델 설정이 성공적으로 업데이트되었습니다.'
      })
    } catch (error) {
      log.error('Failed to update model settings', { error: error instanceof Error ? error.message : String(error) })

      return NextResponse.json({
        success: false,
        error: '모델 설정 업데이트 중 오류가 발생했습니다.'
      }, {
        status: 500
      })
    }
  })
}
