import type { LtxGenerationParams } from '../types'
import type { ComfyUIWorkflow } from '@/types'
import type { ComfyUIServer } from '../../server-manager'
import { LTX_WORKFLOW_TEMPLATE } from './template'
import { applyLtxLoraChain } from './lora-manager'
import { createLogger } from '@/lib/logger'
import { getLtxSettings } from '@/lib/database/system-settings'

const log = createLogger('comfyui')

export async function buildLtxWorkflow(
  params: LtxGenerationParams,
  server?: ComfyUIServer
): Promise<ComfyUIWorkflow> {
  const settings = await getLtxSettings()
  const workflow = JSON.parse(JSON.stringify(LTX_WORKFLOW_TEMPLATE))

  // Models
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
  if (workflow['63']?.inputs) {
    workflow['63'].inputs.model_name = settings.spatialUpscaler
  }
  if (workflow['297']?.inputs) {
    workflow['297'].inputs.unet_name = settings.unet
    workflow['297'].inputs.weight_dtype = settings.weightDtype
  }

  // Prompts
  if (workflow['5']) {
    workflow['5'].inputs.text = params.prompt
  }
  if (workflow['6']?.inputs) {
    workflow['6'].inputs.text = settings.negativePrompt
  }

  // CFG
  if (workflow['18']?.inputs) {
    workflow['18'].inputs.cfg = settings.cfg
  }

  // Samplers
  if (workflow['20']?.inputs) {
    workflow['20'].inputs.sampler_name = settings.sampler1stPass
  }
  if (workflow['98']?.inputs) {
    workflow['98'].inputs.sampler_name = settings.sampler2ndPass
  }

  // Sigmas
  if (workflow['304']?.inputs) {
    workflow['304'].inputs.sigmas = settings.sigmas1stPass
  }
  if (workflow['303']?.inputs) {
    workflow['303'].inputs.sigmas = settings.sigmas2ndPass
  }

  // Audio normalization
  if (workflow['268']?.inputs) {
    workflow['268'].inputs.audio_normalization_factors = settings.audioNorm1stPass
  }
  if (workflow['306']?.inputs) {
    workflow['306'].inputs.audio_normalization_factors = settings.audioNorm2ndPass
  }

  // NAG
  if (workflow['72']?.inputs) {
    workflow['72'].inputs.nag_scale = settings.nagScale
  }
  if (workflow['307']?.inputs) {
    workflow['307'].inputs.nag_scale = settings.nagScale
  }

  // Duration + Frame Rate
  if (workflow['103']?.inputs) {
    workflow['103'].inputs.value = settings.duration
  }
  if (workflow['11']?.inputs) {
    workflow['11'].inputs.value = settings.frameRate
  }
  if (workflow['12']?.inputs) {
    workflow['12'].inputs.value = settings.frameRate
  }

  // Resize
  if (workflow['86']?.inputs) {
    workflow['86'].inputs.megapixels = settings.megapixels
    workflow['86'].inputs.multiple_of = settings.resizeMultipleOf
    workflow['86'].inputs.upscale_method = settings.resizeUpscaleMethod
  }
  if (workflow['264']?.inputs) {
    workflow['264'].inputs.megapixels = settings.megapixels
    workflow['264'].inputs.multiple_of = settings.resizeMultipleOf
    workflow['264'].inputs.upscale_method = settings.resizeUpscaleMethod
  }

  // Image compression
  if (workflow['266']?.inputs) {
    workflow['266'].inputs.img_compression = settings.imgCompression
  }
  if (workflow['267']?.inputs) {
    workflow['267'].inputs.img_compression = settings.imgCompression
  }

  // VAE Decode
  if (workflow['73']?.inputs) {
    workflow['73'].inputs.spatial_tiles = settings.vaeSpatialTiles
    workflow['73'].inputs.spatial_overlap = settings.vaeSpatialOverlap
    workflow['73'].inputs.temporal_tile_length = settings.vaeTemporalTileLength
    workflow['73'].inputs.temporal_overlap = settings.vaeTemporalOverlap
  }

  // RTX Video Super Resolution
  if (workflow['301']?.inputs) {
    workflow['301'].inputs.resize_type = settings.rtxResizeType
    workflow['301'].inputs['resize_type.scale'] = settings.rtxScale
    workflow['301'].inputs.quality = settings.rtxQuality
  }

  // Input images
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

  // LoRA
  if (settings.loraEnabled && params.loraPreset && params.loraPreset.loraItems?.length > 0) {
    await applyLtxLoraChain(workflow, params.loraPreset, server)
  } else {
    removeLoraPlaceholder(workflow)
  }

  // Seeds
  if (workflow['16']) {
    workflow['16'].inputs.noise_seed = Math.floor(Math.random() * 0xFFFFFFFFFFFF)
  }
  if (workflow['32']) {
    workflow['32'].inputs.noise_seed = Math.floor(Math.random() * 0xFFFFFFFFFFFF)
  }

  // Filename
  if (workflow['300'] && params.inputImage) {
    const baseImageName = params.inputImage.replace(/\.(png|jpg|jpeg|webp)$/i, '')
    workflow['300'].inputs.filename_prefix = `LTX/${baseImageName}`
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

function removeLoraPlaceholder(workflow: ComfyUIWorkflow) {
  if (workflow['268']?.inputs) {
    workflow['268'].inputs.model = ['298', 0]
  }
  if (workflow['306']?.inputs) {
    workflow['306'].inputs.model = ['298', 0]
  }
  delete workflow['296']
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
