import type { LtxWanGenerationParams } from '../types'
import type { ComfyUIWorkflow } from '@/types'
import type { ComfyUIServer } from '../../server-manager'
import type { LtxWanSettings } from '@/lib/database/system-settings'
import { LTX_WAN_WORKFLOW_TEMPLATE } from './template'
import { LTX_WAN } from './nodes'
import { createLogger } from '@/lib/logger'
import { getLtxWanSettings } from '@/lib/database/system-settings'
import { generateSeed, extractBaseImageName, setNode, dumpWorkflow } from '../shared'

const log = createLogger('comfyui')

export async function buildLtxWanWorkflow(
  params: LtxWanGenerationParams,
  _server?: ComfyUIServer
): Promise<ComfyUIWorkflow> {
  const settings = await getLtxWanSettings()
  const workflow: ComfyUIWorkflow = JSON.parse(JSON.stringify(LTX_WAN_WORKFLOW_TEMPLATE))

  configureLtxModels(workflow, settings)
  configureLtxGeneration(workflow, params, settings)
  configureLtxScheduler(workflow, settings)
  configureLtxNag(workflow, settings)
  configureAudioNorm(workflow, settings)

  if (settings.distilledLoraEnabled) {
    applyDistilledLora(workflow, settings)
  }

  if (params.referenceAudio) {
    handleReferenceAudio(workflow, params.referenceAudio, settings)
  }

  if (params.endImage) {
    handleEndImage(workflow, params.endImage, settings)
  } else {
    handleEndImageBypass(workflow)
  }

  configureWanModels(workflow, settings)
  configureWanGeneration(workflow, params, settings)
  configureWanScheduler(workflow, settings)

  configurePostProcessing(workflow, settings)
  configureOutput(workflow, params, settings)

  setNode(workflow, LTX_WAN.NOISE_SEED_LTX, { noise_seed: generateSeed() })
  setNode(workflow, LTX_WAN.CLOWN_SAMPLER_LTX, { seed: generateSeed() })
  setNode(workflow, LTX_WAN.NOISE_SEED_WAN, { noise_seed: generateSeed() })
  setNode(workflow, LTX_WAN.CLOWN_SAMPLER_WAN, { seed: generateSeed() })

  log.info('LTX-WAN workflow built', {
    prompt: params.prompt.substring(0, 50),
    hasEndImage: !!params.endImage,
    hasReferenceAudio: !!params.referenceAudio,
    videoDuration: params.videoDuration,
    audioNormEnabled: settings.audioNormEnabled,
    vfiEnabled: settings.vfiEnabled,
    rtxEnabled: settings.rtxEnabled,
  })

  dumpWorkflow('ltx-wan', workflow)
  return workflow
}

function configureLtxModels(workflow: ComfyUIWorkflow, settings: LtxWanSettings) {
  setNode(workflow, LTX_WAN.UNET, {
    unet_name: settings.unet,
    weight_dtype: settings.weightDtype,
  })
  setNode(workflow, LTX_WAN.CLIP, {
    clip_name1: settings.clipGguf,
    clip_name2: settings.clipEmbeddings,
  })
  setNode(workflow, LTX_WAN.VIDEO_VAE, { vae_name: settings.videoVae })
  setNode(workflow, LTX_WAN.AUDIO_VAE, { vae_name: settings.audioVae })
}

function configureLtxGeneration(
  workflow: ComfyUIWorkflow,
  params: LtxWanGenerationParams,
  settings: LtxWanSettings
) {
  setNode(workflow, LTX_WAN.POSITIVE_PROMPT, { text: params.prompt })
  setNode(workflow, LTX_WAN.NEGATIVE_PROMPT_LTX, { text: settings.negativePromptLtx })
  setNode(workflow, LTX_WAN.CLOWN_SAMPLER_LTX, {
    sampler_name: settings.sampler,
    eta: settings.clownEta,
    bongmath: settings.clownBongmath,
  })
  setNode(workflow, LTX_WAN.PREPROCESS_START, { img_compression: settings.imgCompression })
  setNode(workflow, LTX_WAN.DURATION, { value: params.videoDuration })
  setNode(workflow, LTX_WAN.FRAME_RATE, { number: Math.round(settings.frameRate) })
  setNode(workflow, LTX_WAN.RESIZE_START, {
    megapixels: settings.megapixels,
    multiple_of: settings.resizeMultipleOf,
    upscale_method: settings.resizeUpscaleMethod,
  })
  setNode(workflow, LTX_WAN.LOAD_IMAGE_START, { image: params.inputImage })
  setNode(workflow, LTX_WAN.CFG_GUIDER, { cfg: 1 })
}

