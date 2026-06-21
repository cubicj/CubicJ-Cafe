import type { LtxaGenerationParams } from '../types';
import type { ComfyUIWorkflow } from '@/types';
import type {
  LtxAnchorSettings,
  LtxLoraChainItem,
  LtxaSettings,
} from '@/lib/database/system-settings';
import { LTXA_WORKFLOW_TEMPLATE } from './template';
import { LTXA } from './nodes';
import { createLogger } from '@/lib/logger';
import { getLtxaSettings } from '@/lib/database/system-settings';
import {
  generateSeed,
  extractBaseImageName,
  setNode,
  dumpWorkflow,
} from '../shared';

const log = createLogger('comfyui');
type NodeOutput = [string, number];

const END_IMAGE = {
  LOAD_IMAGE: '260',
  FRAME_INDEX: '261',
  RESIZE: '264',
} as const;

export async function buildLtxaWorkflow(
  params: LtxaGenerationParams
): Promise<ComfyUIWorkflow> {
  const settings = await getLtxaSettings();
  const workflow: ComfyUIWorkflow = JSON.parse(
    JSON.stringify(LTXA_WORKFLOW_TEMPLATE)
  );

  configureModels(workflow, settings);
  configurePrompts(workflow, params, settings);
  configureGeneration(workflow, params, settings);
  configurePreprocess(workflow, settings);
  configureScheduler(workflow, settings);
  configureNag(workflow, settings);
  configureGuide(workflow, settings);
  configureAnchor(workflow, settings);
  configureMultimodalCfg(workflow, settings);
  configureSecondPass(workflow, settings);
  configureModelPatchChain(workflow, settings);
  setNode(workflow, LTXA.NAG, {
    model: [LTXA.ATTENTION_TUNER, 0],
    nag_cond_video: [LTXA.VIDEO_CONDITIONING_PROMPT, 0],
    nag_cond_audio: [LTXA.AUDIO_CONDITIONING_PROMPT, 0],
  });
  const generalModelOutput = configureLoraChain(
    workflow,
    params.isNSFW ? settings.nsfwLoraChain : settings.sfwLoraChain,
    [LTXA.NAG, 0]
  );
  const modelOutput = configureIdLora(
    workflow,
    settings,
    generalModelOutput,
    !!params.referenceAudio
  );

  let firstPassDistilledBase = modelOutput;
  let secondPassDistilledBase = modelOutput;
  if (params.referenceAudio) {
    const referenceAudioOutputs = handleReferenceAudio(
      workflow,
      params.referenceAudio,
      settings,
      modelOutput
    );
    firstPassDistilledBase = referenceAudioOutputs.firstPassModel;
    secondPassDistilledBase = referenceAudioOutputs.secondPassModel;
  } else {
    handleReferenceAudioBypass(workflow);
  }
  configureDistilledLoras(workflow, settings, firstPassDistilledBase, secondPassDistilledBase);

  if (params.endImage) {
    handleEndImage(workflow, params.endImage, settings);
  } else {
    handleEndImageBypass(workflow);
  }

  configureRtx(workflow, settings);
  configureOutput(workflow, params, settings);

  setNode(workflow, LTXA.NOISE_SEED, { noise_seed: generateSeed() });

  log.info('LTXA workflow built', {
    prompt: params.prompt.substring(0, 50),
    hasEndImage: !!params.endImage,
    videoDuration: params.videoDuration,
    hasReferenceAudio: !!params.referenceAudio,
    isNSFW: !!params.isNSFW,
  });

  dumpWorkflow('ltxa', workflow);
  return workflow;
}

function configureModels(workflow: ComfyUIWorkflow, settings: LtxaSettings) {
  setNode(workflow, LTXA.CHECKPOINT, { ckpt_name: settings.checkpoint });
  setNode(workflow, LTXA.AUDIO_VAE, { ckpt_name: settings.audioVae });
  setNode(workflow, LTXA.TEXT_ENCODER, {
    text_encoder: settings.textEncoder,
    ckpt_name: settings.checkpoint,
  });
}

