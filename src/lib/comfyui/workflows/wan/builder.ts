import type { ComfyUIWorkflow } from '@/types'
import type { ComfyUIServer } from '../../server-manager'
import type { WanGenerationParams } from '../types'
import { WAN_WORKFLOW_TEMPLATE } from './template'
import { createLogger } from '@/lib/logger'
import { getWanSettings } from '@/lib/database/system-settings'

const log = createLogger('comfyui')

export async function buildWanWorkflow(params: WanGenerationParams, _server?: ComfyUIServer): Promise<ComfyUIWorkflow> {
  const settings = await getWanSettings()
  const workflow = JSON.parse(JSON.stringify(WAN_WORKFLOW_TEMPLATE))

  if (workflow['10']?.inputs) {
    workflow['10'].inputs.text = params.prompt
  }

  if (workflow['41']?.inputs) {
    workflow['41'].inputs.text = settings.negativePrompt
  }

  if (workflow['25']?.inputs) {
    workflow['25'].inputs.megapixels = settings.megapixels
  }
  if (workflow['18']?.inputs) {
    workflow['18'].inputs.megapixels = settings.megapixels
  }

  if (workflow['32']?.inputs) {
    workflow['32'].inputs.shift = settings.shift
  }
  if (workflow['33']?.inputs) {
    workflow['33'].inputs.shift = settings.shift
  }

  if (workflow['20']?.inputs) {
    workflow['20'].inputs.nag_scale = settings.nagScale
  }
  if (workflow['19']?.inputs) {
    workflow['19'].inputs.nag_scale = settings.nagScale
  }

  if (workflow['43']?.inputs) {
    workflow['43'].inputs.steps = settings.stepsHigh
  }
  if (workflow['44']?.inputs) {
    workflow['44'].inputs.steps = settings.stepsLow
  }

  if (workflow['31']?.inputs) {
    workflow['31'].inputs.length = settings.length
  }
  if (workflow['30']?.inputs) {
    workflow['30'].inputs.length = settings.length
  }
  if (workflow['37']?.inputs) {
    workflow['37'].inputs.length = settings.length
  }
  if (workflow['29']?.inputs) {
    workflow['29'].inputs.length = settings.length
  }

  if (workflow['14']?.inputs) {
    workflow['14'].inputs.sampler_name = settings.sampler
  }

  if (workflow['5']?.inputs) {
    workflow['5'].inputs.image = params.inputImage
  }

  if (params.endImage) {
    if (workflow['11']?.inputs) {
      workflow['11'].inputs.image = params.endImage
    }
  } else {
    handleEndImageBypass(workflow)
  }

  if (workflow['3']?.inputs) {
    workflow['3'].inputs.noise_seed = Math.floor(Math.random() * 0xFFFFFFFFFFFF)
  }

  if (workflow['21'] && params.inputImage) {
    const baseImageName = params.inputImage.replace(/\.(png|jpg|jpeg|webp)$/i, '')
    workflow['21'].inputs.filename_prefix = `WAN/${baseImageName}`
  }

  if (settings.loraEnabled && params.loraPreset && params.loraPreset.loraItems?.length > 0) {
    log.warn('LoRA is not supported in the new WAN workflow — no LoRA loader nodes exist', {
      presetName: params.loraPreset.presetName,
      itemCount: params.loraPreset.loraItems.length,
    })
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
  delete workflow['30']
  delete workflow['31']
  delete workflow['11']
  delete workflow['18']

  if (workflow['16']?.inputs) workflow['16'].inputs.latent_image = ['37', 2]
  if (workflow['4']?.inputs) workflow['4'].inputs.conditioning = ['37', 0]
  if (workflow['17']?.inputs) workflow['17'].inputs.conditioning = ['29', 0]

  log.info('End image bypass applied — switched to WanImageToVideo')
}