function configureLtxScheduler(workflow: ComfyUIWorkflow, settings: LtxWanSettings) {
  setNode(workflow, LTX_WAN.SCHEDULER, {
    steps: settings.schedulerSteps,
    max_shift: settings.schedulerMaxShift,
    base_shift: settings.schedulerBaseShift,
    stretch: settings.schedulerStretch,
    terminal: settings.schedulerTerminal,
  })
}

function configureLtxNag(workflow: ComfyUIWorkflow, settings: LtxWanSettings) {
  setNode(workflow, LTX_WAN.NAG_LTX, {
    nag_scale: settings.nagScale,
    nag_alpha: settings.nagAlpha,
    nag_tau: settings.nagTau,
  })
}

function configureAudioNorm(workflow: ComfyUIWorkflow, settings: LtxWanSettings) {
  if (settings.audioNormEnabled) {
    setNode(workflow, LTX_WAN.AUDIO_NORM, { audio_normalization_factors: settings.audioNorm })
  } else {
    delete workflow[LTX_WAN.AUDIO_NORM]
    setNode(workflow, LTX_WAN.CFG_GUIDER, { model: [LTX_WAN.NAG_LTX, 0] })
  }
}

function applyDistilledLora(workflow: ComfyUIWorkflow, settings: LtxWanSettings) {
  const node = workflow[LTX_WAN.POWER_LORA]
  if (!node?.inputs) return
  node.inputs['lora_3'] = {
    on: true,
    lora: settings.distilledLoraName,
    strength: settings.distilledLoraStrength,
  }
}

function handleReferenceAudio(
  workflow: ComfyUIWorkflow,
  audioFile: string,
  settings: LtxWanSettings
) {
  workflow[LTX_WAN.LOAD_AUDIO] = {
    inputs: { audio: audioFile },
    class_type: 'LoadAudio',
    _meta: { title: 'LTX_WAN_14' },
  }

  workflow[LTX_WAN.REFERENCE_AUDIO] = {
    inputs: {
      identity_guidance_scale: settings.identityGuidanceScale,
      start_percent: settings.identityStartPercent,
      end_percent: settings.identityEndPercent,
      model: [LTX_WAN.POWER_LORA, 0],
      positive: [LTX_WAN.FORCE_UNLOAD_CONDITIONING, 0],
      negative: [LTX_WAN.CONDITIONING, 1],
      reference_audio: [LTX_WAN.LOAD_AUDIO, 0],
      audio_vae: [LTX_WAN.AUDIO_VAE, 0],
    },
    class_type: 'LTXVReferenceAudio',
    _meta: { title: 'LTX_WAN_28' },
  }

  const loraNode = workflow[LTX_WAN.POWER_LORA]
  if (loraNode?.inputs) {
    loraNode.inputs['lora_2'] = { on: true, lora: settings.idLoraName, strength: settings.idLoraStrength }
  }

  setNode(workflow, LTX_WAN.NAG_LTX, {
    model: [LTX_WAN.REFERENCE_AUDIO, 0],
    nag_cond_video: [LTX_WAN.REFERENCE_AUDIO, 2],
    nag_cond_audio: [LTX_WAN.REFERENCE_AUDIO, 2],
  })
  setNode(workflow, LTX_WAN.CFG_GUIDER, {
    positive: [LTX_WAN.REFERENCE_AUDIO, 1],
    negative: [LTX_WAN.REFERENCE_AUDIO, 2],
  })
}

function handleEndImage(
  workflow: ComfyUIWorkflow,
  endImage: string,
  settings: LtxWanSettings
) {
  setNode(workflow, LTX_WAN.LOAD_IMAGE_END, { image: endImage })
  setNode(workflow, LTX_WAN.RESIZE_END, {
    megapixels: settings.megapixels,
    multiple_of: settings.resizeMultipleOf,
    upscale_method: settings.resizeUpscaleMethod,
  })
  setNode(workflow, LTX_WAN.PREPROCESS_END, { img_compression: settings.imgCompression })
}

function handleEndImageBypass(workflow: ComfyUIWorkflow) {
  const node = workflow[LTX_WAN.IMG_TO_VIDEO]
  if (node?.inputs) {
    node.inputs['num_images'] = '1'
    delete node.inputs['num_images.image_2']
    delete node.inputs['num_images.index_2']
    delete node.inputs['num_images.strength_2']
  }
  delete workflow[LTX_WAN.LOAD_IMAGE_END]
  delete workflow[LTX_WAN.RESIZE_END]
  delete workflow[LTX_WAN.PREPROCESS_END]
}

function configureWanModels(workflow: ComfyUIWorkflow, settings: LtxWanSettings) {
  setNode(workflow, LTX_WAN.UNET_WAN, { unet_name: settings.unetWan, weight_dtype: 'default' })
  setNode(workflow, LTX_WAN.CLIP_WAN, { clip_name: settings.clipWan })
  setNode(workflow, LTX_WAN.VAE_WAN, { vae_name: settings.vaeWan })
  setNode(workflow, LTX_WAN.MODEL_SAMPLING, { shift: settings.shift })
}

