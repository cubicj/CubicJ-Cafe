import type { LtxGenerationParams } from '../types'
import type { ComfyUIWorkflow } from '@/types'
import type { LtxSettings } from '@/lib/database/system-settings'
import { LTX_WORKFLOW_TEMPLATE } from './template'
import { LTX } from './nodes'
import { createLogger } from '@/lib/logger'
import { getLtxSettings } from '@/lib/database/system-settings'
import { generateSeed, extractBaseImageName, setNode, dumpWorkflow } from '../shared'

const log = createLogger('comfyui')
type NodeOutput = [string, number]

const END_IMAGE = {
  LOAD_IMAGE: '260',
  FRAME_INDEX: '261',
  RESIZE: '264',
} as const

export async function buildLtxWorkflow(params: LtxGenerationParams): Promise<ComfyUIWorkflow> {
  const settings = await getLtxSettings()
  const workflow: ComfyUIWorkflow = JSON.parse(JSON.stringify(LTX_WORKFLOW_TEMPLATE))

  configureModels(workflow, settings)
  configurePrompts(workflow, params, settings)
  configureGeneration(workflow, params, settings)
  configureScheduler(workflow, settings)
  configureNag(workflow, settings)
  configureGuide(workflow, settings)
  configureAnchor(workflow, settings)
  configureScheduledCfg(workflow, settings)
  const generalModelOutput = configureLoras(workflow, settings)
  const modelOutput = configureIdLora(workflow, settings, generalModelOutput, !!params.referenceAudio)

  if (params.referenceAudio) {
    handleReferenceAudio(workflow, params.referenceAudio, settings, modelOutput)
  } else {
    handleReferenceAudioBypass(workflow, modelOutput)
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
    hasReferenceAudio: !!params.referenceAudio,
  })

  dumpWorkflow('ltx', workflow)
  return workflow
}

function configureModels(workflow: ComfyUIWorkflow, settings: LtxSettings) {
  setNode(workflow, LTX.CHECKPOINT, { ckpt_name: settings.checkpoint })
  setNode(workflow, LTX.AUDIO_VAE, { ckpt_name: settings.checkpoint })
  setNode(workflow, LTX.TEXT_ENCODER, {
    text_encoder: settings.textEncoder,
    ckpt_name: settings.checkpoint,
  })
}

function configurePrompts(
  workflow: ComfyUIWorkflow,
  params: LtxGenerationParams,
  settings: LtxSettings
) {
  setNode(workflow, LTX.POSITIVE_PROMPT, { text: params.prompt })
  setNode(workflow, LTX.NEGATIVE_PROMPT, { text: settings.negativePrompt })
  setNode(workflow, LTX.VIDEO_CONDITIONING_PROMPT, { text: settings.videoConditioningPrompt })
  setNode(workflow, LTX.AUDIO_CONDITIONING_PROMPT, { text: settings.audioConditioningPrompt })
}

