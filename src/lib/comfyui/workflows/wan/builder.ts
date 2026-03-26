import type { ComfyUIWorkflow } from '@/types'
import type { ComfyUIServer } from '../../server-manager'
import type { WanGenerationParams } from '../types'
import { WAN_WORKFLOW_TEMPLATE } from './template'
import { createLogger } from '@/lib/logger'
import { getWanSettings } from '@/lib/database/system-settings'
import { generateSeed, extractBaseImageName } from '../shared'

const log = createLogger('comfyui')

export async function buildWanWorkflow(params: WanGenerationParams, _server?: ComfyUIServer): Promise<ComfyUIWorkflow> {
  const settings = await getWanSettings()
  const workflow = JSON.parse(JSON.stringify(WAN_WORKFLOW_TEMPLATE))

  // Models
  if (workflow['1']?.inputs) {
    workflow['1'].inputs.unet_name = settings.unetHigh
  }
  if (workflow['2']?.inputs) {
    workflow['2'].inputs.unet_name = settings.unetLow
  }
  if (workflow['13']?.inputs) {
    workflow['13'].inputs.clip_name = settings.clip
  }
  if (workflow['26']?.inputs) {
    workflow['26'].inputs.vae_name = settings.vae
  }
  if (workflow['62']?.inputs) {
    workflow['62'].inputs.ckpt_name = settings.vfiCheckpoint
    workflow['62'].inputs.clear_cache_after_n_frames = settings.vfiClearCache
    workflow['62'].inputs.multiplier = settings.vfiMultiplier
  }

  // Prompts
  if (workflow['10']?.inputs) {
    workflow['10'].inputs.text = params.prompt
  }
  if (workflow['41']?.inputs) {
    workflow['41'].inputs.text = settings.negativePrompt
  }

  // ModelSamplingSD3 — shift
  if (workflow['32']?.inputs) {
    workflow['32'].inputs.shift = settings.shift
  }
  if (workflow['33']?.inputs) {
    workflow['33'].inputs.shift = settings.shift
  }

  // Resize
  if (workflow['25']?.inputs) {
    workflow['25'].inputs.megapixels = settings.megapixels
    workflow['25'].inputs.multiple_of = settings.resizeMultipleOf
    workflow['25'].inputs.upscale_method = settings.resizeUpscaleMethod
  }
  if (workflow['18']?.inputs) {
    workflow['18'].inputs.megapixels = settings.megapixels
    workflow['18'].inputs.multiple_of = settings.resizeMultipleOf
    workflow['18'].inputs.upscale_method = settings.resizeUpscaleMethod
  }

  // WanVideoNAG
  if (workflow['20']?.inputs) {
    workflow['20'].inputs.nag_scale = settings.nagScale
    workflow['20'].inputs.nag_alpha = settings.nagAlpha
    workflow['20'].inputs.nag_tau = settings.nagTau
  }
  if (workflow['19']?.inputs) {
    workflow['19'].inputs.nag_scale = settings.nagScale
    workflow['19'].inputs.nag_alpha = settings.nagAlpha
    workflow['19'].inputs.nag_tau = settings.nagTau
  }

  // CustomSplineSigma
  if (workflow['52']?.inputs) {
    workflow['52'].inputs.steps = settings.stepsHigh
    workflow['52'].inputs.start_y = settings.sigmaStartYHigh
    workflow['52'].inputs.end_y = settings.sigmaEndYHigh
    workflow['52'].inputs.curve_data = settings.sigmaCurveData
    workflow['52'].inputs.preset_selector = settings.sigmaPreset
  }
  if (workflow['53']?.inputs) {
    workflow['53'].inputs.steps = settings.stepsLow
    workflow['53'].inputs.start_y = settings.sigmaStartYLow
    workflow['53'].inputs.end_y = settings.sigmaEndYLow
    workflow['53'].inputs.curve_data = settings.sigmaCurveData
    workflow['53'].inputs.preset_selector = settings.sigmaPreset
  }

  // WanFirstLastFrameToVideo — length
  if (workflow['31']?.inputs) {
    workflow['31'].inputs.length = settings.length
  }
  if (workflow['30']?.inputs) {
    workflow['30'].inputs.length = settings.length
  }

  // Sampler
  if (workflow['14']?.inputs) {
    workflow['14'].inputs.sampler_name = settings.sampler
  }

  // RTX Video Super Resolution
  if (workflow['42']?.inputs) {
    workflow['42'].inputs.resize_type = settings.rtxResizeType
    workflow['42'].inputs['resize_type.scale'] = settings.rtxScale
    workflow['42'].inputs.quality = settings.rtxQuality
  }

  // Video Combine
  if (workflow['21']?.inputs) {
    workflow['21'].inputs.frame_rate = settings.frameRate
    workflow['21'].inputs.crf = settings.videoCrf
    workflow['21'].inputs.format = settings.videoFormat
    workflow['21'].inputs.pix_fmt = settings.videoPixFmt
  }

  // Input images
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

  // Seed
  if (workflow['3']?.inputs) {
    workflow['3'].inputs.noise_seed = generateSeed()
  }

  // Filename
  if (workflow['21'] && params.inputImage) {
    workflow['21'].inputs.filename_prefix = `WAN/${extractBaseImageName(params.inputImage)}`
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
  delete workflow['11']
  delete workflow['18']

  if (workflow['30']?.inputs) {
    delete workflow['30'].inputs.end_image
  }
  if (workflow['31']?.inputs) {
    delete workflow['31'].inputs.end_image
  }

  log.info('End image bypass applied — removed end_image from WanFirstLastFrameToVideo')
}
