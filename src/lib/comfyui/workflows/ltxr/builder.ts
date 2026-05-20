import type { LtxrGenerationParams } from '../types';
import type { ComfyUIWorkflow } from '@/types';
import type {
  LtxAnchorSettings,
  LtxLoraChainItem,
  LtxrSettings,
} from '@/lib/database/system-settings';
import { LTXR_WORKFLOW_TEMPLATE } from './template';
import { LTXR } from './nodes';
import { createLogger } from '@/lib/logger';
import { getLtxrSettings } from '@/lib/database/system-settings';
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

export async function buildLtxrWorkflow(
  params: LtxrGenerationParams
): Promise<ComfyUIWorkflow> {
  const settings = await getLtxrSettings();
  const workflow: ComfyUIWorkflow = JSON.parse(
    JSON.stringify(LTXR_WORKFLOW_TEMPLATE)
  );

  configureModels(workflow, settings);
  configurePrompts(workflow, params, settings);
  configureGeneration(workflow, params, settings);
  configureScheduler(workflow, settings);
  configureNag(workflow, settings);
  configureGuide(workflow, settings);
  configureAnchor(workflow, settings);
  configureMultimodalCfg(workflow, settings);
  configureSecondPass(workflow, settings);
  configureSageAttention(workflow, settings);
  const generalModelOutput = configureLoraChain(
    workflow,
    settings.sfwLoraChain
  );
  setNode(workflow, LTXR.NAG, {
    model: generalModelOutput,
    nag_cond_video: [LTXR.VIDEO_CONDITIONING_PROMPT, 0],
    nag_cond_audio: [LTXR.AUDIO_CONDITIONING_PROMPT, 0],
  });
  const nagModelOutput: NodeOutput = [LTXR.NAG, 0];
  const modelOutput = configureIdLora(
    workflow,
    settings,
    nagModelOutput,
    !!params.referenceAudio
  );

  if (params.referenceAudio) {
    handleReferenceAudio(
      workflow,
      params.referenceAudio,
      settings,
      modelOutput
    );
  } else {
    handleReferenceAudioBypass(workflow);
  }

  if (params.endImage) {
    handleEndImage(workflow, params.endImage, settings);
  } else {
    handleEndImageBypass(workflow);
  }

  configureRtx(workflow, settings);
  configureWatermark(workflow, params, settings);
  configureOutput(workflow, params, settings);

  setNode(workflow, LTXR.NOISE_SEED, { noise_seed: generateSeed() });

  log.info('LTXR workflow built', {
    prompt: params.prompt.substring(0, 50),
    hasEndImage: !!params.endImage,
    videoDuration: params.videoDuration,
    hasReferenceAudio: !!params.referenceAudio,
    isNSFW: !!params.isNSFW,
    hasWatermark: settings.watermarkEnabled,
  });

  dumpWorkflow('ltxr', workflow);
  return workflow;
}

function configureModels(workflow: ComfyUIWorkflow, settings: LtxrSettings) {
  setNode(workflow, LTXR.CHECKPOINT, { ckpt_name: settings.checkpoint });
  setNode(workflow, LTXR.AUDIO_VAE, { ckpt_name: settings.checkpoint });
  setNode(workflow, LTXR.TEXT_ENCODER, {
    text_encoder: settings.textEncoder,
    ckpt_name: settings.checkpoint,
  });
}

function configurePrompts(
  workflow: ComfyUIWorkflow,
  params: LtxrGenerationParams,
  settings: LtxrSettings
) {
  setNode(workflow, LTXR.POSITIVE_PROMPT, { text: params.prompt });
  setNode(workflow, LTXR.NEGATIVE_PROMPT, { text: settings.negativePrompt });
  setNode(workflow, LTXR.VIDEO_CONDITIONING_PROMPT, {
    text: settings.videoConditioningPrompt,
  });
  setNode(workflow, LTXR.AUDIO_CONDITIONING_PROMPT, {
    text: settings.audioConditioningPrompt,
  });
}

function configureGeneration(
  workflow: ComfyUIWorkflow,
  params: LtxrGenerationParams,
  settings: LtxrSettings
) {
  setNode(workflow, LTXR.CLOWN_SAMPLER, {
    sampler_name: settings.sampler,
    eta: settings.clownEta,
    seed: generateSeed(),
    bongmath: settings.clownBongmath,
  });
  setNode(workflow, LTXR.DURATION, { value: params.videoDuration });
  setNode(workflow, LTXR.FRAME_BASE, { value: settings.frameBase });
  setNode(workflow, LTXR.FRAME_RATE, { value: Math.round(settings.frameRate) });
  setNode(workflow, LTXR.RESIZE_START_IMAGE, {
    megapixels: settings.megapixels,
    multiple_of: settings.resizeMultipleOf,
    upscale_method: settings.resizeUpscaleMethod,
  });
  setNode(workflow, LTXR.LOAD_IMAGE_START, { image: params.inputImage });
}

