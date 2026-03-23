import { NextResponse } from 'next/server'
import { createRouteHandler } from '@/lib/api/route-handler'
import { getModelSettings, updateModelSettings, ModelSettings } from '@/lib/database/model-settings'
import { createLogger } from '@/lib/logger'

const log = createLogger('admin')

export const GET = createRouteHandler(
  { auth: 'admin', category: 'admin' },
  async () => {
    const modelSettings = await getModelSettings()
    log.info('Model settings fetched:', modelSettings)
    return { settings: modelSettings }
  }
)

export const PUT = createRouteHandler(
  { auth: 'admin', category: 'admin' },
  async (req) => {
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
        error: '잘못된 JSON 형식입니다.'
      }, { status: 400 })
    }

    log.info('Model settings update request:', body)

    await updateModelSettings(body)

    const updatedSettings = await getModelSettings()

    log.info('Model settings updated:', updatedSettings)

    return {
      settings: updatedSettings,
      message: '모델 설정이 성공적으로 업데이트되었습니다.'
    }
  }
)
