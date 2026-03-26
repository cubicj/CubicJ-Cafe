import type { LtxGenerationParams } from '../types'
import type { ComfyUIWorkflow } from '@/types'
import type { ComfyUIServer } from '../../server-manager'
import { LTX_WORKFLOW_TEMPLATE } from './template'
import { applyLtxLoraChain } from './lora-manager'
import { createLogger } from '@/lib/logger'
import { getLtxSettings } from '@/lib/database/system-settings'
import { generateSeed, extractBaseImageName } from '../shared'

const log = createLogger('comfyui')

export async function buildLtxWorkflow(
  params: LtxGenerationParams,
  server?: ComfyUIServer
): Promise<ComfyUIWorkflow> {
  const settings = await getLtxSettings()
  const workflow: ComfyUIWorkflow = JSON.parse(JSON.stringify(LTX_WORKFLOW_TEMPLATE))

  if (workflow['1']?.inputs) {
    workflow['1'].inputs.vae_name = settings.audioVae
  }
  if (workflow['2']?.inputs) {
    workflow['2'].inputs.vae_name = settings.videoVae
  }
  if (workflow['47']?.inputs) {
    workflow['47'].inputs.clip_name1 = settings.clipGguf
    workflow['47'].inputs.clip_name2 = settings.clipEmbeddings
  }
  if (workflow['297']?.inputs) {
    workflow['297'].inputs.unet_name = settings.unet
    workflow['297'].inputs.weight_dtype = settings.weightDtype
  }

  if (workflow['5']?.inputs) {
    workflow['5'].inputs.text = params.prompt
  }
  if (workflow['6']?.inputs) {
    workflow['6'].inputs.text = settings.negativePrompt
  }

  if (workflow['20']?.inputs) {
    workflow['20'].inputs.sampler_name = settings.sampler
  }
  if (workflow['335']?.inputs) {
    workflow['335'].inputs.sigmas = settings.sigmas
  }
  if (workflow['317']?.inputs) {
    workflow['317'].inputs.audio_normalization_factors = settings.audioNorm
  }

  if (workflow['72']?.inputs) {
    workflow['72'].inputs.nag_scale = settings.nagScale
    workflow['72'].inputs.nag_alpha = settings.nagAlpha
    workflow['72'].inputs.nag_tau = settings.nagTau
  }

  if (workflow['103']?.inputs) {
    workflow['103'].inputs.value = settings.duration
  }
  if (workflow['11']?.inputs) {
    workflow['11'].inputs.value = Math.round(settings.frameRate)
  }
  if (workflow['12']?.inputs) {
    workflow['12'].inputs.value = settings.frameRate
  }

  if (workflow['86']?.inputs) {
    workflow['86'].inputs.megapixels = settings.megapixels
    workflow['86'].inputs.multiple_of = settings.resizeMultipleOf
    workflow['86'].inputs.upscale_method = settings.resizeUpscaleMethod
  }

  if (workflow['322']?.inputs) {
    workflow['322'].inputs.resize_type = settings.rtxResizeType
    workflow['322'].inputs['resize_type.scale'] = settings.rtxScale
    workflow['322'].inputs.quality = settings.rtxQuality
  }

  if (workflow['87']?.inputs) {
    workflow['87'].inputs.image = params.inputImage
  }

  if (params.endImage) {
    handleEndImage(workflow, params.endImage, settings)
  } else {
    handleEndImageBypass(workflow)
  }

  if (settings.loraEnabled && params.loraPreset && params.loraPreset.loraItems?.length > 0) {
    await applyLtxLoraChain(workflow, params.loraPreset, server)
  } else {
    removeLoraPlaceholder(workflow)
  }

  if (workflow['16']?.inputs) {
    workflow['16'].inputs.noise_seed = generateSeed()
  }

  if (workflow['319']?.inputs && params.inputImage) {
    workflow['319'].inputs.filename_prefix = `LTX/${extractBaseImageName(params.inputImage)}`
  }

  log.info('LTX workflow built', {
    prompt: params.prompt.substring(0, 50),
    hasEndImage: !!params.endImage,
    duration: settings.duration,
    loraEnabled: settings.loraEnabled,
    hasLoraPreset: !!(params.loraPreset && params.loraPreset.loraItems?.length),
  })

  return workflow
}

function handleEndImage(
  workflow: ComfyUIWorkflow,
  endImage: string,
  settings: { megapixels: number; resizeMultipleOf: number; resizeUpscaleMethod: string }
) {
  workflow['260'] = {
    inputs: { image: endImage },
    class_type: 'LoadImage',
    _meta: { title: 'LTX_EndImage' },
  }
  if (workflow['264']?.inputs) {
    workflow['264'].inputs.image = ['260', 0]
    workflow['264'].inputs.megapixels = settings.megapixels
    workflow['264'].inputs.multiple_of = settings.resizeMultipleOf
    workflow['264'].inputs.upscale_method = settings.resizeUpscaleMethod
  }
}

function handleEndImageBypass(workflow: ComfyUIWorkflow) {
  if (workflow['265']?.inputs) {
    workflow['265'].inputs['num_images'] = '1'
    delete workflow['265'].inputs['num_images.image_2']
    delete workflow['265'].inputs['num_images.index_2']
    delete workflow['265'].inputs['num_images.strength_2']
  }
  delete workflow['261']
  delete workflow['264']
}

function removeLoraPlaceholder(workflow: ComfyUIWorkflow) {
  if (workflow['317']?.inputs) {
    workflow['317'].inputs.model = ['298', 0]
  }
  delete workflow['296']
}
