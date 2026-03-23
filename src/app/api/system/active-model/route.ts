import { NextResponse } from 'next/server'
import { createRouteHandler } from '@/lib/api/route-handler'
import { getActiveModel, setActiveModel } from '@/lib/database/model-settings'
import { MODEL_REGISTRY } from '@/lib/comfyui/workflows/registry'
import type { VideoModel } from '@/lib/comfyui/workflows/types'

export const GET = createRouteHandler(
  { auth: 'none', category: 'api' },
  async () => {
    const model = await getActiveModel()
    const config = MODEL_REGISTRY[model]
    return {
      model,
      displayName: config.displayName,
      capabilities: config.capabilities,
    }
  }
)

export const PUT = createRouteHandler(
  { auth: 'admin', category: 'admin' },
  async (req) => {
    const { model } = await req.json()
    if (!model || !(model in MODEL_REGISTRY)) {
      return NextResponse.json({ error: '유효하지 않은 모델입니다.' }, { status: 400 })
    }

    await setActiveModel(model as VideoModel)
    const config = MODEL_REGISTRY[model as VideoModel]
    return {
      model,
      displayName: config.displayName,
      capabilities: config.capabilities,
    }
  }
)
