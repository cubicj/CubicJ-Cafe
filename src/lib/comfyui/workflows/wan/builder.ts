import type { ComfyUIWorkflow } from '@/types'
import type { ComfyUIServer } from '../../server-manager'
import type { WanGenerationParams } from '../types'
import { applyLoraPreset } from './lora-manager'
import { WAN_WORKFLOW_TEMPLATE } from './template'
import { createLogger } from '@/lib/logger'
import { getWanSettings } from '@/lib/database/system-settings'

const log = createLogger('comfyui')

export async function buildWanWorkflow(params: WanGenerationParams, server?: ComfyUIServer): Promise<ComfyUIWorkflow> {
  const settings = await getWanSettings()
  const workflow = JSON.parse(JSON.stringify(WAN_WORKFLOW_TEMPLATE))

  if (workflow['543']?.inputs) {
    workflow['543'].inputs.text = params.prompt
  }

  if (workflow['544']?.inputs) {
    workflow['544'].inputs.text = settings.negativePrompt
  }

  if (workflow['533']?.inputs) {
    workflow['533'].inputs.megapixels = settings.megapixels
  }
  if (workflow['534']?.inputs) {
    workflow['534'].inputs.megapixels = settings.megapixels
  }

  if (workflow['539']?.inputs) {
    workflow['539'].inputs.shift = settings.shift
  }
  if (workflow['541']?.inputs) {
    workflow['541'].inputs.shift = settings.shift
  }

  if (workflow['540']?.inputs) {
    workflow['540'].inputs.nag_scale = settings.nagScale
  }
  if (workflow['542']?.inputs) {
    workflow['542'].inputs.nag_scale = settings.nagScale
  }

  if (workflow['553']?.inputs) {
    workflow['553'].inputs.steps = settings.stepsHigh
  }
  if (workflow['554']?.inputs) {
    workflow['554'].inputs.steps = settings.stepsLow
  }

  if (workflow['527']?.inputs) {
    workflow['527'].inputs.length = settings.length
  }
  if (workflow['538']?.inputs) {
    workflow['538'].inputs.length = settings.length
  }
  if (workflow['565']?.inputs) {
    workflow['565'].inputs.length = settings.length
  }
  if (workflow['567']?.inputs) {
    workflow['567'].inputs.length = settings.length
  }

  if (workflow['545']?.inputs) {
    workflow['545'].inputs.sampler_name = settings.sampler
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

  if (settings.loraEnabled && params.loraPreset && params.loraPreset.loraItems?.length > 0) {
    await applyLoraPreset(workflow, params.loraPreset, server)
  } else {
    removeLoraPlaceholder(workflow)
  }

  log.info('WAN workflow built', {
    prompt: params.prompt.substring(0, 50),
    hasEndImage: !!params.endImage,
    videoLength: settings.length,
    loraEnabled: settings.loraEnabled,
    hasLoraPreset: !!(params.loraPreset && params.loraPreset.loraItems?.length),
  })

  return workflow
}

function handleEndImageBypass(workflow: ComfyUIWorkflow) {
  delete workflow['527']
  delete workflow['538']
  delete workflow['532']
  delete workflow['534']

  if (workflow['546']?.inputs) workflow['546'].inputs.latent_image = ['565', 2]
  if (workflow['550']?.inputs) workflow['550'].inputs.conditioning = ['565', 0]
  if (workflow['551']?.inputs) workflow['551'].inputs.conditioning = ['567', 0]

  log.info('End image bypass applied — switched to WanImageToVideo')
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
