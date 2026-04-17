import type { LtxGenerationParams } from '../types'
import type { ComfyUIWorkflow } from '@/types'
import type { LtxSettings } from '@/lib/database/system-settings'
import { LTX_WORKFLOW_TEMPLATE } from './template'
import { LTX } from './nodes'
import { createLogger } from '@/lib/logger'
import { getLtxSettings } from '@/lib/database/system-settings'
import { generateSeed, extractBaseImageName, setNode, dumpWorkflow } from '../shared'

const log = createLogger('comfyui')

export async function buildLtxWorkflow(params: LtxGenerationParams): Promise<ComfyUIWorkflow> {
  const settings = await getLtxSettings()
  const workflow: ComfyUIWorkflow = JSON.parse(JSON.stringify(LTX_WORKFLOW_TEMPLATE))

  configureModels(workflow, settings)
  configureGeneration(workflow, params, settings)
  configureScheduler(workflow, settings)
  configureNag(workflow, settings)
  applyLtxLoras(workflow, settings)

  if (params.referenceAudio) {
    handleReferenceAudio(workflow, params.referenceAudio, settings)
  }

  if (params.endImage) {
    handleEndImage(workflow, params.endImage, settings)
  } else {
    handleEndImageBypass(workflow)
  }

  configurePostProcessing(workflow, settings)
  configureOutput(workflow, params, settings)

  setNode(workflow, LTX.NOISE_SEED, { noise_seed: generateSeed() })

  log.info('LTX workflow built', {
    prompt: params.prompt.substring(0, 50),
    hasEndImage: !!params.endImage,
    videoDuration: params.videoDuration,
    distilledLoraEnabled: settings.distilledLoraEnabled,
    hasReferenceAudio: !!params.referenceAudio,
  })

  dumpWorkflow('ltx', workflow)
  return workflow
}

function configureModels(workflow: ComfyUIWorkflow, settings: LtxSettings) {
  setNode(workflow, LTX.AUDIO_VAE, { vae_name: settings.audioVae })
  setNode(workflow, LTX.VIDEO_VAE, { vae_name: settings.videoVae })
  setNode(workflow, LTX.CLIP, { clip_name1: settings.clipGguf, clip_name2: settings.clipEmbeddings })
  setNode(workflow, LTX.UNET, { unet_name: settings.unet, weight_dtype: settings.weightDtype })
}

function configureGeneration(workflow: ComfyUIWorkflow, params: LtxGenerationParams, settings: LtxSettings) {
  setNode(workflow, LTX.POSITIVE_PROMPT, { text: params.prompt })
  setNode(workflow, LTX.NEGATIVE_PROMPT, { text: settings.negativePrompt })
  setNode(workflow, LTX.CLOWN_SAMPLER, {
    sampler_name: settings.sampler,
    eta: settings.clownEta,
    seed: generateSeed(),
    bongmath: settings.clownBongmath,
  })
  setNode(workflow, LTX.PREPROCESS_START, { img_compression: settings.imgCompression })
  setNode(workflow, LTX.DURATION, { value: params.videoDuration })
  setNode(workflow, LTX.FRAME_RATE, { number: Math.round(settings.frameRate) })
  setNode(workflow, LTX.MULTIPLIER, { value: 1 })
  setNode(workflow, LTX.RESIZE_START_IMAGE, {
    megapixels: settings.megapixels,
    multiple_of: settings.resizeMultipleOf,
    upscale_method: settings.resizeUpscaleMethod,
  })
}

function configureScheduler(workflow: ComfyUIWorkflow, settings: LtxSettings) {
  setNode(workflow, LTX.SCHEDULER, {
    steps: settings.schedulerSteps,
    max_shift: settings.schedulerMaxShift,
    base_shift: settings.schedulerBaseShift,
    stretch: settings.schedulerStretch,
    terminal: settings.schedulerTerminal,
  })
}

function configureNag(workflow: ComfyUIWorkflow, settings: LtxSettings) {
  setNode(workflow, LTX.NAG, {
    nag_scale: settings.nagScale,
    nag_alpha: settings.nagAlpha,
    nag_tau: settings.nagTau,
  })
}

function applyLtxLoras(workflow: ComfyUIWorkflow, settings: LtxSettings) {
  const node = workflow[LTX.POWER_LORA]
  if (!node?.inputs) return
  node.inputs['lora_1'] = settings.distilledLoraEnabled
    ? { on: true, lora: settings.distilledLoraName, strength: settings.distilledLoraStrength }
    : { on: false, lora: '', strength: 0 }
  node.inputs['lora_2'] = { on: false, lora: '', strength: 0 }
  node.inputs['lora_3'] = { on: false, lora: '', strength: 0 }
  node.inputs['lora_4'] = { on: false, lora: '', strength: 0 }
}

