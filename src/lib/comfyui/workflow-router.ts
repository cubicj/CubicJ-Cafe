import type { GenerationParams } from './workflows/types'
import type { ComfyUIWorkflow } from '@/types'
import { buildWanWorkflow } from './workflows/wan/builder'
import { buildLtxaWorkflow } from './workflows/ltxa/builder'
import { buildLtxWanWorkflow } from './workflows/ltx-wan/builder'

export async function buildWorkflow(
  params: GenerationParams
): Promise<ComfyUIWorkflow> {
  switch (params.model) {
    case 'wan':
      return buildWanWorkflow(params)
    case 'ltxa':
      return buildLtxaWorkflow(params)
    case 'ltx-wan':
      return buildLtxWanWorkflow(params)
    default:
      throw new Error(`지원하지 않는 모델: ${(params as { model: string }).model}`)
  }
}
