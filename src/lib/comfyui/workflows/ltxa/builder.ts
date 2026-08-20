import type { LtxaGenerationParams } from '../types';
import type { ComfyUIWorkflow } from '@/types';
import type {
  LtxaSettings,
} from '@/lib/database/system-settings';
import { LTXA_WORKFLOW_TEMPLATE } from './template';
import { LTXA } from './nodes';
import { createLogger } from '@/lib/logger';
import { getLtxaSettings } from '@/lib/database/system-settings';
import {
  generateSeed,
  setNode,
} from '../shared';
import {
  configureAdvancedLoraChain,
  configureIdLora,
  configureLtxMultimodalCfg,
  configureLtxOutput,
  configureLtxPromptAndGeneration,
  configureLtxRtx,
  configureLtxSchedulerAndNag,
  type LtxNodeOutput,
} from '../ltx-shared';

const log = createLogger('comfyui');
type ConditionPair = { positive: LtxNodeOutput; negative: LtxNodeOutput };

const LTXA_SHARED_NODES = {
  positivePrompt: LTXA.POSITIVE_PROMPT,
  negativePrompt: LTXA.NEGATIVE_PROMPT,
  videoConditioningPrompt: LTXA.VIDEO_CONDITIONING_PROMPT,
  audioConditioningPrompt: LTXA.AUDIO_CONDITIONING_PROMPT,
  samplerSelect: LTXA.SAMPLER_SELECT,
  duration: LTXA.DURATION,
  frameBase: LTXA.FRAME_BASE,
  frameRate: LTXA.FRAME_RATE,
  resizeStartImage: LTXA.RESIZE_START_IMAGE,
  loadImageStart: LTXA.LOAD_IMAGE_START,
  scheduler: LTXA.SCHEDULER,
  nag: LTXA.NAG,
  rtxSuperRes: LTXA.RTX_SUPER_RES,
  vaeDecode: LTXA.VAE_DECODE,
  videoCombine: LTXA.VIDEO_COMBINE,
} as const;

