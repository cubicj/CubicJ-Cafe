import type { ComfyUIWorkflow } from '@/types'
import type { H3Ref2vaGenerationParams } from '../types'
import type { H3Ref2vaSettings } from '@/lib/database/system-settings'
import { H3_REF2VA_WORKFLOW_TEMPLATE } from './template'
import { H3_REF2VA, refAudioLoadId, refImageLoadId, refImageResizeId, refVideoLoadId } from './nodes'
import { calculateResolution } from './resolution'
import { createLogger } from '@/lib/logger'
import { getH3Ref2vaSettings } from '@/lib/database/system-settings'
import { generateSeed, setNode } from '../shared'

const log = createLogger('comfyui')

const MAX_REF_IMAGES = 9
const MAX_REF_VIDEOS = 3
const MAX_REF_AUDIOS = 3

export async function buildH3Ref2vaWorkflow(params: H3Ref2vaGenerationParams): Promise<ComfyUIWorkflow> {
  validateReferences(params)
  const settings = await getH3Ref2vaSettings()
  const workflow = structuredClone(H3_REF2VA_WORKFLOW_TEMPLATE) as ComfyUIWorkflow

  configureModels(workflow, settings)
  configureSampling(workflow, settings)
  configureSolAttn(workflow, settings)
  configureDuration(workflow, params, settings)
  configurePrompt(workflow, params)
  configureReferences(workflow, params, settings)
  configureResolution(workflow, params, settings)
  configureRtx(workflow, settings)
  configureOutput(workflow, params, settings)

  log.debug('H3 Ref2VA workflow built', {
    prompt: params.prompt.substring(0, 50),
    imageCount: params.refImages.length,
    videoCount: params.refVideos.length,
    audioCount: params.refAudios.length,
    resolutionMode: params.resolution.mode,
    videoDuration: params.videoDuration,
  })

  return workflow
}

function validateReferences(params: H3Ref2vaGenerationParams) {
  const total = params.refImages.length + params.refVideos.length + params.refAudios.length
  if (total === 0) {
    throw new Error('H3 Ref2VA requires at least one reference')
  }
  if (params.refImages.length > MAX_REF_IMAGES || params.refVideos.length > MAX_REF_VIDEOS || params.refAudios.length > MAX_REF_AUDIOS) {
    throw new Error('H3 Ref2VA reference counts exceed node limits')
  }
  if (params.resolution.mode === 'firstImage' && params.refImages.length === 0) {
    throw new Error('H3 Ref2VA firstImage resolution requires at least one reference image')
  }
}

function configureModels(workflow: ComfyUIWorkflow, settings: H3Ref2vaSettings) {
  setNode(workflow, H3_REF2VA.UNET_LOADER, { unet_name: settings.unet, weight_dtype: settings.unetWeightDtype })
  setNode(workflow, H3_REF2VA.CLIP_LOADER, { clip_name: settings.clipName, type: settings.clipType, device: settings.clipDevice })
  setNode(workflow, H3_REF2VA.VIDEO_VAE_LOADER, { vae_name: settings.videoVae })
  setNode(workflow, H3_REF2VA.AUDIO_VAE_LOADER, { vae_name: settings.audioVae })
  setNode(workflow, H3_REF2VA.TURBO_LORA, { lora_name: settings.turboLora, strength_model: settings.turboLoraStrength })
}

function configureSampling(workflow: ComfyUIWorkflow, settings: H3Ref2vaSettings) {
  setNode(workflow, H3_REF2VA.SIGMA_SHIFT, { shift_video: settings.shiftVideo, shift_audio: settings.shiftAudio })
  setNode(workflow, H3_REF2VA.ATTENTION_BACKEND, { attention: settings.attentionBackend })
  setNode(workflow, H3_REF2VA.FUSED_MODULATION, { enabled: settings.fusedModulation })
  setNode(workflow, H3_REF2VA.CHUNK_FEEDFORWARD, {
    enabled: settings.chunkFeedforwardEnabled,
    chunks: settings.chunkFeedforwardChunks,
    min_tokens: settings.chunkFeedforwardMinTokens,
  })
  setNode(workflow, H3_REF2VA.SAMPLER_SELECT, { sampler_name: settings.sampler })
  setNode(workflow, H3_REF2VA.SCHEDULER, { scheduler: settings.scheduler })
  setNode(workflow, H3_REF2VA.STEPS, { value: settings.steps })
  setNode(workflow, H3_REF2VA.RANDOM_NOISE, { noise_seed: generateSeed() })
}

function configureSolAttn(workflow: ComfyUIWorkflow, settings: H3Ref2vaSettings) {
  if (settings.solAttnEnabled) {
    setNode(workflow, H3_REF2VA.SOL_ATTN, {
      enabled: true,
      tau_start: settings.solAttnTauStart,
      tau_end: settings.solAttnTauEnd,
      curve: settings.solAttnCurve,
      min_tokens: settings.solAttnMinTokens,
      strict: settings.solAttnStrict,
      dense_percent: settings.solAttnDensePercent,
      thresh_type: settings.solAttnThreshType,
      int8_qk: settings.solAttnInt8Qk,
      int8_pv: settings.solAttnInt8Pv,
      sink_conditioning: settings.solAttnSinkConditioning,
      dense_blocks: settings.solAttnDenseBlocks,
    })
    return
  }
  delete workflow[H3_REF2VA.SOL_ATTN]
  setNode(workflow, H3_REF2VA.FUSED_MODULATION, { model: [H3_REF2VA.ATTENTION_BACKEND, 0] })
}

