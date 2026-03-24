import type { ComfyUIWorkflow } from '@/types'
import type { ComfyUIServer } from '../../server-manager'
import type { WanGenerationParams } from '../types'
import { applyLoraPreset } from './lora-manager'
import { WAN_WORKFLOW_TEMPLATE } from './template'
import { getNegativePrompt } from '@/lib/database/system-settings'
import { createLogger } from '@/lib/logger'

const log = createLogger('comfyui')

export async function buildWanWorkflow(params: WanGenerationParams, server?: ComfyUIServer): Promise<ComfyUIWorkflow> {
  const workflow = JSON.parse(JSON.stringify(WAN_WORKFLOW_TEMPLATE))

  if (workflow['543']?.inputs) {
    workflow['543'].inputs.text = params.prompt
  }

  const negativePrompt = await getNegativePrompt()
  if (negativePrompt && workflow['544']?.inputs) {
    workflow['544'].inputs.text = negativePrompt
  }

  if (workflow['531']?.inputs) {
    workflow['531'].inputs.image = params.inputImage
  }

  if (params.endImage) {
    if (workflow['532']?.inputs) {
      workflow['532'].inputs.image = params.endImage
    }
  } else {
    handleEndImageBypass(workflow)
  }

  if (workflow['549']?.inputs) {
    workflow['549'].inputs.noise_seed = Math.floor(Math.random() * 0xFFFFFFFFFFFF)
  }

  if (workflow['562'] && params.inputImage) {
    const baseImageName = params.inputImage.replace(/\.(png|jpg|jpeg|webp)$/i, '')
    workflow['562'].inputs.filename_prefix = `WAN/${baseImageName}`
  }

  if (params.loraPreset && params.loraPreset.loraItems?.length > 0) {
    await applyLoraPreset(workflow, params.loraPreset, server)
  } else {
    removeLoraPlaceholder(workflow)
  }

  log.info('WAN workflow built', {
    prompt: params.prompt.substring(0, 50),
    hasEndImage: !!params.endImage,
    videoLength: 121,
    hasLoraPreset: !!(params.loraPreset && params.loraPreset.loraItems?.length),
  })

  return workflow
}

function handleEndImageBypass(workflow: ComfyUIWorkflow) {
  for (const nodeId of ['527', '538']) {
    if (workflow[nodeId]?.inputs) {
      delete workflow[nodeId].inputs.end_image
    }
  }

  delete workflow['532']
  delete workflow['534']

  log.info('End image bypass applied')
}

function removeLoraPlaceholder(workflow: ComfyUIWorkflow) {
  for (const nodeId of ['525', '526']) {
    const inputs = workflow[nodeId]?.inputs
    if (inputs) {
      Object.keys(inputs).forEach(key => {
        if (key.startsWith('lora_')) {
          delete inputs[key]
        }
      })
    }
  }
}