function configureGeneration(
  workflow: ComfyUIWorkflow,
  params: LtxGenerationParams,
  settings: LtxSettings
) {
  setNode(workflow, LTX.CLOWN_SAMPLER, {
    sampler_name: settings.sampler,
    eta: settings.clownEta,
    seed: generateSeed(),
    bongmath: settings.clownBongmath,
  })
  setNode(workflow, LTX.DURATION, { value: params.videoDuration })
  setNode(workflow, LTX.FRAME_BASE, { value: settings.frameBase })
  setNode(workflow, LTX.FRAME_RATE, { number: Math.round(settings.frameRate) })
  setNode(workflow, LTX.RESIZE_START_IMAGE, {
    megapixels: settings.megapixels,
    multiple_of: settings.resizeMultipleOf,
    upscale_method: settings.resizeUpscaleMethod,
  })
  setNode(workflow, LTX.LOAD_IMAGE_START, { image: params.inputImage })
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

function configureGuide(workflow: ComfyUIWorkflow, settings: LtxSettings) {
  setNode(workflow, LTX.ADD_GUIDE, {
    frame_idx: settings.guideFrameIndex,
    strength: settings.guideStrength,
    crf: settings.guideCrf,
    blur_radius: settings.guideBlurRadius,
    interpolation: settings.guideInterpolation,
    crop: settings.guideCrop,
  })
}

function configureAnchor(workflow: ComfyUIWorkflow, settings: LtxSettings) {
  setNode(workflow, LTX.ANCHOR, {
    strength: settings.anchorStrength,
    cache_at_step: settings.anchorCacheAtStep,
    similarity_threshold: settings.anchorSimilarityThreshold,
    decay_with_distance: settings.anchorDecayWithDistance,
    energy_threshold: settings.anchorEnergyThreshold,
    bypass: settings.anchorBypass,
    debug: settings.anchorDebug,
    advanced_mode: settings.anchorAdvancedMode,
    cache_mode: settings.anchorCacheMode,
    forwards_per_step: settings.anchorForwardsPerStep,
    cache_warmup: settings.anchorCacheWarmup,
    anchor_frame: settings.anchorFrame,
    depth_curve: settings.anchorDepthCurve,
    block_index_filter: settings.anchorBlockIndexFilter,
  })
}

function configureScheduledCfg(workflow: ComfyUIWorkflow, settings: LtxSettings) {
  setNode(workflow, LTX.SCHEDULED_CFG, {
    cfg: settings.scheduledCfg,
    start_percent: settings.scheduledCfgStartPercent,
    end_percent: settings.scheduledCfgEndPercent,
  })
}

function configureLoras(workflow: ComfyUIWorkflow, settings: LtxSettings): NodeOutput {
  const chain = [
    { node: LTX.LORA_3, slot: settings.loras[2] },
    { node: LTX.LORA_2, slot: settings.loras[1] },
    { node: LTX.LORA_4, slot: settings.loras[3] },
    { node: LTX.LORA_1, slot: settings.loras[0] },
  ] as const
  let model: NodeOutput = [LTX.SAGE_ATTN_PATCH, 0]

  for (const { node, slot } of chain) {
    if (!slot.enabled) {
      delete workflow[node]
      continue
    }

    setNode(workflow, node, {
      lora_name: slot.name,
      strength_model: slot.strength,
      video: slot.video,
      video_to_audio: slot.videoToAudio,
      audio: slot.audio,
      audio_to_video: slot.audioToVideo,
      other: slot.other,
      model,
    })
    model = [node, 0]
  }

  return model
}

function configureIdLora(
  workflow: ComfyUIWorkflow,
  settings: LtxSettings,
  modelOutput: NodeOutput,
  hasReferenceAudio: boolean
): NodeOutput {
  const slot = settings.idLora
  if (!hasReferenceAudio || !slot.enabled || slot.name === 'CONFIGURE_IN_ADMIN') {
    delete workflow[LTX.ID_LORA]
    return modelOutput
  }

  workflow[LTX.ID_LORA] = {
    inputs: {
      lora_name: slot.name,
      strength_model: slot.strength,
      video: slot.video,
      video_to_audio: slot.videoToAudio,
      audio: slot.audio,
      audio_to_video: slot.audioToVideo,
      other: slot.other,
      model: modelOutput,
    },
    class_type: 'LTX2LoraLoaderAdvanced',
    _meta: { title: 'ID LoRA' },
  }

  return [LTX.ID_LORA, 0]
}

function handleReferenceAudio(
  workflow: ComfyUIWorkflow,
  audioFile: string,
  settings: LtxSettings,
  modelOutput: NodeOutput
) {
  setNode(workflow, LTX.LOAD_AUDIO, { audio: audioFile })
  setNode(workflow, LTX.REFERENCE_AUDIO, {
    identity_guidance_scale: settings.identityGuidanceScale,
    start_percent: settings.identityStartPercent,
    end_percent: settings.identityEndPercent,
    model: modelOutput,
    positive: [LTX.VRAM_POST_CONDITIONING, 0],
    negative: [LTX.CONDITIONING, 1],
  })
  setNode(workflow, LTX.NAG, { model: [LTX.REFERENCE_AUDIO, 0] })
  setNode(workflow, LTX.ADD_GUIDE, {
    positive: [LTX.REFERENCE_AUDIO, 1],
    negative: [LTX.REFERENCE_AUDIO, 2],
  })
}

function handleReferenceAudioBypass(workflow: ComfyUIWorkflow, modelOutput: NodeOutput) {
  delete workflow[LTX.LOAD_AUDIO]
  delete workflow[LTX.REFERENCE_AUDIO]
  setNode(workflow, LTX.NAG, { model: modelOutput })
  setNode(workflow, LTX.ADD_GUIDE, {
    positive: [LTX.VRAM_POST_CONDITIONING, 0],
    negative: [LTX.CONDITIONING, 1],
  })
}

function handleEndImage(
  workflow: ComfyUIWorkflow,
  endImage: string,
  settings: LtxSettings
) {
  workflow[END_IMAGE.LOAD_IMAGE] = {
    inputs: { image: endImage },
    class_type: 'LoadImage',
    _meta: { title: 'End Image' },
  }
  workflow[END_IMAGE.FRAME_INDEX] = {
    inputs: { expression: 'a - 1', a: [LTX.FRAME_COUNT_MATH, 0] },
    class_type: 'MathExpression|pysssss',
    _meta: { title: 'End Frame Index' },
  }
  workflow[END_IMAGE.RESIZE] = {
    inputs: {
      megapixels: settings.megapixels,
      multiple_of: settings.resizeMultipleOf,
      upscale_method: settings.resizeUpscaleMethod,
      image: [END_IMAGE.LOAD_IMAGE, 0],
    },
    class_type: 'ResizeImageToMegapixels',
    _meta: { title: 'Resize End Image' },
  }
  setNode(workflow, LTX.IMG_TO_VIDEO, {
    num_images: '2',
    'num_images.image_2': [END_IMAGE.RESIZE, 0],
    'num_images.index_2': [END_IMAGE.FRAME_INDEX, 0],
    'num_images.strength_2': 1,
  })
}

function handleEndImageBypass(workflow: ComfyUIWorkflow) {
  const imgToVideo = workflow[LTX.IMG_TO_VIDEO]
  if (imgToVideo?.inputs) {
    imgToVideo.inputs['num_images'] = '1'
    delete imgToVideo.inputs['num_images.image_2']
    delete imgToVideo.inputs['num_images.index_2']
    delete imgToVideo.inputs['num_images.strength_2']
  }
  delete workflow[END_IMAGE.LOAD_IMAGE]
  delete workflow[END_IMAGE.FRAME_INDEX]
  delete workflow[END_IMAGE.RESIZE]
}

function configurePostProcessing(workflow: ComfyUIWorkflow, settings: LtxSettings) {
  if (settings.rtxEnabled) {
    setNode(workflow, LTX.RTX_SUPER_RES, {
      resize_type: settings.rtxResizeType,
      'resize_type.scale': settings.rtxScale,
      quality: settings.rtxQuality,
    })
    setNode(workflow, LTX.VIDEO_COMBINE, { images: [LTX.RTX_SUPER_RES, 0] })
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
  setNode(workflow, LTX.VIDEO_COMBINE, {
    filename_prefix: `LTX/${extractBaseImageName(params.inputImage)}`,
  })
}