function configureDuration(workflow: ComfyUIWorkflow, params: H3Ref2vaGenerationParams, settings: H3Ref2vaSettings) {
  setNode(workflow, H3_REF2VA.FRAME_N, { value: params.videoDuration })
  setNode(workflow, H3_REF2VA.FRAME_MATH, { expression: `${settings.framesPerStep} * a + ${settings.frameBase}` })
  setNode(workflow, H3_REF2VA.FPS, { number: settings.frameRate })
}

function configurePrompt(workflow: ComfyUIWorkflow, params: H3Ref2vaGenerationParams) {
  setNode(workflow, H3_REF2VA.POSITIVE_PROMPT, { positive: params.prompt })
}

function configureReferences(workflow: ComfyUIWorkflow, params: H3Ref2vaGenerationParams, settings: H3Ref2vaSettings) {
  const ref = workflow[H3_REF2VA.REFERENCE_TO_VIDEO]!.inputs!
  ref.ref_image_size = settings.refImageSize

  params.refImages.forEach((name, slot) => {
    workflow[refImageLoadId(slot)] = {
      inputs: { image: name },
      class_type: 'LoadImage',
      _meta: { title: `Ref Image ${slot}` },
    }
    workflow[refImageResizeId(slot)] = {
      inputs: {
        megapixels: settings.megapixels,
        multiple_of: settings.resizeMultipleOf,
        upscale_method: settings.resizeUpscaleMethod,
        image: [refImageLoadId(slot), 0],
      },
      class_type: 'ResizeImageToMegapixels',
      _meta: { title: 'Resize Image (Megapixels + Alignment)' },
    }
    ref[`ref_images.ref_image_${slot}`] = [refImageResizeId(slot), 0]
  })

  params.refVideos.forEach((video, slot) => {
    workflow[refVideoLoadId(slot)] = {
      inputs: {
        video: video.name,
        force_rate: 0,
        custom_width: 0,
        custom_height: 0,
        frame_load_cap: 0,
        skip_first_frames: 0,
        select_every_nth: 1,
        format: 'None',
      },
      class_type: 'VHS_LoadVideo',
      _meta: { title: 'Load Video (Upload) 🎥🅥🅗🅢' },
    }
    ref[`ref_videos.ref_video_${slot}`] = [refVideoLoadId(slot), 0]
    if (video.includeSoundtrack) {
      ref[`ref_video_audios.ref_video_audio_${slot}`] = [refVideoLoadId(slot), 2]
    }
  })

  params.refAudios.forEach((name, slot) => {
    workflow[refAudioLoadId(slot)] = {
      inputs: { audio: name },
      class_type: 'LoadAudio',
      _meta: { title: 'Load Audio' },
    }
    ref[`ref_audios.ref_audio_${slot}`] = [refAudioLoadId(slot), 0]
  })
}

function configureResolution(workflow: ComfyUIWorkflow, params: H3Ref2vaGenerationParams, settings: H3Ref2vaSettings) {
  const ref = workflow[H3_REF2VA.REFERENCE_TO_VIDEO]!.inputs!
  if (params.resolution.mode === 'firstImage') {
    ref.width = [refImageResizeId(0), 1]
    ref.height = [refImageResizeId(0), 2]
    return
  }
  const { width, height } = calculateResolution({
    aspectWidth: params.resolution.aspectWidth,
    aspectHeight: params.resolution.aspectHeight,
    megapixels: settings.megapixels,
    multipleOf: settings.resizeMultipleOf,
  })
  ref.width = width
  ref.height = height
}

function configureRtx(workflow: ComfyUIWorkflow, settings: H3Ref2vaSettings) {
  if (settings.rtxEnabled) {
    setNode(workflow, H3_REF2VA.RTX_SUPER_RES, {
      resize_type: settings.rtxResizeType,
      'resize_type.scale': settings.rtxScale,
      quality: settings.rtxQuality,
    })
    return
  }
  delete workflow[H3_REF2VA.RTX_SUPER_RES]
  setNode(workflow, H3_REF2VA.VIDEO_COMBINE, { images: [H3_REF2VA.VAE_DECODE, 0] })
}

function configureOutput(workflow: ComfyUIWorkflow, params: H3Ref2vaGenerationParams, settings: H3Ref2vaSettings) {
  const firstReference = params.refImages[0] ?? params.refVideos[0]?.name ?? params.refAudios[0]!
  const firstReferenceName = firstReference.split(/[\\/]/).pop()!
  setNode(workflow, H3_REF2VA.VIDEO_COMBINE, {
    crf: settings.videoCrf,
    format: settings.videoFormat,
    pix_fmt: settings.videoPixFmt,
    filename_prefix: `H3Ref2VA/${firstReferenceName.replace(/\.[^.]+$/, '')}`,
  })
}