function configureWanGeneration(
  workflow: ComfyUIWorkflow,
  params: LtxWanGenerationParams,
  settings: LtxWanSettings
) {
  setNode(workflow, LTX_WAN.NEGATIVE_PROMPT_WAN, { text: settings.negativePromptWan })
  setNode(workflow, LTX_WAN.CLOWN_SAMPLER_WAN, {
    sampler_name: settings.samplerWan,
    eta: settings.clownEtaWan,
    bongmath: settings.clownBongmathWan,
  })
  setNode(workflow, LTX_WAN.NAG_WAN, {
    nag_scale: settings.nagScaleWan,
    nag_alpha: settings.nagAlphaWan,
    nag_tau: settings.nagTauWan,
  })
}

function configureWanScheduler(workflow: ComfyUIWorkflow, settings: LtxWanSettings) {
  setNode(workflow, LTX_WAN.BASIC_SCHEDULER, {
    scheduler: settings.schedulerWan,
    steps: settings.stepsWan,
    denoise: settings.denoiseWan,
  })
  setNode(workflow, LTX_WAN.SIGMAS_RESCALE, {
    start: settings.sigmasRescaleStart,
    end: settings.sigmasRescaleEnd,
  })
}

function configurePostProcessing(workflow: ComfyUIWorkflow, settings: LtxWanSettings) {
  let lastOutput: string = LTX_WAN.VAE_DECODE_WAN

  if (settings.vfiEnabled) {
    setNode(workflow, LTX_WAN.VFI_MULTIPLIER, { value: settings.vfiMultiplier })

    setNode(workflow, LTX_WAN.VFI, {
      clear_cache_after_n_frames: settings.vfiClearCache,
      frames: [lastOutput, 0],
    })
    setNode(workflow, LTX_WAN.RIFE_MODEL_LOADER, {
      model: settings.rifeModel,
      precision: settings.rifePrecision,
      resolution_profile: settings.rifeResolutionProfile,
    })
    if (settings.rifeResolutionProfile === 'custom') {
      setNode(workflow, LTX_WAN.RIFE_CUSTOM_CONFIG, {
        min_dim: settings.rifeCustomMinDim,
        opt_dim: settings.rifeCustomOptDim,
        max_dim: settings.rifeCustomMaxDim,
      })
      setNode(workflow, LTX_WAN.RIFE_MODEL_LOADER, {
        custom_config: [LTX_WAN.RIFE_CUSTOM_CONFIG, 0],
      })
    } else {
      delete workflow[LTX_WAN.RIFE_CUSTOM_CONFIG]
    }
    lastOutput = LTX_WAN.VFI
  } else {
    delete workflow[LTX_WAN.VFI]
    delete workflow[LTX_WAN.RIFE_MODEL_LOADER]
    delete workflow[LTX_WAN.RIFE_CUSTOM_CONFIG]
    delete workflow[LTX_WAN.VFI_MULTIPLIER]
    delete workflow[LTX_WAN.VFI_FRAME_RATE]
  }

  if (settings.rtxEnabled) {
    setNode(workflow, LTX_WAN.RTX_SUPER_RES, {
      resize_type: settings.rtxResizeType,
      'resize_type.scale': settings.rtxScale,
      quality: settings.rtxQuality,
      images: [lastOutput, 0],
    })
    lastOutput = LTX_WAN.RTX_SUPER_RES
  } else {
    delete workflow[LTX_WAN.RTX_SUPER_RES]
  }

  setNode(workflow, LTX_WAN.VIDEO_OUTPUT, { images: [lastOutput, 0] })

  if (settings.vfiEnabled) {
    setNode(workflow, LTX_WAN.VIDEO_OUTPUT, { frame_rate: [LTX_WAN.VFI_FRAME_RATE, 1] })
  } else {
    setNode(workflow, LTX_WAN.VIDEO_OUTPUT, { frame_rate: [LTX_WAN.FRAME_RATE, 2] })
  }
}

function configureOutput(
  workflow: ComfyUIWorkflow,
  params: LtxWanGenerationParams,
  settings: LtxWanSettings
) {
  setNode(workflow, LTX_WAN.VIDEO_OUTPUT, {
    crf: settings.videoCrf,
    format: settings.videoFormat,
    pix_fmt: settings.videoPixFmt,
    save_output: false,
  })

  if (params.inputImage) {
    setNode(workflow, LTX_WAN.VIDEO_OUTPUT, {
      filename_prefix: `LTX-WAN/${extractBaseImageName(params.inputImage)}`,
    })
  }
}