function configurePrompts(
  workflow: ComfyUIWorkflow,
  params: LtxaGenerationParams,
  settings: LtxaSettings
) {
  setNode(workflow, LTXA.POSITIVE_PROMPT, { text: params.prompt });
  setNode(workflow, LTXA.NEGATIVE_PROMPT, { text: settings.negativePrompt });
  setNode(workflow, LTXA.VIDEO_CONDITIONING_PROMPT, {
    text: settings.videoConditioningPrompt,
  });
  setNode(workflow, LTXA.AUDIO_CONDITIONING_PROMPT, {
    text: settings.audioConditioningPrompt,
  });
}

function configureGeneration(
  workflow: ComfyUIWorkflow,
  params: LtxaGenerationParams,
  settings: LtxaSettings
) {
  setNode(workflow, LTXA.SAMPLER_SELECT, {
    sampler_name: settings.sampler,
  });
  setNode(workflow, LTXA.DURATION, { value: params.videoDuration });
  setNode(workflow, LTXA.FRAME_BASE, { value: settings.frameBase });
  setNode(workflow, LTXA.FRAME_RATE, {
    number: Math.round(settings.frameRate),
    number_type: 'integer',
  });
  setNode(workflow, LTXA.RESIZE_START_IMAGE, {
    megapixels: settings.megapixels,
    multiple_of: settings.resizeMultipleOf,
    upscale_method: settings.resizeUpscaleMethod,
  });
  setNode(workflow, LTXA.LOAD_IMAGE_START, { image: params.inputImage });
}

function configurePreprocess(workflow: ComfyUIWorkflow, settings: LtxaSettings) {
  const inputs = { img_compression: settings.preprocessImgCompression };
  setNode(workflow, LTXA.FIRST_PASS_PREPROCESS, inputs);
  setNode(workflow, LTXA.SECOND_PASS_PREPROCESS, inputs);
}

function configureScheduler(workflow: ComfyUIWorkflow, settings: LtxaSettings) {
  setNode(workflow, LTXA.SCHEDULER, {
    steps: settings.schedulerSteps,
    max_shift: settings.schedulerMaxShift,
    base_shift: settings.schedulerBaseShift,
    stretch: settings.schedulerStretch,
    terminal: settings.schedulerTerminal,
  });
}

function configureNag(workflow: ComfyUIWorkflow, settings: LtxaSettings) {
  setNode(workflow, LTXA.NAG, {
    nag_scale: settings.nagScale,
    nag_alpha: settings.nagAlpha,
    nag_tau: settings.nagTau,
  });
}

function configureGuide(workflow: ComfyUIWorkflow, settings: LtxaSettings) {
  const guideInputs = {
    frame_idx: settings.guideFrameIndex,
    strength: settings.guideStrength,
    crf: settings.guideCrf,
    blur_radius: settings.guideBlurRadius,
    interpolation: settings.guideInterpolation,
    crop: settings.guideCrop,
  };
  setNode(workflow, LTXA.ADD_GUIDE, guideInputs);
  setNode(workflow, LTXA.SECOND_PASS_ADD_GUIDE, guideInputs);
}

function configureAnchor(workflow: ComfyUIWorkflow, settings: LtxaSettings) {
  setAnchorNode(workflow, LTXA.ANCHOR, {
    strength: settings.anchorStrength,
    cacheAtStep: settings.anchorCacheAtStep,
    similarityThreshold: settings.anchorSimilarityThreshold,
    decayWithDistance: settings.anchorDecayWithDistance,
    energyThreshold: settings.anchorEnergyThreshold,
    bypass: settings.anchorBypass,
    debug: settings.anchorDebug,
    advancedMode: settings.anchorAdvancedMode,
    cacheMode: settings.anchorCacheMode,
    forwardsPerStep: settings.anchorForwardsPerStep,
    cacheWarmup: settings.anchorCacheWarmup,
    anchorFrame: settings.anchorFrame,
    depthCurve: settings.anchorDepthCurve,
    blockIndexFilter: settings.anchorBlockIndexFilter,
  });
}

function configureMultimodalCfg(
  workflow: ComfyUIWorkflow,
  settings: LtxaSettings
) {
  setNode(workflow, LTXA.MULTIMODAL_CFG, {
    video_cfg: settings.multimodalVideoCfg,
    audio_cfg: settings.multimodalAudioCfg,
    inactive_cfg: settings.multimodalInactiveCfg,
    active_steps: settings.multimodalActiveSteps,
  });
}

