import type { LtxGenerationParams } from '../types'
import type { ComfyUIWorkflow } from '@/types'
import type { ComfyUIServer } from '../../server-manager'
import { LTX_WORKFLOW_TEMPLATE } from './template'
import { applyLtxLoraChain } from './lora-manager'

export async function buildLtxWorkflow(
  params: LtxGenerationParams,
  server?: ComfyUIServer
): Promise<ComfyUIWorkflow> {
  const workflow = JSON.parse(JSON.stringify(LTX_WORKFLOW_TEMPLATE))

  if (workflow['5']) {
    workflow['5'].inputs.text = params.prompt
  }

  if (workflow['87']) {
    workflow['87'].inputs.image = params.inputImage
  }

  if (params.endImage) {
    if (workflow['260']) {
      workflow['260'].inputs.image = params.endImage
    }
  } else {
    handleEndImageBypass(workflow)
  }

  if (params.loraPreset && params.loraPreset.loraItems?.length > 0) {
    await applyLtxLoraChain(workflow, params.loraPreset, server)
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

function handleEndImageBypass(workflow: ComfyUIWorkflow) {
  if (workflow['265']?.inputs) {
    workflow['265'].inputs['num_images'] = '1'
    delete workflow['265'].inputs['num_images.image_2']
    delete workflow['265'].inputs['num_images.index_2']
    delete workflow['265'].inputs['num_images.strength_2']
  }

  delete workflow['260']
  delete workflow['261']
  delete workflow['264']
  delete workflow['267']
}
