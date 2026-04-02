import type { LtxGenerationParams } from '../types'
import type { ComfyUIWorkflow } from '@/types'
import type { ComfyUIServer } from '../../server-manager'
import type { LtxSettings } from '@/lib/database/system-settings'
import type { LoRAPresetData } from '@/types/lora'
import { LTX_WORKFLOW_TEMPLATE } from './template'
import { LTX } from './nodes'
import { createLogger } from '@/lib/logger'
import { getLtxSettings } from '@/lib/database/system-settings'
import { generateSeed, extractBaseImageName, setNode, dumpWorkflow } from '../shared'
import { deduplicateByFilename } from '../lora-utils'

const log = createLogger('comfyui')

export async function buildLtxWorkflow(
  params: LtxGenerationParams,
  server?: ComfyUIServer
): Promise<ComfyUIWorkflow> {
  const settings = await getLtxSettings()
  const workflow: ComfyUIWorkflow = JSON.parse(JSON.stringify(LTX_WORKFLOW_TEMPLATE))

  configureModels(workflow, settings)
  configureGeneration(workflow, params, settings)
  configureScheduler(workflow, settings)
  configureNag(workflow, settings)
  configureAudioNorm(workflow, settings)

  if (settings.loraEnabled && params.loraPreset && params.loraPreset.loraItems?.length > 0) {
    applyUserLoras(workflow, params.loraPreset, server)
  }

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
    duration: settings.duration,
    loraEnabled: settings.loraEnabled,
    hasLoraPreset: !!(params.loraPreset && params.loraPreset.loraItems?.length),
    hasReferenceAudio: !!params.referenceAudio,
  })

  dumpWorkflow('ltx', workflow)
  return workflow
}

function configureModels(workflow: ComfyUIWorkflow, settings: LtxSettings) {
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
  setNode(workflow, LTX.UNET_2ND, {
    unet_name: settings.unet2nd,
    weight_dtype: settings.weightDtype2nd,
  })
}