function configureSecondPass(workflow: ComfyUIWorkflow, settings: LtxaSettings) {
  setNode(workflow, LTXA.TEXT_ATTENTION, {
    text_amplification: settings.textAttentionAmplification,
  });
  setNode(workflow, LTXA.LATENT_UPSCALE_MODEL, {
    model_name: settings.latentUpscaleModel,
  });
  setNode(workflow, LTXA.SECOND_PASS_CFG_GUIDER, {
    cfg: settings.secondPassCfg,
    model: [LTXA.TEXT_ATTENTION, 0],
    positive: [LTXA.SECOND_PASS_ADD_GUIDE, 0],
    negative: [LTXA.SECOND_PASS_ADD_GUIDE, 1],
  });
  setNode(workflow, LTXA.SECOND_PASS_SIGMAS, {
    sigmas: settings.secondPassSigmas,
  });
  setNode(workflow, LTXA.SECOND_PASS_IMAGE_SCALE, {
    upscale_method: settings.secondPassUpscaleMethod,
    scale_by: settings.secondPassUpscaleBy,
  });
  delete workflow[LTXA.SECOND_PASS_ANCHOR];
}

function configureModelPatchChain(
  workflow: ComfyUIWorkflow,
  settings: LtxaSettings
) {
  setNode(workflow, LTXA.MODEL_SAGE_PATCH, {
    sage_attention: settings.sageAttention,
    allow_compile: settings.sageAllowCompile,
  });
  setNode(workflow, LTXA.MEMORY_SAGE_PATCH, {
    triton_kernels: settings.memorySageTritonKernels,
  });
  setNode(workflow, LTXA.TORCH_SETTINGS, {
    enable_fp16_accumulation: settings.torchFp16Accumulation,
  });
  setNode(workflow, LTXA.CHUNK_FEED_FORWARD, {
    dim_threshold: settings.chunkFeedForwardDimThreshold,
  });
  setNode(workflow, LTXA.ATTENTION_TUNER, {
    video_scale: settings.attentionTunerVideoScale,
    video_to_audio_scale: settings.attentionTunerVideoToAudioScale,
    audio_scale: settings.attentionTunerAudioScale,
    audio_to_video_scale: settings.attentionTunerAudioToVideoScale,
    blocks: settings.attentionTunerBlocks,
    triton_kernels: settings.attentionTunerTritonKernels,
  });
}

function configureDistilledLoras(
  workflow: ComfyUIWorkflow,
  settings: LtxaSettings,
  firstPassModel: NodeOutput,
  secondPassModel: NodeOutput
) {
  setDistilledLoraNode(workflow, LTXA.FIRST_PASS_DISTILLED_LORA, {
    name: settings.firstPassDistilledLoraName,
    strength: settings.firstPassDistilledLoraStrength,
    model: firstPassModel,
    title: '1 Pass Distilled LoRA',
  });
  setDistilledLoraNode(workflow, LTXA.SECOND_PASS_DISTILLED_LORA, {
    name: settings.secondPassDistilledLoraName,
    strength: settings.secondPassDistilledLoraStrength,
    model: secondPassModel,
    title: '2 Pass Distilled LoRA',
  });
  setNode(workflow, LTXA.ANCHOR, {
    model: [LTXA.FIRST_PASS_DISTILLED_LORA, 0],
  });
  setNode(workflow, LTXA.TEXT_ATTENTION, {
    model: [LTXA.SECOND_PASS_DISTILLED_LORA, 0],
  });
}

function setDistilledLoraNode(
  workflow: ComfyUIWorkflow,
  nodeId: string,
  lora: {
    name: string;
    strength: number;
    model: NodeOutput;
    title: string;
  }
) {
  workflow[nodeId] = {
    inputs: {
      lora_name: lora.name,
      strength_model: lora.strength,
      video: 1,
      video_to_audio: 1,
      audio: 1,
      audio_to_video: 1,
      other: 1,
      model: lora.model,
    },
    class_type: 'LTX2LoraLoaderAdvanced',
    _meta: { title: lora.title },
  };
}