function handleReferenceAudio(workflow: ComfyUIWorkflow, audioFile: string, settings: LtxSettings) {
  workflow[LTX.LOAD_AUDIO] = {
    inputs: { audio: audioFile },
    class_type: 'LoadAudio',
    _meta: { title: 'LTX_350' },
  }

  workflow[LTX.REFERENCE_AUDIO] = {
    inputs: {
      identity_guidance_scale: settings.identityGuidanceScale,
      start_percent: settings.identityStartPercent,
      end_percent: settings.identityEndPercent,
      model: [LTX.POWER_LORA, 0],
      positive: [LTX.VRAM_POST_CONDITIONING, 0],
      negative: [LTX.CONDITIONING, 1],
      reference_audio: [LTX.LOAD_AUDIO, 0],
      audio_vae: [LTX.AUDIO_VAE, 0],
    },
    class_type: 'LTXVReferenceAudio',
    _meta: { title: 'LTX_348' },
  }

  const lora = workflow[LTX.POWER_LORA]
  if (lora?.inputs) {
    lora.inputs['lora_2'] = { on: true, lora: settings.idLoraName, strength: settings.idLoraStrength }
  }

  setNode(workflow, LTX.NAG, { model: [LTX.REFERENCE_AUDIO, 0] })
  setNode(workflow, LTX.CFG_GUIDER, {
    positive: [LTX.REFERENCE_AUDIO, 1],
    negative: [LTX.REFERENCE_AUDIO, 2],
  })

  if (settings.audioNormEnabled) {
    workflow[LTX.AUDIO_NORM] = {
      inputs: {
        audio_normalization_factors: settings.audioNorm,
        model: [LTX.NAG, 0],
      },
      class_type: 'LTX2AudioLatentNormalizingSampling',
      _meta: { title: 'LTX_467' },
    }
    setNode(workflow, LTX.CFG_GUIDER, { model: [LTX.AUDIO_NORM, 0] })
  }
}

function handleEndImage(
  workflow: ComfyUIWorkflow,
  endImage: string,
  settings: LtxSettings
) {
  workflow[LTX.LOAD_IMAGE_END] = {
    inputs: { image: endImage },
    class_type: 'LoadImage',
    _meta: { title: 'LTX_260' },
  }
  workflow[LTX.END_FRAME_MATH] = {
    inputs: { expression: 'a - 1', a: [LTX.FRAME_COUNT_MATH, 0] },
    class_type: 'MathExpression|pysssss',
    _meta: { title: 'LTX_261' },
  }
  workflow[LTX.RESIZE_END_IMAGE] = {
    inputs: {
      megapixels: settings.megapixels,
      multiple_of: settings.resizeMultipleOf,
      upscale_method: settings.resizeUpscaleMethod,
      image: [LTX.LOAD_IMAGE_END, 0],
    },
    class_type: 'ResizeImageToMegapixels',
    _meta: { title: 'LTX_264' },
  }
  workflow[LTX.PREPROCESS_END] = {
    inputs: { img_compression: settings.imgCompression, image: [LTX.RESIZE_END_IMAGE, 0] },
    class_type: 'LTXVPreprocess',
    _meta: { title: 'LTX_469' },
  }
}

function handleEndImageBypass(workflow: ComfyUIWorkflow) {
  const imgToVideo = workflow[LTX.IMG_TO_VIDEO]
  if (imgToVideo?.inputs) {
    imgToVideo.inputs['num_images'] = '1'
    delete imgToVideo.inputs['num_images.image_2']
    delete imgToVideo.inputs['num_images.index_2']
    delete imgToVideo.inputs['num_images.strength_2']
  }
  delete workflow[LTX.LOAD_IMAGE_END]
  delete workflow[LTX.END_FRAME_MATH]
  delete workflow[LTX.RESIZE_END_IMAGE]
  delete workflow[LTX.PREPROCESS_END]
}

function configurePostProcessing(workflow: ComfyUIWorkflow, settings: LtxSettings) {
  if (settings.rtxEnabled) {
    setNode(workflow, LTX.RTX_SUPER_RES, {
      resize_type: settings.rtxResizeType,
      'resize_type.scale': settings.rtxScale,
      quality: settings.rtxQuality,
    })
    return
  }
  delete workflow[LTX.RTX_SUPER_RES]
  setNode(workflow, LTX.VIDEO_COMBINE, { images: [LTX.VRAM_POST_VAE_DECODE, 0] })
}

function configureOutput(workflow: ComfyUIWorkflow, params: LtxGenerationParams, settings: LtxSettings) {
  setNode(workflow, LTX.VIDEO_COMBINE, {
    crf: settings.videoCrf,
    format: settings.videoFormat,
    pix_fmt: settings.videoPixFmt,
  })
  setNode(workflow, LTX.LOAD_IMAGE_START, { image: params.inputImage })

  if (workflow[LTX.VIDEO_COMBINE] && params.inputImage) {
    setNode(workflow, LTX.VIDEO_COMBINE, {
      filename_prefix: `LTX/${extractBaseImageName(params.inputImage)}`,
    })
  }
}