export async function buildLtxaWorkflow(
  params: LtxaGenerationParams
): Promise<ComfyUIWorkflow> {
  const settings = await getLtxaSettings();
  const workflow: ComfyUIWorkflow = structuredClone(LTXA_WORKFLOW_TEMPLATE);

  configureModels(workflow, settings);
  configureLtxPromptAndGeneration(workflow, LTXA_SHARED_NODES, params, settings);
  configurePreprocess(workflow, settings);
  configureLtxSchedulerAndNag(workflow, LTXA_SHARED_NODES, settings);
  configureLtxMultimodalCfg(workflow, LTXA.MULTIMODAL_CFG, settings);
  configureSecondPass(workflow, settings);
  configureModelPatchChain(workflow, settings);
  setNode(workflow, LTXA.NAG, {
    model: [LTXA.ATTENTION_TUNER, 0],
    nag_cond_video: [LTXA.VIDEO_CONDITIONING_PROMPT, 0],
    nag_cond_audio: [LTXA.AUDIO_CONDITIONING_PROMPT, 0],
  });
  const generalModelOutput = configureAdvancedLoraChain(
    workflow,
    params.isNSFW ? settings.nsfwLoraChain : settings.sfwLoraChain,
    [LTXA.NAG, 0]
  );
  const modelOutput = configureIdLora(
    workflow,
    LTXA.ID_LORA,
    settings.idLora,
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

  const baseConditions: ConditionPair = params.referenceAudio
    ? {
        positive: [LTXA.REFERENCE_AUDIO, 1],
        negative: [LTXA.REFERENCE_AUDIO, 2],
      }
    : {
        positive: [LTXA.CONDITIONING, 0],
        negative: [LTXA.CONDITIONING, 1],
      };
  const twoPassConditions = configureFirstPassGuide(workflow, settings, baseConditions);
  let secondPassGuideConditions = twoPassConditions;
  if (params.referenceAudio) {
    setNode(workflow, LTXA.SECOND_PASS_REFERENCE_AUDIO, twoPassConditions);
    secondPassGuideConditions = {
      positive: [LTXA.SECOND_PASS_REFERENCE_AUDIO, 1],
      negative: [LTXA.SECOND_PASS_REFERENCE_AUDIO, 2],
    };
  }
  configureSecondPassGuide(workflow, settings, secondPassGuideConditions);

  configureLtxRtx(workflow, LTXA_SHARED_NODES, settings);
  configureLtxOutput(workflow, LTXA.VIDEO_COMBINE, params.inputImage, 'LTXA', settings);
  configureForceFullUnloadVerbose(workflow, settings);

  setNode(workflow, LTXA.NOISE_SEED, { noise_seed: generateSeed() });

  log.debug('LTXA workflow built', {
    prompt: params.prompt.substring(0, 50),
    videoDuration: params.videoDuration,
    hasReferenceAudio: !!params.referenceAudio,
    isNSFW: !!params.isNSFW,
  });

  return workflow;
}

function configureModels(workflow: ComfyUIWorkflow, settings: LtxaSettings) {
  setNode(workflow, LTXA.UNET_LOADER, {
    unet_name: settings.unet,
    weight_dtype: settings.unetWeightDtype,
  });
  setNode(workflow, LTXA.VIDEO_VAE, { vae_name: settings.videoVae });
  setNode(workflow, LTXA.DUAL_CLIP, {
    clip_name1: settings.clipName1,
    clip_name2: settings.clipName2,
  });
  setNode(workflow, LTXA.AUDIO_VAE, { ckpt_name: settings.audioVae });
}

function configurePreprocess(workflow: ComfyUIWorkflow, settings: LtxaSettings) {
  const inputs = { img_compression: settings.preprocessImgCompression };
  setNode(workflow, LTXA.FIRST_PASS_PREPROCESS, inputs);
}

function configureFirstPassGuide(
  workflow: ComfyUIWorkflow,
  settings: LtxaSettings,
  conditions: ConditionPair
): ConditionPair {
  if (settings.guideEnabled) {
    setNode(workflow, LTXA.ADD_GUIDE, {
      frame_idx: settings.guideFrameIndex,
      strength: settings.guideStrength,
      crf: settings.guideCrf,
      blur_radius: settings.guideBlurRadius,
      interpolation: settings.guideInterpolation,
      crop: settings.guideCrop,
      positive: conditions.positive,
      negative: conditions.negative,
    });
    return {
      positive: [LTXA.CROP_GUIDES, 0],
      negative: [LTXA.CROP_GUIDES, 1],
    };
  }

  delete workflow[LTXA.ADD_GUIDE];
  delete workflow[LTXA.CROP_GUIDES];
  delete workflow[LTXA.FIRST_PASS_PREPROCESS];
  setNode(workflow, LTXA.MULTIMODAL_CFG, conditions);
  setNode(workflow, LTXA.CONCAT_AV, { video_latent: [LTXA.IMG_TO_VIDEO, 0] });
  setNode(workflow, LTXA.LATENT_UPSAMPLER, { samples: [LTXA.SEPARATE_AV, 0] });
  return conditions;
}

function configureSecondPassGuide(
  workflow: ComfyUIWorkflow,
  settings: LtxaSettings,
  conditions: ConditionPair
) {
  if (settings.secondPassGuideEnabled) {
    setNode(workflow, LTXA.SECOND_PASS_ADD_GUIDE, {
      frame_idx: settings.secondPassGuideFrameIndex,
      strength: settings.secondPassGuideStrength,
      crf: settings.secondPassGuideCrf,
      blur_radius: settings.secondPassGuideBlurRadius,
      interpolation: settings.secondPassGuideInterpolation,
      crop: settings.secondPassGuideCrop,
      positive: conditions.positive,
      negative: conditions.negative,
    });
    setNode(workflow, LTXA.SECOND_PASS_PREPROCESS, {
      img_compression: settings.preprocessImgCompression,
    });
    return;
  }

  delete workflow[LTXA.SECOND_PASS_ADD_GUIDE];
  delete workflow[LTXA.SECOND_PASS_CROP_GUIDES];
  delete workflow[LTXA.SECOND_PASS_PREPROCESS];
  setNode(workflow, LTXA.SECOND_PASS_CFG_GUIDER, conditions);
  setNode(workflow, LTXA.SECOND_PASS_CONCAT_AV, {
    video_latent: [LTXA.SECOND_PASS_IMG_TO_VIDEO, 0],
  });
  setNode(workflow, LTXA.VAE_DECODE, { samples: [LTXA.FINAL_SEPARATE_AV, 0] });
}

function configureSecondPass(workflow: ComfyUIWorkflow, settings: LtxaSettings) {
  setNode(workflow, LTXA.LATENT_UPSCALE_MODEL, {
    model_name: settings.latentUpscaleModel,
  });
  setNode(workflow, LTXA.SECOND_PASS_CFG_GUIDER, {
    cfg: settings.secondPassCfg,
  });
  setNode(workflow, LTXA.SECOND_PASS_SIGMAS, {
    sigmas: settings.secondPassSigmas,
  });
  setNode(workflow, LTXA.SECOND_PASS_SAMPLER_SELECT, {
    sampler_name: settings.secondPassSampler,
  });
  setNode(workflow, LTXA.SECOND_PASS_IMAGE_SCALE, {
    upscale_method: settings.secondPassUpscaleMethod,
    scale_by: settings.secondPassUpscaleBy,
  });
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
  firstPassModel: LtxNodeOutput,
  secondPassModel: LtxNodeOutput
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
}

function setDistilledLoraNode(
  workflow: ComfyUIWorkflow,
  nodeId: string,
  lora: {
    name: string;
    strength: number;
    model: LtxNodeOutput;
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

function handleReferenceAudio(
  workflow: ComfyUIWorkflow,
  audioFile: string,
  settings: LtxaSettings,
  modelOutput: LtxNodeOutput
): { firstPassModel: LtxNodeOutput; secondPassModel: LtxNodeOutput } {
  setNode(workflow, LTXA.LOAD_AUDIO, { audio: audioFile });
  setNode(workflow, LTXA.REFERENCE_AUDIO, {
    identity_guidance_scale: settings.identityGuidanceScale,
    start_percent: settings.identityStartPercent,
    end_percent: settings.identityEndPercent,
    model: modelOutput,
    positive: [LTXA.CONDITIONING, 0],
    negative: [LTXA.CONDITIONING, 1],
  });
  setNode(workflow, LTXA.SECOND_PASS_REFERENCE_AUDIO, {
    identity_guidance_scale: settings.secondPassIdentityGuidanceScale,
    start_percent: 0,
    end_percent: 1,
    model: modelOutput,
    reference_audio: [LTXA.LOAD_AUDIO, 0],
    audio_vae: [LTXA.AUDIO_VAE, 0],
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
}

function configureForceFullUnloadVerbose(
  workflow: ComfyUIWorkflow,
  settings: LtxaSettings
) {
  setNode(workflow, LTXA.VRAM_POST_COMBINE, {
    verbose: settings.forceFullUnloadVerbose,
  });
}
