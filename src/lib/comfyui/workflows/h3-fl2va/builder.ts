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
}

function configureSampling(workflow: ComfyUIWorkflow, settings: H3Fl2vaSettings) {
  setNode(workflow, H3_FL2VA.SIGMA_SHIFT, { shift_video: settings.shiftVideo, shift_audio: settings.shiftAudio })
  setNode(workflow, H3_FL2VA.SAGE_PATCH, { sage_attention: settings.sageAttention, allow_compile: settings.sageAllowCompile })
  setNode(workflow, H3_FL2VA.LOW_VRAM_ATTN, { head_chunks: settings.lowVramHeadChunks })
  setNode(workflow, H3_FL2VA.CHUNK_FEEDFORWARD, {
    enabled: settings.chunkFeedforwardEnabled,
    chunks: settings.chunkFeedforwardChunks,
    min_tokens: settings.chunkFeedforwardMinLen,
  })
  setNode(workflow, H3_FL2VA.SAMPLER_SELECT, { sampler_name: settings.sampler })
  setNode(workflow, H3_FL2VA.SCHEDULER, { scheduler: settings.scheduler })
  setNode(workflow, H3_FL2VA.STEPS, { value: settings.steps })
  setNode(workflow, H3_FL2VA.SPLIT_SIGMAS, { step: settings.splitStep })
  setNode(workflow, H3_FL2VA.MANUAL_SIGMAS, { sigmas: settings.manualSigmas })
  setNode(workflow, H3_FL2VA.LATENT_UPSCALER, {
    model_name: settings.upscalerModel,
    align: settings.upscalerAlign,
    enable_chunking: settings.upscalerChunking,
    device: settings.upscalerDevice,
    precision: settings.upscalerPrecision,
  })
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
  const pass1Resize = { megapixels: settings.megapixels, multiple_of: settings.resizeMultipleOf, upscale_method: settings.resizeUpscaleMethod }
  const pass2Resize = { ...pass1Resize, megapixels: settings.secondPassMegapixels }

  setNode(workflow, H3_FL2VA.RESIZE_FIRST_PASS1, pass1Resize)
  setNode(workflow, H3_FL2VA.RESIZE_LAST_PASS1, pass1Resize)
  setNode(workflow, H3_FL2VA.RESIZE_FIRST_PASS2, pass2Resize)
  setNode(workflow, H3_FL2VA.RESIZE_LAST_PASS2, pass2Resize)

  const firstPass = workflow[H3_FL2VA.IMAGE_TO_VIDEO_FIRST]!.inputs!
  const secondPass = workflow[H3_FL2VA.IMAGE_TO_VIDEO_SECOND]!.inputs!

  if (params.inputImage && params.endImage) {
    setNode(workflow, H3_FL2VA.LOAD_IMAGE_FIRST, { image: params.inputImage })
    setNode(workflow, H3_FL2VA.LOAD_IMAGE_LAST, { image: params.endImage })
    firstPass.last_frame = [H3_FL2VA.RESIZE_LAST_PASS1, 0]
    secondPass.last_frame = [H3_FL2VA.RESIZE_LAST_PASS2, 0]
    return
  }

  if (params.inputImage) {
    setNode(workflow, H3_FL2VA.LOAD_IMAGE_FIRST, { image: params.inputImage })
    delete workflow[H3_FL2VA.LOAD_IMAGE_LAST]
    delete workflow[H3_FL2VA.RESIZE_LAST_PASS1]
    delete workflow[H3_FL2VA.RESIZE_LAST_PASS2]
    return
  }

  setNode(workflow, H3_FL2VA.LOAD_IMAGE_LAST, { image: params.endImage! })
  delete workflow[H3_FL2VA.LOAD_IMAGE_FIRST]
  delete workflow[H3_FL2VA.RESIZE_FIRST_PASS1]
  delete workflow[H3_FL2VA.RESIZE_FIRST_PASS2]

  delete firstPass.first_frame
  firstPass.last_frame = [H3_FL2VA.RESIZE_LAST_PASS1, 0]
  firstPass.width = [H3_FL2VA.RESIZE_LAST_PASS1, 1]
  firstPass.height = [H3_FL2VA.RESIZE_LAST_PASS1, 2]

  delete secondPass.first_frame
  secondPass.last_frame = [H3_FL2VA.RESIZE_LAST_PASS2, 0]
  secondPass.width = [H3_FL2VA.RESIZE_LAST_PASS2, 1]
  secondPass.height = [H3_FL2VA.RESIZE_LAST_PASS2, 2]

  setNode(workflow, H3_FL2VA.LATENT_UPSCALER, { 'mode.width': [H3_FL2VA.RESIZE_LAST_PASS2, 1], 'mode.height': [H3_FL2VA.RESIZE_LAST_PASS2, 2] })
}

function configureRtx(workflow: ComfyUIWorkflow, settings: H3Fl2vaSettings) {
  if (settings.rtxEnabled) {
    setNode(workflow, H3_FL2VA.RTX_SUPER_RES, { resize_type: settings.rtxResizeType, 'resize_type.scale': settings.rtxScale, quality: settings.rtxQuality })
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