function configureGeneration(
  workflow: ComfyUIWorkflow,
  params: LtxGenerationParams,
  settings: LtxSettings
) {
  setNode(workflow, LTX.POSITIVE_PROMPT, { text: params.prompt })
  setNode(workflow, LTX.NEGATIVE_PROMPT, { text: settings.negativePrompt })
  setNode(workflow, LTX.SAMPLER_SELECT, { sampler_name: settings.sampler })
  setNode(workflow, LTX.DURATION, { value: settings.duration })
  setNode(workflow, LTX.FRAME_RATE, { number: Math.round(settings.frameRate) })
  setNode(workflow, LTX.RESIZE, {
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
  setNode(workflow, LTX.SIGMAS_2ND, { sigmas: settings.sigmas2nd })
}

function configureNag(workflow: ComfyUIWorkflow, settings: LtxSettings) {
  setNode(workflow, LTX.NAG, {
    nag_scale: settings.nagScale,
    nag_alpha: settings.nagAlpha,
    nag_tau: settings.nagTau,
  })
  setNode(workflow, LTX.NAG_2ND, {
    nag_scale: settings.nagScale2nd,
    nag_alpha: settings.nagAlpha2nd,
    nag_tau: settings.nagTau2nd,
  })
}

function configureAudioNorm(workflow: ComfyUIWorkflow, settings: LtxSettings) {
  setNode(workflow, LTX.AUDIO_NORM_1ST, { audio_normalization_factors: settings.audioNorm1st })
  setNode(workflow, LTX.AUDIO_NORM_2ND, { audio_normalization_factors: settings.audioNorm2nd })
}

function applyUserLoras(
  workflow: ComfyUIWorkflow,
  loraPreset: LoRAPresetData,
  server?: ComfyUIServer
) {
  const deduplicated = deduplicateByFilename(loraPreset.loraItems)
  if (deduplicated.length === 0) return

  for (const nodeId of [LTX.POWER_LORA_1ST, LTX.POWER_LORA_2ND]) {
    const node = workflow[nodeId]
    if (!node?.inputs) continue

    for (let i = 0; i < deduplicated.length; i++) {
      let loraFilename = deduplicated[i].loraFilename
      if (server?.type === 'RUNPOD') {
        loraFilename = loraFilename.replace(/\\/g, '/')
      }
      node.inputs[`lora_${i + 3}`] = {
        on: true,
        lora: loraFilename,
        strength: deduplicated[i].strength,
      }
    }
  }

  log.info('LTX user LoRAs applied via Power Lora Loader', {
    presetName: loraPreset.presetName,
    count: deduplicated.length,
    loras: deduplicated.map(l => ({ filename: l.loraFilename, strength: l.strength })),
  })
}

function handleReferenceAudio(
  workflow: ComfyUIWorkflow,
  audioFile: string,
  settings: LtxSettings
) {
  workflow[LTX.LOAD_AUDIO] = {
    inputs: { audio: audioFile },
    class_type: 'LoadAudio',
    _meta: { title: 'LTX_350' },
  }

  const sharedRefInputs = {
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
      model: [LTX.POWER_LORA_1ST, 0],
      ...sharedRefInputs,
    },
    class_type: 'LTXVReferenceAudio',
    _meta: { title: 'LTX_348' },
  }

  workflow[LTX.REFERENCE_AUDIO_2ND] = {
    inputs: {
      identity_guidance_scale: settings.identityGuidanceScale2nd,
      start_percent: settings.identityStartPercent2nd,
      end_percent: settings.identityEndPercent2nd,
      model: [LTX.POWER_LORA_2ND, 0],
      ...sharedRefInputs,
    },
    class_type: 'LTXVReferenceAudio',
    _meta: { title: 'LTX_441' },
  }

  const node1st = workflow[LTX.POWER_LORA_1ST]
  if (node1st?.inputs) {
    node1st.inputs['lora_2'] = { on: true, lora: settings.idLoraName, strength: settings.idLoraStrength }
  }
  const node2nd = workflow[LTX.POWER_LORA_2ND]
  if (node2nd?.inputs) {
    node2nd.inputs['lora_2'] = { on: true, lora: settings.idLoraName, strength: settings.idLoraStrength2nd }
  }

  setNode(workflow, LTX.NAG, { model: [LTX.REFERENCE_AUDIO, 0] })
  setNode(workflow, LTX.CFG_GUIDER, {
    positive: [LTX.REFERENCE_AUDIO, 1],
    negative: [LTX.REFERENCE_AUDIO, 2],
  })

  setNode(workflow, LTX.NAG_2ND, { model: [LTX.REFERENCE_AUDIO_2ND, 0] })
  setNode(workflow, LTX.CFG_GUIDER_2ND, {
    positive: [LTX.REFERENCE_AUDIO_2ND, 1],
    negative: [LTX.REFERENCE_AUDIO_2ND, 2],
  })
}

function handleEndImage(
  workflow: ComfyUIWorkflow,
  endImage: string,
  settings: { megapixels: number; resizeMultipleOf: number; resizeUpscaleMethod: string }
) {
  workflow[LTX.LOAD_IMAGE_END] = {
    inputs: { image: endImage },
    class_type: 'LoadImage',
    _meta: { title: 'LTX_260' },
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
  for (const nodeId of [LTX.IMG_TO_VIDEO, LTX.IMG_TO_VIDEO_2ND]) {
    const node = workflow[nodeId]
    if (node?.inputs) {
      node.inputs['num_images'] = '1'
      delete node.inputs['num_images.image_2']
      delete node.inputs['num_images.index_2']
      delete node.inputs['num_images.strength_2']
    }
  }
  delete workflow[LTX.END_FRAME_MATH]
  delete workflow[LTX.RESIZE_END_IMAGE]
}

function configurePostProcessing(workflow: ComfyUIWorkflow, settings: LtxSettings) {
  let lastOutput: string = LTX.VAE_DECODE

  if (settings.colorMatchEnabled) {
    setNode(workflow, LTX.COLOR_MATCH, {
      method: settings.colorMatchMethod,
      strength: settings.colorMatchStrength,
    })
    lastOutput = LTX.COLOR_MATCH
  } else {
    delete workflow[LTX.COLOR_MATCH]
  }

  if (settings.vfiEnabled) {
    setNode(workflow, LTX.VFI_MULTIPLIER, { value: settings.vfiMultiplier })

    if (settings.vfiMethod === 'rife') {
      setNode(workflow, LTX.VFI, {
        clear_cache_after_n_frames: settings.vfiClearCache,
        frames: [lastOutput, 0],
      })
      setNode(workflow, LTX.RIFE_MODEL_LOADER, {
        model: settings.rifeModel,
        precision: settings.rifePrecision,
        resolution_profile: settings.rifeResolutionProfile,
      })
      lastOutput = LTX.VFI
      delete workflow[LTX.GMFSS_VFI]
    } else {
      setNode(workflow, LTX.GMFSS_VFI, {
        ckpt_name: settings.gmfssModel,
        clear_cache_after_n_frames: settings.vfiClearCache,
        frames: [lastOutput, 0],
      })
      lastOutput = LTX.GMFSS_VFI
      delete workflow[LTX.VFI]
      delete workflow[LTX.RIFE_MODEL_LOADER]
    }
  } else {
    delete workflow[LTX.VFI]
    delete workflow[LTX.RIFE_MODEL_LOADER]
    delete workflow[LTX.GMFSS_VFI]
    delete workflow[LTX.VFI_MULTIPLIER]
    delete workflow[LTX.VFI_FRAME_RATE]
  }

  if (settings.rtxEnabled) {
    setNode(workflow, LTX.RTX_SUPER_RES, {
      resize_type: settings.rtxResizeType,
      'resize_type.scale': settings.rtxScale,
      quality: settings.rtxQuality,
      images: [lastOutput, 0],
    })
    lastOutput = LTX.RTX_SUPER_RES
  } else {
    delete workflow[LTX.RTX_SUPER_RES]
  }

  setNode(workflow, LTX.VIDEO_OUTPUT, { images: [lastOutput, 0] })

  if (settings.vfiEnabled) {
    setNode(workflow, LTX.VIDEO_OUTPUT, { frame_rate: [LTX.VFI_FRAME_RATE, 1] })
  } else {
    setNode(workflow, LTX.VIDEO_OUTPUT, { frame_rate: [LTX.FRAME_RATE, 2] })
  }
}

function configureOutput(
  workflow: ComfyUIWorkflow,
  params: LtxGenerationParams,
  settings: LtxSettings
) {
  setNode(workflow, LTX.UPSCALE_MODEL, { model_name: settings.upscaleModel })
  setNode(workflow, LTX.VIDEO_OUTPUT, {
    crf: settings.videoCrf,
    format: settings.videoFormat,
    pix_fmt: settings.videoPixFmt,
  })
  setNode(workflow, LTX.LOAD_IMAGE, { image: params.inputImage })

  if (workflow[LTX.VIDEO_OUTPUT] && params.inputImage) {
    setNode(workflow, LTX.VIDEO_OUTPUT, {
      filename_prefix: `LTX/${extractBaseImageName(params.inputImage)}`,
    })
  }
}
