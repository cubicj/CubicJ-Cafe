import type { ComfyUIWorkflow } from '@/types'
import type { WanGenerationParams } from '../types'
import type { WanSettings } from '@/lib/database/system-settings'
import { WAN_WORKFLOW_TEMPLATE } from './template'
import { WAN } from './nodes'
import { createLogger } from '@/lib/logger'
import { getWanSettings } from '@/lib/database/system-settings'
import { generateSeed, extractBaseImageName, setNode, dumpWorkflow } from '../shared'

const log = createLogger('comfyui')

export async function buildWanWorkflow(params: WanGenerationParams): Promise<ComfyUIWorkflow> {
  const settings = await getWanSettings()
  const workflow = JSON.parse(JSON.stringify(WAN_WORKFLOW_TEMPLATE)) as ComfyUIWorkflow

  configureModels(workflow, settings)
  configureBlockSwap(workflow, settings)
  configureContextOptions(workflow, settings)
  configureSamplers(workflow, settings)
  configureSigmas(workflow, settings)
  configureNag(workflow, settings)
  configureResize(workflow, settings)
  configureDuration(workflow, params, settings)
  configurePrompts(workflow, params, settings)
  configureRtx(workflow, settings)
  configureOutput(workflow, params, settings)

  setNode(workflow, WAN.LOAD_IMAGE_START, { image: params.inputImage })
  if (params.endImage) {
    setNode(workflow, WAN.LOAD_IMAGE_END, { image: params.endImage })
  } else {
    handleEndImageBypass(workflow)
  }

  log.info('WAN workflow built', {
    prompt: params.prompt.substring(0, 50),
    hasEndImage: !!params.endImage,
    videoDuration: params.videoDuration,
  })

  dumpWorkflow('wan', workflow)
  return workflow
}

function configureModels(workflow: ComfyUIWorkflow, settings: WanSettings) {
  const commonLoader = {
    base_precision: settings.basePrecision,
    quantization: settings.quantization,
    attention_mode: settings.attentionMode,
  }
  setNode(workflow, WAN.MODEL_LOADER_HIGH, { ...commonLoader, model: settings.wanvideoModelHigh })
  setNode(workflow, WAN.MODEL_LOADER_LOW, { ...commonLoader, model: settings.wanvideoModelLow })
  setNode(workflow, WAN.VAE_LOADER, { model_name: settings.wanvideoVae })
  setNode(workflow, WAN.T5_LOADER, { model_name: settings.t5Encoder })
  setNode(workflow, WAN.CLIP_VISION_LOADER, { model_name: settings.clipVisionModel })
}

function configureBlockSwap(workflow: ComfyUIWorkflow, settings: WanSettings) {
  setNode(workflow, WAN.BLOCK_SWAP, {
    blocks_to_swap: settings.blocksToSwap,
    offload_img_emb: settings.offloadImgEmb,
    offload_txt_emb: settings.offloadTxtEmb,
    vace_blocks_to_swap: settings.vaceBlocksToSwap,
    prefetch_blocks: settings.prefetchBlocks,
  })
}

function configureContextOptions(workflow: ComfyUIWorkflow, settings: WanSettings) {
  setNode(workflow, WAN.CONTEXT_OPTIONS, {
    context_frames: settings.contextFrames,
    context_stride: settings.contextStride,
    context_overlap: settings.contextOverlap,
    fuse_method: settings.fuseMethod,
  })
}

function configureSamplers(workflow: ComfyUIWorkflow, settings: WanSettings) {
  const shared = {
    steps: settings.samplerSteps,
    shift: settings.shift,
    scheduler: settings.scheduler,
    end_step: settings.samplerSteps,
  }
  setNode(workflow, WAN.SAMPLER_HIGH, { ...shared, seed: generateSeed() })
  setNode(workflow, WAN.SAMPLER_LOW, { ...shared, seed: generateSeed() })
  setNode(workflow, WAN.OVERALL_STEPS, { number: settings.samplerSteps * 2 })
  setNode(workflow, WAN.SPLIT_STEPS, { number: settings.samplerSteps })
}

function configureSigmas(workflow: ComfyUIWorkflow, settings: WanSettings) {
  setNode(workflow, WAN.SIGMAS_HIGH, { sigmas: settings.sigmasHigh })
  setNode(workflow, WAN.SIGMAS_LOW, { sigmas: settings.sigmasLow })
}

function configureNag(workflow: ComfyUIWorkflow, settings: WanSettings) {
  setNode(workflow, WAN.APPLY_NAG, {
    nag_scale: settings.nagScale,
    nag_alpha: settings.nagAlpha,
    nag_tau: settings.nagTau,
  })
}

function configureResize(workflow: ComfyUIWorkflow, settings: WanSettings) {
  const resize = {
    megapixels: settings.megapixels,
    multiple_of: settings.resizeMultipleOf,
    upscale_method: settings.resizeUpscaleMethod,
  }
  setNode(workflow, WAN.RESIZE_START_IMAGE, resize)
  setNode(workflow, WAN.RESIZE_END_IMAGE, resize)
}

function configureDuration(workflow: ComfyUIWorkflow, params: WanGenerationParams, settings: WanSettings) {
  setNode(workflow, WAN.FPS, { number: settings.frameRate })
  setNode(workflow, WAN.SECONDS, { number: params.videoDuration })
  setNode(workflow, WAN.MULTIPLIER, { number: 1 })
}

function configurePrompts(workflow: ComfyUIWorkflow, params: WanGenerationParams, settings: WanSettings) {
  setNode(workflow, WAN.POSITIVE_PROMPT, { text: params.prompt })
  setNode(workflow, WAN.NEGATIVE_PROMPT, { text: settings.negativePrompt })
}

function configureRtx(workflow: ComfyUIWorkflow, settings: WanSettings) {
  if (settings.rtxEnabled) {
    setNode(workflow, WAN.RTX_SUPER_RES, {
      resize_type: settings.rtxResizeType,
      'resize_type.scale': settings.rtxScale,
      quality: settings.rtxQuality,
    })
    setNode(workflow, WAN.VIDEO_COMBINE, { images: [WAN.RTX_SUPER_RES, 0] })
    return
  }
  delete workflow[WAN.RTX_SUPER_RES]
  setNode(workflow, WAN.VIDEO_COMBINE, { images: [WAN.VRAM_POST_DECODE, 0] })
}

function configureOutput(workflow: ComfyUIWorkflow, params: WanGenerationParams, settings: WanSettings) {
  setNode(workflow, WAN.VIDEO_COMBINE, {
    crf: settings.videoCrf,
    format: settings.videoFormat,
    pix_fmt: settings.videoPixFmt,
  })
  if (params.inputImage) {
    setNode(workflow, WAN.VIDEO_COMBINE, {
      filename_prefix: `WAN/${extractBaseImageName(params.inputImage)}`,
    })
  }
}

function handleEndImageBypass(workflow: ComfyUIWorkflow) {
  delete workflow[WAN.LOAD_IMAGE_END]
  delete workflow[WAN.RESIZE_END_IMAGE]
  const encode = workflow[WAN.IMG_TO_VIDEO_ENCODE]
  if (encode?.inputs) {
    delete encode.inputs.end_image
  }
}
