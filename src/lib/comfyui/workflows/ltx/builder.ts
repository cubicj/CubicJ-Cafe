import type { LtxGenerationParams } from '../types'
import type { ComfyUIWorkflow } from '@/types'
import type { ComfyUIServer } from '../../server-manager'
import { LTX_WORKFLOW_TEMPLATE } from './template'
import { LTX } from './nodes'
import { applyLtxLoraChain } from './lora-manager'
import { createLogger } from '@/lib/logger'
import { getLtxSettings } from '@/lib/database/system-settings'
import { generateSeed, extractBaseImageName, setNode, dumpWorkflow } from '../shared'

const log = createLogger('comfyui')

export async function buildLtxWorkflow(
  params: LtxGenerationParams,
  server?: ComfyUIServer
): Promise<ComfyUIWorkflow> {
  const settings = await getLtxSettings()
  const workflow: ComfyUIWorkflow = JSON.parse(JSON.stringify(LTX_WORKFLOW_TEMPLATE))

  setNode(workflow, LTX.AUDIO_VAE, { vae_name: settings.audioVae })
  setNode(workflow, LTX.VIDEO_VAE, { vae_name: settings.videoVae })
  setNode(workflow, LTX.CLIP, {
    clip_name1: settings.clipGguf,
    clip_name2: settings.clipEmbeddings,
  })
  setNode(workflow, LTX.UNET, {
    unet_name: settings.unet,
    weight_dtype: settings.weightDtype,
  })

  setNode(workflow, LTX.POSITIVE_PROMPT, { text: params.prompt })
  setNode(workflow, LTX.NEGATIVE_PROMPT, { text: settings.negativePrompt })

  setNode(workflow, LTX.SAMPLER_SELECT, { sampler_name: settings.sampler })

  setNode(workflow, LTX.NAG, {
    nag_scale: settings.nagScale,
    nag_alpha: settings.nagAlpha,
    nag_tau: settings.nagTau,
  })

  setNode(workflow, LTX.DURATION, { value: settings.duration })
  setNode(workflow, LTX.FRAME_RATE, { number: Math.round(settings.frameRate) })

  setNode(workflow, LTX.RESIZE, {
    megapixels: settings.megapixels,
    multiple_of: settings.resizeMultipleOf,
    upscale_method: settings.resizeUpscaleMethod,
  })

  setNode(workflow, LTX.SCHEDULER, {
    steps: settings.schedulerSteps,
    max_shift: settings.schedulerMaxShift,
    base_shift: settings.schedulerBaseShift,
    stretch: settings.schedulerStretch,
    terminal: settings.schedulerTerminal,
  })

  setNode(workflow, LTX.SIGMAS_2ND, { sigmas: settings.sigmas2nd })

  setNode(workflow, LTX.DISTILLED_LORA, {
    lora_name: settings.distilledLoraName,
    strength_model: settings.distilledLoraStrength,
  })

  setNode(workflow, LTX.UPSCALE_MODEL, { model_name: settings.upscaleModel })

  setNode(workflow, LTX.COLOR_MATCH, {
    method: settings.colorMatchMethod,
    strength: settings.colorMatchStrength,
  })

  setNode(workflow, LTX.AUDIO_NORM_1ST, { audio_normalization_factors: settings.audioNorm1st })
  setNode(workflow, LTX.AUDIO_NORM_2ND, { audio_normalization_factors: settings.audioNorm2nd })

  setNode(workflow, LTX.RTX_SUPER_RES, {
    resize_type: settings.rtxResizeType,
    'resize_type.scale': settings.rtxScale,
    quality: settings.rtxQuality,
  })

  if (settings.vfiEnabled) {
    setNode(workflow, LTX.VFI, {
      ckpt_name: settings.vfiCheckpoint,
      clear_cache_after_n_frames: settings.vfiClearCache,
    })
    setNode(workflow, LTX.VFI_MULTIPLIER, { value: settings.vfiMultiplier })
  } else {
    bypassVfi(workflow)
  }

  setNode(workflow, LTX.VIDEO_OUTPUT, {
    crf: settings.videoCrf,
    format: settings.videoFormat,
    pix_fmt: settings.videoPixFmt,
  })

  setNode(workflow, LTX.LOAD_IMAGE, { image: params.inputImage })

  if (params.endImage) {
    handleEndImage(workflow, params.endImage, settings)
  } else {
    handleEndImageBypass(workflow)
  }

  if (settings.loraEnabled && params.loraPreset && params.loraPreset.loraItems?.length > 0) {
    await applyLtxLoraChain(workflow, params.loraPreset, server)
  }

  if (params.referenceAudio) {
    handleReferenceAudio(workflow, params.referenceAudio, settings)
  }

  setNode(workflow, LTX.NOISE_SEED, { noise_seed: generateSeed() })

  if (workflow[LTX.VIDEO_OUTPUT] && params.inputImage) {
    setNode(workflow, LTX.VIDEO_OUTPUT, {
      filename_prefix: `LTX/${extractBaseImageName(params.inputImage)}`,
    })
  }

  log.info('LTX workflow built', {
    prompt: params.prompt.substring(0, 50),
    hasEndImage: !!params.endImage,
    duration: settings.duration,
    loraEnabled: settings.loraEnabled,
    hasLoraPreset: !!(params.loraPreset && params.loraPreset.loraItems?.length),
    hasReferenceAudio: !!params.referenceAudio,
  })

  dumpWorkflow('ltx', workflow)

  return workflow
}

