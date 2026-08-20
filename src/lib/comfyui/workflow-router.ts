import type { GenerationParams } from './workflows/types'
import type { ComfyUIWorkflow } from '@/types'
import { buildWanWorkflow } from './workflows/wan/builder'
import { buildLtxaWorkflow } from './workflows/ltxa/builder'
import { buildLtxrWorkflow } from './workflows/ltxr/builder'
import { buildLtxWanWorkflow } from './workflows/ltx-wan/builder'
import { buildH3Fl2vaWorkflow } from './workflows/h3-fl2va/builder'

export async function buildWorkflow(
  params: GenerationParams
): Promise<ComfyUIWorkflow> {
  switch (params.model) {
    case 'wan':
      return buildWanWorkflow(params)
    case 'ltxa':
      return buildLtxaWorkflow(params)
    case 'ltxr':
      return buildLtxrWorkflow(params)
    case 'ltx-wan':
      return buildLtxWanWorkflow(params)
    case 'h3-fl2va':
      return buildH3Fl2vaWorkflow(params)
    default:
      throw new Error(`지원하지 않는 모델: ${(params as { model: string }).model}`)
  }
}
