import type { LtxrGenerationParams } from '../types';
import type { ComfyUIWorkflow } from '@/types';
import type {
  LtxAnchorSettings,
  LtxrSettings,
} from '@/lib/database/system-settings';
import { LTXR_WORKFLOW_TEMPLATE } from './template';
import { LTXR } from './nodes';
import { createLogger } from '@/lib/logger';
import { getLtxrSettings } from '@/lib/database/system-settings';
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

type LtxrWorkflowParams = LtxrGenerationParams & { settings?: LtxrSettings }

const log = createLogger('comfyui');

const LTXR_SHARED_NODES = {
  positivePrompt: LTXR.POSITIVE_PROMPT,
  negativePrompt: LTXR.NEGATIVE_PROMPT,
  videoConditioningPrompt: LTXR.VIDEO_CONDITIONING_PROMPT,
  audioConditioningPrompt: LTXR.AUDIO_CONDITIONING_PROMPT,
  samplerSelect: LTXR.SAMPLER_SELECT,
  duration: LTXR.DURATION,
  frameBase: LTXR.FRAME_BASE,
  frameRate: LTXR.FRAME_RATE,
  resizeStartImage: LTXR.RESIZE_START_IMAGE,
  loadImageStart: LTXR.LOAD_IMAGE_START,
  scheduler: LTXR.SCHEDULER,
  nag: LTXR.NAG,
  rtxSuperRes: LTXR.RTX_SUPER_RES,
  vaeDecode: LTXR.VAE_DECODE,
  videoCombine: LTXR.VIDEO_COMBINE,
} as const;

const END_IMAGE = {
  LOAD_IMAGE: '260',
  FRAME_INDEX: '261',
  RESIZE: '264',
} as const;

export async function buildLtxrWorkflow(
  params: LtxrWorkflowParams
): Promise<ComfyUIWorkflow> {
  const settings = params.settings ?? await getLtxrSettings();
  const workflow: ComfyUIWorkflow = structuredClone(LTXR_WORKFLOW_TEMPLATE);

  configureModels(workflow, settings);
  configureLtxPromptAndGeneration(workflow, LTXR_SHARED_NODES, params, settings);
  configurePreprocess(workflow, settings);
  configureLtxSchedulerAndNag(workflow, LTXR_SHARED_NODES, settings);
  configureGuide(workflow, settings);
  configureAnchor(workflow, settings);
  configureLtxMultimodalCfg(workflow, LTXR.MULTIMODAL_CFG, settings);
  configureSecondPass(workflow, settings);
  configureSageAttention(workflow, settings);
  const generalModelOutput = configureAdvancedLoraChain(
    workflow,
    settings.sfwLoraChain,
    [LTXR.CHECKPOINT, 0]
  );
  setNode(workflow, LTXR.NAG, {
    model: generalModelOutput,
    nag_cond_video: [LTXR.VIDEO_CONDITIONING_PROMPT, 0],
    nag_cond_audio: [LTXR.AUDIO_CONDITIONING_PROMPT, 0],
  });
  const nagModelOutput: LtxNodeOutput = [LTXR.NAG, 0];
  const modelOutput = configureIdLora(
    workflow,
    LTXR.ID_LORA,
    settings.idLora,
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

  configureLtxRtx(workflow, LTXR_SHARED_NODES, settings);
  configureWatermark(workflow, params, settings);
  configureLtxOutput(workflow, LTXR.VIDEO_COMBINE, params.inputImage, 'LTXR', settings);

  setNode(workflow, LTXR.NOISE_SEED, { noise_seed: generateSeed() });

  log.debug('LTXR workflow built', {
    prompt: params.prompt.substring(0, 50),
    hasEndImage: !!params.endImage,
    videoDuration: params.videoDuration,
    hasReferenceAudio: !!params.referenceAudio,
    isNSFW: !!params.isNSFW,
    hasWatermark: settings.watermarkEnabled,
  });

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

function configurePreprocess(workflow: ComfyUIWorkflow, settings: LtxrSettings) {
  const inputs = { img_compression: settings.preprocessImgCompression };
  setNode(workflow, LTXR.FIRST_PASS_PREPROCESS, inputs);
  setNode(workflow, LTXR.SECOND_PASS_PREPROCESS, inputs);
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

function handleReferenceAudio(
  workflow: ComfyUIWorkflow,
  audioFile: string,
  settings: LtxrSettings,
  modelOutput: LtxNodeOutput
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

function configureWatermark(
  workflow: ComfyUIWorkflow,
  params: LtxrGenerationParams,
  settings: LtxrSettings
) {
  const imageSource: LtxNodeOutput = settings.rtxEnabled
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
