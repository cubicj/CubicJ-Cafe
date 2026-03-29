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

  setNode(workflow, LTX.SAMPLER, { sampler_name: settings.sampler })
  setNode(workflow, LTX.SIGMAS, { sigmas: settings.sigmas })
  setNode(workflow, LTX.AUDIO_NORM, { audio_normalization_factors: settings.audioNorm })

  setNode(workflow, LTX.NAG, {
    nag_scale: settings.nagScale,
    nag_alpha: settings.nagAlpha,
    nag_tau: settings.nagTau,
  })

  setNode(workflow, LTX.DURATION, { value: settings.duration })
  setNode(workflow, LTX.FRAME_RATE_INT, { value: Math.round(settings.frameRate) })
  setNode(workflow, LTX.FRAME_RATE_FLOAT, { value: settings.frameRate })

  setNode(workflow, LTX.RESIZE, {
    megapixels: settings.megapixels,
    multiple_of: settings.resizeMultipleOf,
    upscale_method: settings.resizeUpscaleMethod,
  })

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
  } else {
    removeLoraPlaceholder(workflow)
  }

  if (params.referenceAudio) {
    handleReferenceAudio(workflow, params.referenceAudio, settings)
  } else {
    handleReferenceAudioBypass(workflow)
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
  setNode(workflow, LTX.RESIZE_END_IMAGE, {
    image: [LTX.LOAD_IMAGE_END, 0],
    megapixels: settings.megapixels,
    multiple_of: settings.resizeMultipleOf,
    upscale_method: settings.resizeUpscaleMethod,
  })
}

function handleEndImageBypass(workflow: ComfyUIWorkflow) {
  const endConfig = workflow[LTX.END_IMAGE_CONFIG]
  if (endConfig?.inputs) {
    endConfig.inputs['num_images'] = '1'
    delete endConfig.inputs['num_images.image_2']
    delete endConfig.inputs['num_images.index_2']
    delete endConfig.inputs['num_images.strength_2']
  }
  delete workflow['261']
  delete workflow[LTX.RESIZE_END_IMAGE]
}

function removeLoraPlaceholder(workflow: ComfyUIWorkflow) {
  setNode(workflow, LTX.AUDIO_NORM, { model: [LTX.SAGE_ATTENTION, 0] })
  delete workflow[LTX.LORA_PLACEHOLDER]
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
  }
) {
  setNode(workflow, LTX.LOAD_AUDIO, { audio: audioFile })

  const currentModelSource = workflow[LTX.AUDIO_NORM]?.inputs?.model as [string, number]

  setNode(workflow, LTX.ID_LORA, {
    lora_name: settings.idLoraName,
    strength_model: settings.idLoraStrength,
    model: currentModelSource,
  })

  setNode(workflow, LTX.REFERENCE_AUDIO, {
    identity_guidance_scale: settings.identityGuidanceScale,
    start_percent: settings.identityStartPercent,
    end_percent: settings.identityEndPercent,
    model: [LTX.ID_LORA, 0],
  })

  setNode(workflow, LTX.AUDIO_NORM, { model: [LTX.REFERENCE_AUDIO, 0] })

  const conditioningNode = workflow['23']
  if (conditioningNode?.inputs) {
    conditioningNode.inputs.positive = [LTX.REFERENCE_AUDIO, 1]
    conditioningNode.inputs.negative = [LTX.REFERENCE_AUDIO, 2]
  }
}

function bypassVfi(workflow: ComfyUIWorkflow) {
  const vfiNode = workflow[LTX.VFI]
  const vfiInput = vfiNode?.inputs?.frames as [string, number] | undefined
  if (vfiInput) {
    setNode(workflow, LTX.RTX_SUPER_RES, { images: vfiInput })
  }
  delete workflow[LTX.VFI]
  delete workflow[LTX.VFI_MULTIPLIER]
}

function handleReferenceAudioBypass(workflow: ComfyUIWorkflow) {
  delete workflow[LTX.REFERENCE_AUDIO]
  delete workflow[LTX.ID_LORA]
  delete workflow[LTX.LOAD_AUDIO]
}
