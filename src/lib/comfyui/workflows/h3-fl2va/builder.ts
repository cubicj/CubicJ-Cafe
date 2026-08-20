import type { ComfyUIWorkflow } from '@/types'
import type { H3Fl2vaGenerationParams } from '../types'
import type { H3Fl2vaSettings } from '@/lib/database/system-settings'
import { H3_FL2VA_WORKFLOW_TEMPLATE } from './template'
import { H3_FL2VA } from './nodes'
import { createLogger } from '@/lib/logger'
import { getH3Fl2vaSettings } from '@/lib/database/system-settings'
import { generateSeed, extractBaseImageName, setNode } from '../shared'

const log = createLogger('comfyui')

export async function buildH3Fl2vaWorkflow(params: H3Fl2vaGenerationParams): Promise<ComfyUIWorkflow> {
  if (!params.inputImage && !params.endImage) {
    throw new Error('H3 FL2VA requires at least one image')
  }
  const settings = await getH3Fl2vaSettings()
  const workflow = structuredClone(H3_FL2VA_WORKFLOW_TEMPLATE) as ComfyUIWorkflow

  configureModels(workflow, settings)
  configureSampling(workflow, settings)
  configureDuration(workflow, params, settings)
  configurePrompt(workflow, params)
  configureImages(workflow, params, settings)
  configureRtx(workflow, settings)
  configureOutput(workflow, params, settings)

  log.debug('H3 FL2VA workflow built', {
    prompt: params.prompt.substring(0, 50),
    hasStartImage: !!params.inputImage,
    hasEndImage: !!params.endImage,
    videoDuration: params.videoDuration,
  })

  return workflow
}

function configureModels(workflow: ComfyUIWorkflow, settings: H3Fl2vaSettings) {
  setNode(workflow, H3_FL2VA.UNET_LOADER, { unet_name: settings.unet, weight_dtype: settings.unetWeightDtype })
  setNode(workflow, H3_FL2VA.CLIP_LOADER, { clip_name: settings.clipName, type: settings.clipType, device: settings.clipDevice })
  setNode(workflow, H3_FL2VA.VIDEO_VAE_LOADER, { vae_name: settings.videoVae })
  setNode(workflow, H3_FL2VA.AUDIO_VAE_LOADER, { vae_name: settings.audioVae })
  setNode(workflow, H3_FL2VA.TURBO_LORA, { lora_name: settings.turboLora, strength: settings.turboLoraStrength })
}

function configureSampling(workflow: ComfyUIWorkflow, settings: H3Fl2vaSettings) {
  setNode(workflow, H3_FL2VA.SIGMA_SHIFT, { shift_video: settings.shiftVideo, shift_audio: settings.shiftAudio })
  setNode(workflow, H3_FL2VA.ATTENTION_BACKEND, { attention: settings.attentionBackend })
  setNode(workflow, H3_FL2VA.FUSED_MODULATION, { enabled: settings.fusedModulation })
  setNode(workflow, H3_FL2VA.CHUNK_FEEDFORWARD, {
    enabled: settings.chunkFeedforwardEnabled,
    chunks: settings.chunkFeedforwardChunks,
    min_tokens: settings.chunkFeedforwardMinTokens,
  })
  setNode(workflow, H3_FL2VA.SAMPLER_SELECT, { sampler_name: settings.sampler })
  setNode(workflow, H3_FL2VA.SCHEDULER, { scheduler: settings.scheduler })
  setNode(workflow, H3_FL2VA.STEPS, { value: settings.steps })
  setNode(workflow, H3_FL2VA.RANDOM_NOISE, { noise_seed: generateSeed() })
}

function configureDuration(workflow: ComfyUIWorkflow, params: H3Fl2vaGenerationParams, settings: H3Fl2vaSettings) {
  setNode(workflow, H3_FL2VA.FRAME_N, { value: params.videoDuration })
  setNode(workflow, H3_FL2VA.FRAME_MATH, { expression: `${settings.framesPerStep} * a + ${settings.frameBase}` })
  setNode(workflow, H3_FL2VA.FPS, { number: settings.frameRate })
}

function configurePrompt(workflow: ComfyUIWorkflow, params: H3Fl2vaGenerationParams) {
  setNode(workflow, H3_FL2VA.POSITIVE_PROMPT, { positive: params.prompt })
}

function configureImages(workflow: ComfyUIWorkflow, params: H3Fl2vaGenerationParams, settings: H3Fl2vaSettings) {
  const resize = {
    megapixels: settings.megapixels,
    multiple_of: settings.resizeMultipleOf,
    upscale_method: settings.resizeUpscaleMethod,
  }

  if (params.inputImage && params.endImage) {
    setNode(workflow, H3_FL2VA.LOAD_IMAGE_FIRST, { image: params.inputImage })
    setNode(workflow, H3_FL2VA.RESIZE_FIRST, resize)
    setNode(workflow, H3_FL2VA.LOAD_IMAGE_LAST, { image: params.endImage })
    setNode(workflow, H3_FL2VA.RESIZE_LAST, { ...resize, megapixels: settings.megapixelsLast })
    return
  }

  if (params.inputImage) {
    setNode(workflow, H3_FL2VA.LOAD_IMAGE_FIRST, { image: params.inputImage })
    setNode(workflow, H3_FL2VA.RESIZE_FIRST, resize)
    delete workflow[H3_FL2VA.LOAD_IMAGE_LAST]
    delete workflow[H3_FL2VA.RESIZE_LAST]
    delete workflow[H3_FL2VA.IMAGE_TO_VIDEO]!.inputs!.last_frame
    return
  }

  setNode(workflow, H3_FL2VA.LOAD_IMAGE_LAST, { image: params.endImage! })
  setNode(workflow, H3_FL2VA.RESIZE_LAST, resize)
  delete workflow[H3_FL2VA.LOAD_IMAGE_FIRST]
  delete workflow[H3_FL2VA.RESIZE_FIRST]
  const imageToVideo = workflow[H3_FL2VA.IMAGE_TO_VIDEO]!.inputs!
  delete imageToVideo.first_frame
  imageToVideo.width = [H3_FL2VA.RESIZE_LAST, 1]
  imageToVideo.height = [H3_FL2VA.RESIZE_LAST, 2]
}

function configureRtx(workflow: ComfyUIWorkflow, settings: H3Fl2vaSettings) {
  if (settings.rtxEnabled) {
    setNode(workflow, H3_FL2VA.RTX_SUPER_RES, {
      resize_type: settings.rtxResizeType,
      'resize_type.scale': settings.rtxScale,
      quality: settings.rtxQuality,
    })
    return
  }
  delete workflow[H3_FL2VA.RTX_SUPER_RES]
  setNode(workflow, H3_FL2VA.VIDEO_COMBINE, { images: [H3_FL2VA.VAE_DECODE, 0] })
}

function configureOutput(workflow: ComfyUIWorkflow, params: H3Fl2vaGenerationParams, settings: H3Fl2vaSettings) {
  setNode(workflow, H3_FL2VA.VIDEO_COMBINE, {
    crf: settings.videoCrf,
    format: settings.videoFormat,
    pix_fmt: settings.videoPixFmt,
    filename_prefix: `H3FL2VA/${extractBaseImageName(params.inputImage ?? params.endImage!)}`,
  })
}
