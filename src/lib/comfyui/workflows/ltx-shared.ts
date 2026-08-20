import type { LtxLoraChainItem } from '@/lib/database/system-settings'
import type { LtxLoraSlotSettings } from '@/lib/database/system-settings/common'
import type { ComfyUIWorkflow } from '@/types'
import { extractBaseImageName, setNode } from './shared'

export type LtxNodeOutput = [string, number]

type PromptGenerationNodes = {
  positivePrompt: string
  negativePrompt: string
  videoConditioningPrompt: string
  audioConditioningPrompt: string
  samplerSelect: string
  duration: string
  frameBase: string
  frameRate: string
  resizeStartImage: string
  loadImageStart: string
}

type PromptGenerationParams = {
  prompt: string
  inputImage: string
  videoDuration: number
}

type PromptGenerationSettings = {
  negativePrompt: string
  videoConditioningPrompt: string
  audioConditioningPrompt: string
  sampler: string
  frameBase: number
  frameRate: number
  megapixels: number
  resizeMultipleOf: number
  resizeUpscaleMethod: string
}

type SchedulerNagNodes = {
  scheduler: string
  nag: string
}

type SchedulerNagSettings = {
  schedulerSteps: number
  schedulerMaxShift: number
  schedulerBaseShift: number
  schedulerStretch: boolean
  schedulerTerminal: number
  nagScale: number
  nagAlpha: number
  nagTau: number
}

type MultimodalCfgSettings = {
  multimodalVideoCfg: number
  multimodalAudioCfg: number
  multimodalInactiveCfg: number
  multimodalActiveSteps: number
}

type RtxNodes = {
  rtxSuperRes: string
  vaeDecode: string
  videoCombine: string
}

type RtxSettings = {
  rtxEnabled: boolean
  rtxResizeType: string
  rtxScale: number
  rtxQuality: string
}

type OutputSettings = {
  videoCrf: number
  videoFormat: string
  videoPixFmt: string
}

export function configureLtxPromptAndGeneration(
  workflow: ComfyUIWorkflow,
  nodes: PromptGenerationNodes,
  params: PromptGenerationParams,
  settings: PromptGenerationSettings
) {
  setNode(workflow, nodes.positivePrompt, { text: params.prompt })
  setNode(workflow, nodes.negativePrompt, { text: settings.negativePrompt })
  setNode(workflow, nodes.videoConditioningPrompt, {
    text: settings.videoConditioningPrompt,
  })
  setNode(workflow, nodes.audioConditioningPrompt, {
    text: settings.audioConditioningPrompt,
  })
  setNode(workflow, nodes.samplerSelect, {
    sampler_name: settings.sampler,
  })
  setNode(workflow, nodes.duration, { value: params.videoDuration })
  setNode(workflow, nodes.frameBase, { value: settings.frameBase })
  setNode(workflow, nodes.frameRate, {
    number: Math.round(settings.frameRate),
    number_type: 'integer',
  })
  setNode(workflow, nodes.resizeStartImage, {
    megapixels: settings.megapixels,
    multiple_of: settings.resizeMultipleOf,
    upscale_method: settings.resizeUpscaleMethod,
  })
  setNode(workflow, nodes.loadImageStart, { image: params.inputImage })
}

export function configureLtxSchedulerAndNag(
  workflow: ComfyUIWorkflow,
  nodes: SchedulerNagNodes,
  settings: SchedulerNagSettings
) {
  setNode(workflow, nodes.scheduler, {
    steps: settings.schedulerSteps,
    max_shift: settings.schedulerMaxShift,
    base_shift: settings.schedulerBaseShift,
    stretch: settings.schedulerStretch,
    terminal: settings.schedulerTerminal,
  })
  setNode(workflow, nodes.nag, {
    nag_scale: settings.nagScale,
    nag_alpha: settings.nagAlpha,
    nag_tau: settings.nagTau,
  })
}

export function configureLtxMultimodalCfg(
  workflow: ComfyUIWorkflow,
  nodeId: string,
  settings: MultimodalCfgSettings
) {
  setNode(workflow, nodeId, {
    video_cfg: settings.multimodalVideoCfg,
    audio_cfg: settings.multimodalAudioCfg,
    inactive_cfg: settings.multimodalInactiveCfg,
    active_steps: settings.multimodalActiveSteps,
  })
}

export function configureAdvancedLoraChain(
  workflow: ComfyUIWorkflow,
  loras: LtxLoraChainItem[],
  baseModel: LtxNodeOutput
): LtxNodeOutput {
  let model: LtxNodeOutput = baseModel
  let nextNodeId = 7000

  for (const slot of loras) {
    if (!slot.enabled) {
      continue
    }

    const nodeId = String(nextNodeId)
    workflow[nodeId] = {
      inputs: {
        lora_name: slot.name,
        strength_model: slot.strength,
        video: slot.video,
        video_to_audio: slot.videoToAudio,
        audio: slot.audio,
        audio_to_video: slot.audioToVideo,
        other: slot.other,
        model,
      },
      class_type: 'LTX2LoraLoaderAdvanced',
      _meta: { title: 'LTX2 LoRA Loader Advanced' },
    }
    model = [nodeId, 0]
    nextNodeId += 1
  }

  return model
}

export function configureIdLora(
  workflow: ComfyUIWorkflow,
  nodeId: string,
  slot: LtxLoraSlotSettings,
  modelOutput: LtxNodeOutput,
  hasReferenceAudio: boolean
): LtxNodeOutput {
  if (
    !hasReferenceAudio ||
    !slot.enabled ||
    slot.name === 'CONFIGURE_IN_ADMIN'
  ) {
    delete workflow[nodeId]
    return modelOutput
  }

  workflow[nodeId] = {
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

  return [nodeId, 0]
}

export function configureLtxRtx(
  workflow: ComfyUIWorkflow,
  nodes: RtxNodes,
  settings: RtxSettings
) {
  if (settings.rtxEnabled) {
    setNode(workflow, nodes.rtxSuperRes, {
      resize_type: settings.rtxResizeType,
      'resize_type.scale': settings.rtxScale,
      quality: settings.rtxQuality,
      images: [nodes.vaeDecode, 0],
    })
    setNode(workflow, nodes.videoCombine, {
      images: [nodes.rtxSuperRes, 0],
    })
    return
  }

  delete workflow[nodes.rtxSuperRes]
  setNode(workflow, nodes.videoCombine, { images: [nodes.vaeDecode, 0] })
}

export function configureLtxOutput(
  workflow: ComfyUIWorkflow,
  videoCombineNodeId: string,
  inputImage: string,
  filenameDirectory: string,
  settings: OutputSettings
) {
  setNode(workflow, videoCombineNodeId, {
    crf: settings.videoCrf,
    format: settings.videoFormat,
    pix_fmt: settings.videoPixFmt,
    filename_prefix: `${filenameDirectory}/${extractBaseImageName(inputImage)}`,
  })
}
