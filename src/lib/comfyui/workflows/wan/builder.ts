import type { ComfyUIWorkflow } from '@/types'
import type { ComfyUIServer } from '../../server-manager'
import type { WanGenerationParams } from '../types'
import { WAN_WORKFLOW_TEMPLATE } from './template'
import { WAN } from './nodes'
import { createLogger } from '@/lib/logger'
import { getWanSettings } from '@/lib/database/system-settings'
import { generateSeed, extractBaseImageName, setNode } from '../shared'
import { applyLoraPreset, removeLoraPlaceholder } from './lora-manager'

const log = createLogger('comfyui')

export async function buildWanWorkflow(params: WanGenerationParams, _server?: ComfyUIServer): Promise<ComfyUIWorkflow> {
  const settings = await getWanSettings()
  const workflow = JSON.parse(JSON.stringify(WAN_WORKFLOW_TEMPLATE))

  setNode(workflow, WAN.UNET_HIGH, { unet_name: settings.unetHigh })
  setNode(workflow, WAN.UNET_LOW, { unet_name: settings.unetLow })
  setNode(workflow, WAN.CLIP, { clip_name: settings.clip })
  setNode(workflow, WAN.VAE, { vae_name: settings.vae })
  setNode(workflow, WAN.VFI, {
    ckpt_name: settings.vfiCheckpoint,
    clear_cache_after_n_frames: settings.vfiClearCache,
    multiplier: settings.vfiMultiplier,
  })

  setNode(workflow, WAN.POSITIVE_PROMPT, { text: params.prompt })
  setNode(workflow, WAN.NEGATIVE_PROMPT, { text: settings.negativePrompt })

  setNode(workflow, WAN.MODEL_SAMPLING_HIGH, { shift: settings.shift })
  setNode(workflow, WAN.MODEL_SAMPLING_LOW_SHIFT, { shift: settings.shift })

  const resizeParams = {
    megapixels: settings.megapixels,
    multiple_of: settings.resizeMultipleOf,
    upscale_method: settings.resizeUpscaleMethod,
  }
  setNode(workflow, WAN.RESIZE_START_IMAGE, resizeParams)
  setNode(workflow, WAN.RESIZE_END_IMAGE, resizeParams)

  const nagParams = {
    nag_scale: settings.nagScale,
    nag_alpha: settings.nagAlpha,
    nag_tau: settings.nagTau,
  }
  setNode(workflow, WAN.NAG_HIGH, nagParams)
  setNode(workflow, WAN.NAG_LOW, nagParams)

  setNode(workflow, WAN.SIGMA_HIGH, {
    steps: settings.stepsHigh,
    start_y: settings.sigmaStartYHigh,
    end_y: settings.sigmaEndYHigh,
    curve_data: settings.sigmaCurveData,
    preset_selector: settings.sigmaPreset,
  })
  setNode(workflow, WAN.SIGMA_LOW, {
    steps: settings.stepsLow,
    start_y: settings.sigmaStartYLow,
    end_y: settings.sigmaEndYLow,
    curve_data: settings.sigmaCurveData,
    preset_selector: settings.sigmaPreset,
  })

  setNode(workflow, WAN.FIRST_LAST_FRAME_HIGH, { length: settings.length })
  setNode(workflow, WAN.FIRST_LAST_FRAME_LOW, { length: settings.length })

  setNode(workflow, WAN.SAMPLER, { sampler_name: settings.sampler })

  setNode(workflow, WAN.RTX_SUPER_RES, {
    resize_type: settings.rtxResizeType,
    'resize_type.scale': settings.rtxScale,
    quality: settings.rtxQuality,
  })

  setNode(workflow, WAN.VIDEO_COMBINE, {
    frame_rate: settings.frameRate,
    crf: settings.videoCrf,
    format: settings.videoFormat,
    pix_fmt: settings.videoPixFmt,
  })

  setNode(workflow, WAN.LOAD_IMAGE_START, { image: params.inputImage })

  if (params.endImage) {
    setNode(workflow, WAN.LOAD_IMAGE_END, { image: params.endImage })
  } else {
    handleEndImageBypass(workflow)
  }

  setNode(workflow, WAN.NOISE_SEED, { noise_seed: generateSeed() })

  if (workflow[WAN.VIDEO_COMBINE] && params.inputImage) {
    setNode(workflow, WAN.VIDEO_COMBINE, {
      filename_prefix: `WAN/${extractBaseImageName(params.inputImage)}`,
    })
  }

  if (settings.loraEnabled && params.loraPreset && params.loraPreset.loraItems?.length > 0) {
    await applyLoraPreset(workflow, params.loraPreset, _server)
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
  delete workflow[WAN.LOAD_IMAGE_END]
  delete workflow[WAN.RESIZE_END_IMAGE]

  const frameLow = workflow[WAN.FIRST_LAST_FRAME_LOW]
  if (frameLow?.inputs) {
    delete frameLow.inputs.end_image
  }
  const frameHigh = workflow[WAN.FIRST_LAST_FRAME_HIGH]
  if (frameHigh?.inputs) {
    delete frameHigh.inputs.end_image
  }

  log.info('End image bypass applied — removed end_image from WanFirstLastFrameToVideo')
}