function setAnchorNode(
  workflow: ComfyUIWorkflow,
  nodeId: string,
  settings: LtxAnchorSettings
) {
  setNode(workflow, nodeId, {
    strength: settings.strength,
    cache_at_step: settings.cacheAtStep,
    similarity_threshold: settings.similarityThreshold,
    decay_with_distance: settings.decayWithDistance,
    energy_threshold: settings.energyThreshold,
    bypass: settings.bypass,
    debug: settings.debug,
    advanced_mode: settings.advancedMode,
    cache_mode: settings.cacheMode,
    forwards_per_step: settings.forwardsPerStep,
    cache_warmup: settings.cacheWarmup,
    anchor_frame: settings.anchorFrame,
    depth_curve: settings.depthCurve,
    block_index_filter: settings.blockIndexFilter,
  });
}

function configureLoraChain(
  workflow: ComfyUIWorkflow,
  loras: LtxLoraChainItem[],
  baseModel: NodeOutput
): NodeOutput {
  let model: NodeOutput = baseModel;
  let nextNodeId = 7000;

  for (const slot of loras) {
    if (!slot.enabled) {
      continue;
    }

    const nodeId = String(nextNodeId);
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
    };
    model = [nodeId, 0];
    nextNodeId += 1;
  }

  return model;
}

function configureIdLora(
  workflow: ComfyUIWorkflow,
  settings: LtxaSettings,
  modelOutput: NodeOutput,
  hasReferenceAudio: boolean
): NodeOutput {
  const slot = settings.idLora;
  if (
    !hasReferenceAudio ||
    !slot.enabled ||
    slot.name === 'CONFIGURE_IN_ADMIN'
  ) {
    delete workflow[LTXA.ID_LORA];
    return modelOutput;
  }

  workflow[LTXA.ID_LORA] = {
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
  };

  return [LTXA.ID_LORA, 0];
}

function handleReferenceAudio(
  workflow: ComfyUIWorkflow,
  audioFile: string,
  settings: LtxaSettings,
  modelOutput: NodeOutput
): { firstPassModel: NodeOutput; secondPassModel: NodeOutput } {
  setNode(workflow, LTXA.LOAD_AUDIO, { audio: audioFile });
  setNode(workflow, LTXA.REFERENCE_AUDIO, {
    identity_guidance_scale: settings.identityGuidanceScale,
    start_percent: settings.identityStartPercent,
    end_percent: settings.identityEndPercent,
    model: modelOutput,
    positive: [LTXA.CONDITIONING, 0],
    negative: [LTXA.CONDITIONING, 1],
  });
  setNode(workflow, LTXA.ADD_GUIDE, {
    positive: [LTXA.REFERENCE_AUDIO, 1],
    negative: [LTXA.REFERENCE_AUDIO, 2],
  });
  setNode(workflow, LTXA.SECOND_PASS_REFERENCE_AUDIO, {
    identity_guidance_scale: 0,
    start_percent: 0,
    end_percent: 1,
    model: modelOutput,
    positive: [LTXA.CROP_GUIDES, 0],
    negative: [LTXA.CROP_GUIDES, 1],
    reference_audio: [LTXA.LOAD_AUDIO, 0],
    audio_vae: [LTXA.AUDIO_VAE, 0],
  });
  setNode(workflow, LTXA.SECOND_PASS_REFERENCE_CROP, {
    positive: [LTXA.SECOND_PASS_REFERENCE_AUDIO, 1],
    negative: [LTXA.SECOND_PASS_REFERENCE_AUDIO, 2],
    latent: [LTXA.FINAL_SEPARATE_AV, 0],
  });
  setNode(workflow, LTXA.SECOND_PASS_CFG_GUIDER, {
    positive: [LTXA.SECOND_PASS_REFERENCE_AUDIO, 1],
    negative: [LTXA.SECOND_PASS_REFERENCE_AUDIO, 2],
  });
  return {
    firstPassModel: [LTXA.REFERENCE_AUDIO, 0],
    secondPassModel: [LTXA.SECOND_PASS_REFERENCE_AUDIO, 0],
  };
}

