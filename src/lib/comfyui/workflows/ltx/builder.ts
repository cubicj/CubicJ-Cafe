import type { LtxGenerationParams } from '../types'
import type { ComfyUIWorkflow } from '@/types'
import type { ComfyUIServer } from '../../server-manager'
import { LTX_WORKFLOW_TEMPLATE } from './template'

export async function buildLtxWorkflow(
  params: LtxGenerationParams,
  _server?: ComfyUIServer
): Promise<ComfyUIWorkflow> {
  const workflow = JSON.parse(JSON.stringify(LTX_WORKFLOW_TEMPLATE))

  if (workflow['5']) {
    workflow['5'].inputs.text = params.prompt
  }

  if (workflow['87']) {
    workflow['87'].inputs.image = params.inputImage
  }

  if (workflow['103']) {
    workflow['103'].inputs.value = params.durationSeconds
  }

  if (workflow['16']) {
    workflow['16'].inputs.noise_seed = Math.floor(Math.random() * 0xFFFFFFFFFFFF)
  }
  if (workflow['32']) {
    workflow['32'].inputs.noise_seed = Math.floor(Math.random() * 0xFFFFFFFFFFFF)
  }

  if (workflow['38'] && params.inputImage) {
    const baseImageName = params.inputImage.replace(/\.(png|jpg|jpeg|webp)$/i, '')
    workflow['38'].inputs.filename_prefix = `LTX/${baseImageName}`
  }

  return workflow
}