function configureScheduler(workflow: ComfyUIWorkflow, settings: LtxrSettings) {
  setNode(workflow, LTXR.SCHEDULER, {
    steps: settings.schedulerSteps,
    max_shift: settings.schedulerMaxShift,
    base_shift: settings.schedulerBaseShift,
    stretch: settings.schedulerStretch,
    terminal: settings.schedulerTerminal,
  });
}

function configureNag(workflow: ComfyUIWorkflow, settings: LtxrSettings) {
  setNode(workflow, LTXR.NAG, {
    nag_scale: settings.nagScale,
    nag_alpha: settings.nagAlpha,
    nag_tau: settings.nagTau,
  });
}

function configureGuide(workflow: ComfyUIWorkflow, settings: LtxrSettings) {
  const guideInputs = {
    frame_idx: settings.guideFrameIndex,
    strength: settings.guideStrength,
    crf: settings.guideCrf,
    blur_radius: settings.guideBlurRadius,
    interpolation: settings.guideInterpolation,
    crop: settings.guideCrop,
  };
  setNode(workflow, LTXR.ADD_GUIDE, guideInputs);
  setNode(workflow, LTXR.SECOND_PASS_ADD_GUIDE, guideInputs);
}

function configureAnchor(workflow: ComfyUIWorkflow, settings: LtxrSettings) {
  setAnchorNode(workflow, LTXR.ANCHOR, {
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
  settings: LtxrSettings
) {
  setNode(workflow, LTXR.MULTIMODAL_CFG, {
    video_cfg: settings.multimodalVideoCfg,
    audio_cfg: settings.multimodalAudioCfg,
    inactive_cfg: settings.multimodalInactiveCfg,
    active_steps: settings.multimodalActiveSteps,
  });
}

function configureSecondPass(workflow: ComfyUIWorkflow, settings: LtxrSettings) {
  setNode(workflow, LTXR.TEXT_ATTENTION, {
    text_amplification: settings.textAttentionAmplification,
  });
  setNode(workflow, LTXR.LATENT_UPSCALE_MODEL, {
    model_name: settings.latentUpscaleModel,
  });
  setNode(workflow, LTXR.SECOND_PASS_CFG_GUIDER, {
    cfg: settings.secondPassCfg,
  });
  setNode(workflow, LTXR.SECOND_PASS_SIGMAS, {
    sigmas: settings.secondPassSigmas,
  });
  setNode(workflow, LTXR.SECOND_PASS_IMAGE_SCALE, {
    upscale_method: settings.secondPassUpscaleMethod,
    scale_by: settings.secondPassUpscaleBy,
  });
  setAnchorNode(workflow, LTXR.SECOND_PASS_ANCHOR, settings.secondPassAnchor);
}

function configureSageAttention(workflow: ComfyUIWorkflow, settings: LtxrSettings) {
  const inputs = {
    sage_attention: settings.sageAttention,
    allow_compile: settings.sageAllowCompile,
  };
  setNode(workflow, LTXR.FIRST_PASS_SAGE_ATTN_PATCH, inputs);
  setNode(workflow, LTXR.SAGE_ATTN_PATCH, inputs);
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
  loras: LtxLoraChainItem[]
): NodeOutput {
  let model: NodeOutput = [LTXR.CHECKPOINT, 0];
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
  settings: LtxrSettings,
  modelOutput: NodeOutput,
  hasReferenceAudio: boolean
): NodeOutput {
  const slot = settings.idLora;
  if (
    !hasReferenceAudio ||
    !slot.enabled ||
    slot.name === 'CONFIGURE_IN_ADMIN'
  ) {
    delete workflow[LTXR.ID_LORA];
    return modelOutput;
  }

  workflow[LTXR.ID_LORA] = {
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

  return [LTXR.ID_LORA, 0];
}

function handleReferenceAudio(
  workflow: ComfyUIWorkflow,
  audioFile: string,
  settings: LtxrSettings,
  modelOutput: NodeOutput
) {
  setNode(workflow, LTXR.LOAD_AUDIO, { audio: audioFile });
  setNode(workflow, LTXR.REFERENCE_AUDIO, {
    identity_guidance_scale: settings.identityGuidanceScale,
    start_percent: settings.identityStartPercent,
    end_percent: settings.identityEndPercent,
    model: modelOutput,
    positive: [LTXR.VRAM_POST_CONDITIONING, 0],
    negative: [LTXR.CONDITIONING, 1],
  });
  setNode(workflow, LTXR.ADD_GUIDE, {
    positive: [LTXR.REFERENCE_AUDIO, 1],
    negative: [LTXR.REFERENCE_AUDIO, 2],
  });
  setNode(workflow, LTXR.ANCHOR, { model: [LTXR.REFERENCE_AUDIO, 0] });
}

function handleReferenceAudioBypass(workflow: ComfyUIWorkflow) {
  delete workflow[LTXR.LOAD_AUDIO];
  delete workflow[LTXR.REFERENCE_AUDIO];
  delete workflow[LTXR.ID_LORA];
  setNode(workflow, LTXR.ADD_GUIDE, {
    positive: [LTXR.VRAM_POST_CONDITIONING, 0],
    negative: [LTXR.CONDITIONING, 1],
  });
  setNode(workflow, LTXR.ANCHOR, { model: [LTXR.NAG, 0] });
}

function handleEndImage(
  workflow: ComfyUIWorkflow,
  endImage: string,
  settings: LtxrSettings
) {
  workflow[END_IMAGE.LOAD_IMAGE] = {
    inputs: { image: endImage },
    class_type: 'LoadImage',
    _meta: { title: 'End Image' },
  };
  workflow[END_IMAGE.FRAME_INDEX] = {
    inputs: { expression: 'a - 1', a: [LTXR.FRAME_COUNT_MATH, 0] },
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
  setNode(workflow, LTXR.IMG_TO_VIDEO, {
    num_images: '2',
    'num_images.image_2': [END_IMAGE.RESIZE, 0],
    'num_images.index_2': [END_IMAGE.FRAME_INDEX, 0],
    'num_images.strength_2': 1,
  });
  setNode(workflow, LTXR.SECOND_PASS_IMG_TO_VIDEO, {
    num_images: '2',
    'num_images.image_2': [END_IMAGE.RESIZE, 0],
    'num_images.index_2': [END_IMAGE.FRAME_INDEX, 0],
    'num_images.strength_2': 1,
  });
}

function handleEndImageBypass(workflow: ComfyUIWorkflow) {
  for (const nodeId of [LTXR.IMG_TO_VIDEO, LTXR.SECOND_PASS_IMG_TO_VIDEO]) {
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

function configureRtx(workflow: ComfyUIWorkflow, settings: LtxrSettings) {
  if (settings.rtxEnabled) {
    setNode(workflow, LTXR.RTX_SUPER_RES, {
      resize_type: settings.rtxResizeType,
      'resize_type.scale': settings.rtxScale,
      quality: settings.rtxQuality,
      images: [LTXR.VAE_DECODE, 0],
    });
    setNode(workflow, LTXR.VIDEO_COMBINE, { images: [LTXR.RTX_SUPER_RES, 0] });
    return;
  }

  delete workflow[LTXR.RTX_SUPER_RES];
  setNode(workflow, LTXR.VIDEO_COMBINE, { images: [LTXR.VAE_DECODE, 0] });
}

function configureWatermark(
  workflow: ComfyUIWorkflow,
  params: LtxrGenerationParams,
  settings: LtxrSettings
) {
  const imageSource: NodeOutput = settings.rtxEnabled
    ? [LTXR.RTX_SUPER_RES, 0]
    : [LTXR.VAE_DECODE, 0];

  if (!settings.watermarkEnabled) {
    delete workflow[LTXR.WATERMARK];
    setNode(workflow, LTXR.VIDEO_COMBINE, { images: imageSource });
    return;
  }

  if (!params.watermarkImage) {
    throw new Error('LTXR watermark image is required when watermark is enabled');
  }

  setNode(workflow, LTXR.WATERMARK, {
    watermark: params.watermarkImage,
    position: settings.watermarkPosition,
    scale: settings.watermarkScale,
    transparency: settings.watermarkTransparency,
    image: imageSource,
  });
  setNode(workflow, LTXR.VIDEO_COMBINE, { images: [LTXR.WATERMARK, 0] });
}

function configureOutput(
  workflow: ComfyUIWorkflow,
  params: LtxrGenerationParams,
  settings: LtxrSettings
) {
  setNode(workflow, LTXR.VIDEO_COMBINE, {
    crf: settings.videoCrf,
    format: settings.videoFormat,
    pix_fmt: settings.videoPixFmt,
    filename_prefix: `LTXR/${extractBaseImageName(params.inputImage)}`,
  });
}