function handleReferenceAudioBypass(workflow: ComfyUIWorkflow) {
  delete workflow[LTXA.LOAD_AUDIO];
  delete workflow[LTXA.REFERENCE_AUDIO];
  delete workflow[LTXA.ID_LORA];
  delete workflow[LTXA.SECOND_PASS_REFERENCE_AUDIO];
  setNode(workflow, LTXA.ADD_GUIDE, {
    positive: [LTXA.CONDITIONING, 0],
    negative: [LTXA.CONDITIONING, 1],
  });
  setNode(workflow, LTXA.SECOND_PASS_REFERENCE_CROP, {
    positive: [LTXA.CROP_GUIDES, 0],
    negative: [LTXA.CROP_GUIDES, 1],
    latent: [LTXA.FINAL_SEPARATE_AV, 0],
  });
}

function handleEndImage(
  workflow: ComfyUIWorkflow,
  endImage: string,
  settings: LtxaSettings
) {
  workflow[END_IMAGE.LOAD_IMAGE] = {
    inputs: { image: endImage },
    class_type: 'LoadImage',
    _meta: { title: 'End Image' },
  };
  workflow[END_IMAGE.FRAME_INDEX] = {
    inputs: { expression: 'a - 1', a: [LTXA.FRAME_COUNT_MATH, 0] },
    class_type: 'MathExpression|pysssss',
    _meta: { title: 'End Frame Index' },
  };
  workflow[END_IMAGE.RESIZE] = {
    inputs: {
      megapixels: settings.megapixels,
      multiple_of: settings.resizeMultipleOf,
      upscale_method: settings.resizeUpscaleMethod,
      image: [END_IMAGE.LOAD_IMAGE, 0],
    },
    class_type: 'ResizeImageToMegapixels',
    _meta: { title: 'Resize End Image' },
  };
  setNode(workflow, LTXA.IMG_TO_VIDEO, {
    num_images: '2',
    'num_images.image_2': [END_IMAGE.RESIZE, 0],
    'num_images.index_2': [END_IMAGE.FRAME_INDEX, 0],
    'num_images.strength_2': 1,
  });
  setNode(workflow, LTXA.SECOND_PASS_IMG_TO_VIDEO, {
    num_images: '2',
    'num_images.image_2': [END_IMAGE.RESIZE, 0],
    'num_images.index_2': [END_IMAGE.FRAME_INDEX, 0],
    'num_images.strength_2': 1,
  });
}

function handleEndImageBypass(workflow: ComfyUIWorkflow) {
  for (const nodeId of [LTXA.IMG_TO_VIDEO, LTXA.SECOND_PASS_IMG_TO_VIDEO]) {
    const imgToVideo = workflow[nodeId];
    if (imgToVideo?.inputs) {
      imgToVideo.inputs['num_images'] = '1';
      delete imgToVideo.inputs['num_images.image_2'];
      delete imgToVideo.inputs['num_images.index_2'];
      delete imgToVideo.inputs['num_images.strength_2'];
    }
  }
  delete workflow[END_IMAGE.LOAD_IMAGE];
  delete workflow[END_IMAGE.FRAME_INDEX];
  delete workflow[END_IMAGE.RESIZE];
}

function configureRtx(workflow: ComfyUIWorkflow, settings: LtxaSettings) {
  if (settings.rtxEnabled) {
    setNode(workflow, LTXA.RTX_SUPER_RES, {
      resize_type: settings.rtxResizeType,
      'resize_type.scale': settings.rtxScale,
      quality: settings.rtxQuality,
      images: [LTXA.VAE_DECODE, 0],
    });
    setNode(workflow, LTXA.VIDEO_COMBINE, { images: [LTXA.RTX_SUPER_RES, 0] });
    return;
  }

  delete workflow[LTXA.RTX_SUPER_RES];
  setNode(workflow, LTXA.VIDEO_COMBINE, { images: [LTXA.VAE_DECODE, 0] });
}

function configureOutput(
  workflow: ComfyUIWorkflow,
  params: LtxaGenerationParams,
  settings: LtxaSettings
) {
  setNode(workflow, LTXA.VIDEO_COMBINE, {
    crf: settings.videoCrf,
    format: settings.videoFormat,
    pix_fmt: settings.videoPixFmt,
    filename_prefix: `LTXA/${extractBaseImageName(params.inputImage)}`,
  });
}
