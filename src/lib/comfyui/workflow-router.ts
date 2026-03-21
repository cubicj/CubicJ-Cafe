import type { GenerationParams } from './workflows/types'
import type { ComfyUIWorkflow } from '@/types'
import type { ComfyUIServer } from './server-manager'
import { buildWanWorkflow } from './workflows/wan/builder'
import { buildLtxWorkflow } from './workflows/ltx/builder'

export async function buildWorkflow(
  params: GenerationParams,
  server?: ComfyUIServer
): Promise<ComfyUIWorkflow> {
  switch (params.model) {
    case 'wan':
      return buildWanWorkflow(params, server)
    case 'ltx':
      return buildLtxWorkflow(params, server)
    default:
      throw new Error(`지원하지 않는 모델: ${(params as { model: string }).model}`)
  }
}