function handleEndImage(
  workflow: ComfyUIWorkflow,
  endImage: string,
  settings: { megapixels: number; resizeMultipleOf: number; resizeUpscaleMethod: string }
) {
  workflow[LTX.LOAD_IMAGE_END] = {
    inputs: { image: endImage },
    class_type: 'LoadImage',
    _meta: { title: 'LTX_EndImage' },
  }

  workflow[LTX.END_FRAME_MATH] = {
    inputs: {
      expression: 'a - 1',
      a: [LTX.FRAME_COUNT_MATH, 0],
    },
    class_type: 'MathExpression|pysssss',
    _meta: { title: 'LTX_261' },
  }

  workflow[LTX.RESIZE_END_IMAGE] = {
    inputs: {
      image: [LTX.LOAD_IMAGE_END, 0],
      megapixels: settings.megapixels,
      multiple_of: settings.resizeMultipleOf,
      upscale_method: settings.resizeUpscaleMethod,
    },
    class_type: 'ResizeImageToMegapixels',
    _meta: { title: 'LTX_264' },
  }
}

function handleEndImageBypass(workflow: ComfyUIWorkflow) {
  const pass1 = workflow[LTX.IMG_TO_VIDEO]
  if (pass1?.inputs) {
    pass1.inputs['num_images'] = '1'
    delete pass1.inputs['num_images.image_2']
    delete pass1.inputs['num_images.index_2']
    delete pass1.inputs['num_images.strength_2']
  }

  const pass2 = workflow[LTX.IMG_TO_VIDEO_2ND]
  if (pass2?.inputs) {
    pass2.inputs['num_images'] = '1'
    delete pass2.inputs['num_images.image_2']
    delete pass2.inputs['num_images.index_2']
    delete pass2.inputs['num_images.strength_2']
  }

  delete workflow[LTX.END_FRAME_MATH]
  delete workflow[LTX.RESIZE_END_IMAGE]
}

function handleReferenceAudio(
  workflow: ComfyUIWorkflow,
  audioFile: string,
  settings: {
    idLoraName: string
    idLoraStrength: number
    identityGuidanceScale: number
    identityStartPercent: number
    identityEndPercent: number
    identityGuidanceScale2nd: number
    identityStartPercent2nd: number
    identityEndPercent2nd: number
  }
) {
  workflow[LTX.LOAD_AUDIO] = {
    inputs: { audio: audioFile },
    class_type: 'LoadAudio',
    _meta: { title: 'LTX_350' },
  }

  workflow[LTX.ID_LORA] = {
    inputs: {
      lora_name: settings.idLoraName,
      strength_model: settings.idLoraStrength,
      model: [LTX.NAG, 0],
    },
    class_type: 'LoraLoaderModelOnly',
    _meta: { title: 'LTX_296' },
  }

  const sharedInputs = {
    model: [LTX.ID_LORA, 0],
    positive: [LTX.CONDITIONING, 0],
    negative: [LTX.CONDITIONING, 1],
    reference_audio: [LTX.LOAD_AUDIO, 0],
    audio_vae: [LTX.AUDIO_VAE, 0],
  }

  workflow[LTX.REFERENCE_AUDIO] = {
    inputs: {
      identity_guidance_scale: settings.identityGuidanceScale,
      start_percent: settings.identityStartPercent,
      end_percent: settings.identityEndPercent,
      ...sharedInputs,
    },
    class_type: 'LTXVReferenceAudio',
    _meta: { title: 'LTX_348' },
  }

  workflow[LTX.REFERENCE_AUDIO_2ND] = {
    inputs: {
      identity_guidance_scale: settings.identityGuidanceScale2nd,
      start_percent: settings.identityStartPercent2nd,
      end_percent: settings.identityEndPercent2nd,
      ...sharedInputs,
    },
    class_type: 'LTXVReferenceAudio',
    _meta: { title: 'LTX_441' },
  }

  setNode(workflow, LTX.DISTILLED_LORA, {
    model: [LTX.REFERENCE_AUDIO, 0],
  })

  setNode(workflow, LTX.CFG_GUIDER, {
    positive: [LTX.REFERENCE_AUDIO, 1],
    negative: [LTX.REFERENCE_AUDIO, 2],
  })

  setNode(workflow, LTX.AUDIO_NORM_2ND, {
    model: [LTX.REFERENCE_AUDIO_2ND, 0],
  })

  setNode(workflow, LTX.CFG_GUIDER_2ND, {
    positive: [LTX.REFERENCE_AUDIO_2ND, 1],
    negative: [LTX.REFERENCE_AUDIO_2ND, 2],
  })
}

function bypassVfi(workflow: ComfyUIWorkflow) {
  setNode(workflow, LTX.RTX_SUPER_RES, { images: [LTX.COLOR_MATCH, 0] })
  setNode(workflow, LTX.VIDEO_OUTPUT, { frame_rate: [LTX.FRAME_RATE, 2] })
  delete workflow[LTX.VFI]
  delete workflow[LTX.VFI_MULTIPLIER]
  delete workflow[LTX.VFI_FRAME_RATE]
}
