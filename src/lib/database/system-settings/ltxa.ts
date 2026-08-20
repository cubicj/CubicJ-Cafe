import { prisma } from '../prisma';
import {
  buildSettingsMap,
  parseLtxInteger,
  parseLtxLoraChain,
  parseLtxLoraSlot,
  parseLtxNumber,
  parseLtxNumberList,
  type LtxLoraChainItem,
  type LtxLoraSlotSettings,
} from './common';

export interface LtxaSettings {
  unet: string;
  unetWeightDtype: string;
  clipName1: string;
  clipName2: string;
  videoVae: string;
  secondPassSampler: string;
  audioVae: string;
  negativePrompt: string;
  videoConditioningPrompt: string;
  audioConditioningPrompt: string;
  frameRate: number;
  durationOptions: number[];
  frameBase: number;
  megapixels: number;
  resizeMultipleOf: number;
  resizeUpscaleMethod: string;
  preprocessImgCompression: number;
  sampler: string;
  clownEta: number;
  clownBongmath: boolean;
  schedulerSteps: number;
  schedulerMaxShift: number;
  schedulerBaseShift: number;
  schedulerStretch: boolean;
  schedulerTerminal: number;
  nagScale: number;
  nagAlpha: number;
  nagTau: number;
  identityGuidanceScale: number;
  identityStartPercent: number;
  identityEndPercent: number;
  secondPassIdentityGuidanceScale: number;
  guideFrameIndex: number;
  guideStrength: number;
  guideCrf: number;
  guideBlurRadius: number;
  guideInterpolation: string;
  guideCrop: string;
  guideEnabled: boolean;
  secondPassGuideEnabled: boolean;
  secondPassGuideFrameIndex: number;
  secondPassGuideStrength: number;
  secondPassGuideCrf: number;
  secondPassGuideBlurRadius: number;
  secondPassGuideInterpolation: string;
  secondPassGuideCrop: string;
  anchorStrength: number;
  anchorCacheAtStep: number;
  anchorSimilarityThreshold: number;
  anchorDecayWithDistance: number;
  anchorEnergyThreshold: number;
  anchorBypass: boolean;
  anchorDebug: boolean;
  anchorAdvancedMode: boolean;
  anchorCacheMode: string;
  anchorForwardsPerStep: number;
  anchorCacheWarmup: number;
  anchorFrame: number;
  anchorDepthCurve: string;
  anchorBlockIndexFilter: string;
  latentUpscaleModel: string;
  textAttentionAmplification: number;
  multimodalVideoCfg: number;
  multimodalAudioCfg: number;
  multimodalInactiveCfg: number;
  multimodalActiveSteps: number;
  secondPassCfg: number;
  secondPassSigmas: string;
  secondPassUpscaleMethod: string;
  secondPassUpscaleBy: number;
  sageAttention: string;
  sageAllowCompile: boolean;
  memorySageTritonKernels: boolean;
  torchFp16Accumulation: boolean;
  chunkFeedForwardDimThreshold: number;
  attentionTunerVideoScale: number;
  attentionTunerVideoToAudioScale: number;
  attentionTunerAudioScale: number;
  attentionTunerAudioToVideoScale: number;
  attentionTunerBlocks: string;
  attentionTunerTritonKernels: boolean;
  firstPassDistilledLoraName: string;
  firstPassDistilledLoraStrength: number;
  secondPassDistilledLoraName: string;
  secondPassDistilledLoraStrength: number;
  rtxEnabled: boolean;
  rtxResizeType: string;
  rtxScale: number;
  rtxQuality: string;
  forceFullUnloadVerbose: boolean;
  sfwLoraChain: LtxLoraChainItem[];
  nsfwLoraChain: LtxLoraChainItem[];
  idLora: LtxLoraSlotSettings;
  videoCrf: number;
  videoFormat: string;
  videoPixFmt: string;
}

export const LTXA_KEYS = {
  unet: 'ltxa.unet',
  unetWeightDtype: 'ltxa.unet_weight_dtype',
  clipName1: 'ltxa.clip_name_1',
  clipName2: 'ltxa.clip_name_2',
  videoVae: 'ltxa.video_vae',
  secondPassSampler: 'ltxa.second_pass_sampler',
  audioVae: 'ltxa.audio_vae',
  negativePrompt: 'ltxa.negative_prompt',
  videoConditioningPrompt: 'ltxa.video_conditioning_prompt',
  audioConditioningPrompt: 'ltxa.audio_conditioning_prompt',
  frameRate: 'ltxa.frame_rate',
  durationOptions: 'ltxa.duration_options',
  frameBase: 'ltxa.frame_base',
  megapixels: 'ltxa.megapixels',
  resizeMultipleOf: 'ltxa.resize_multiple_of',
  resizeUpscaleMethod: 'ltxa.resize_upscale_method',
  preprocessImgCompression: 'ltxa.preprocess_img_compression',
  sampler: 'ltxa.sampler',
  clownEta: 'ltxa.clown_eta',
  clownBongmath: 'ltxa.clown_bongmath',
  schedulerSteps: 'ltxa.scheduler_steps',
  schedulerMaxShift: 'ltxa.scheduler_max_shift',
  schedulerBaseShift: 'ltxa.scheduler_base_shift',
  schedulerStretch: 'ltxa.scheduler_stretch',
  schedulerTerminal: 'ltxa.scheduler_terminal',
  nagScale: 'ltxa.nag_scale',
  nagAlpha: 'ltxa.nag_alpha',
  nagTau: 'ltxa.nag_tau',
  identityGuidanceScale: 'ltxa.identity_guidance_scale',
  identityStartPercent: 'ltxa.identity_start_percent',
  identityEndPercent: 'ltxa.identity_end_percent',
  secondPassIdentityGuidanceScale: 'ltxa.second_pass_identity_guidance_scale',
  guideFrameIndex: 'ltxa.guide_frame_index',
  guideStrength: 'ltxa.guide_strength',
  guideCrf: 'ltxa.guide_crf',
  guideBlurRadius: 'ltxa.guide_blur_radius',
  guideInterpolation: 'ltxa.guide_interpolation',
  guideCrop: 'ltxa.guide_crop',
  guideEnabled: 'ltxa.guide_enabled',
  secondPassGuideEnabled: 'ltxa.second_pass_guide_enabled',
  secondPassGuideFrameIndex: 'ltxa.second_pass_guide_frame_index',
  secondPassGuideStrength: 'ltxa.second_pass_guide_strength',
  secondPassGuideCrf: 'ltxa.second_pass_guide_crf',
  secondPassGuideBlurRadius: 'ltxa.second_pass_guide_blur_radius',
  secondPassGuideInterpolation: 'ltxa.second_pass_guide_interpolation',
  secondPassGuideCrop: 'ltxa.second_pass_guide_crop',
  anchorStrength: 'ltxa.anchor_strength',
  anchorCacheAtStep: 'ltxa.anchor_cache_at_step',
  anchorSimilarityThreshold: 'ltxa.anchor_similarity_threshold',
  anchorDecayWithDistance: 'ltxa.anchor_decay_with_distance',
  anchorEnergyThreshold: 'ltxa.anchor_energy_threshold',
  anchorBypass: 'ltxa.anchor_bypass',
  anchorDebug: 'ltxa.anchor_debug',
  anchorAdvancedMode: 'ltxa.anchor_advanced_mode',
  anchorCacheMode: 'ltxa.anchor_cache_mode',
  anchorForwardsPerStep: 'ltxa.anchor_forwards_per_step',
  anchorCacheWarmup: 'ltxa.anchor_cache_warmup',
  anchorFrame: 'ltxa.anchor_frame',
  anchorDepthCurve: 'ltxa.anchor_depth_curve',
  anchorBlockIndexFilter: 'ltxa.anchor_block_index_filter',
  latentUpscaleModel: 'ltxa.latent_upscale_model',
  textAttentionAmplification: 'ltxa.text_attention_amplification',
  multimodalVideoCfg: 'ltxa.multimodal_video_cfg',
  multimodalAudioCfg: 'ltxa.multimodal_audio_cfg',
  multimodalInactiveCfg: 'ltxa.multimodal_inactive_cfg',
  multimodalActiveSteps: 'ltxa.multimodal_active_steps',
  secondPassCfg: 'ltxa.second_pass_cfg',
  secondPassSigmas: 'ltxa.second_pass_sigmas',
  secondPassUpscaleMethod: 'ltxa.second_pass_upscale_method',
  secondPassUpscaleBy: 'ltxa.second_pass_upscale_by',
  sageAttention: 'ltxa.sage_attention',
  sageAllowCompile: 'ltxa.sage_allow_compile',
  memorySageTritonKernels: 'ltxa.memory_sage_triton_kernels',
  torchFp16Accumulation: 'ltxa.torch_fp16_accumulation',
  chunkFeedForwardDimThreshold: 'ltxa.chunk_feed_forward_dim_threshold',
  attentionTunerVideoScale: 'ltxa.attention_tuner_video_scale',
  attentionTunerVideoToAudioScale: 'ltxa.attention_tuner_video_to_audio_scale',
  attentionTunerAudioScale: 'ltxa.attention_tuner_audio_scale',
  attentionTunerAudioToVideoScale: 'ltxa.attention_tuner_audio_to_video_scale',
  attentionTunerBlocks: 'ltxa.attention_tuner_blocks',
  attentionTunerTritonKernels: 'ltxa.attention_tuner_triton_kernels',
  firstPassDistilledLoraName: 'ltxa.first_pass_distilled_lora_name',
  firstPassDistilledLoraStrength: 'ltxa.first_pass_distilled_lora_strength',
  secondPassDistilledLoraName: 'ltxa.second_pass_distilled_lora_name',
  secondPassDistilledLoraStrength: 'ltxa.second_pass_distilled_lora_strength',
  rtxEnabled: 'ltxa.rtx_enabled',
  rtxResizeType: 'ltxa.rtx_resize_type',
  rtxScale: 'ltxa.rtx_scale',
  rtxQuality: 'ltxa.rtx_quality',
  forceFullUnloadVerbose: 'ltxa.force_full_unload_verbose',
  sfwLoraChain: 'ltxa.sfw_lora_chain',
  nsfwLoraChain: 'ltxa.nsfw_lora_chain',
  idLoraEnabled: 'ltxa.id_lora_enabled',
  idLoraName: 'ltxa.id_lora_name',
  idLoraStrength: 'ltxa.id_lora_strength',
  idLoraVideo: 'ltxa.id_lora_video',
  idLoraVideoToAudio: 'ltxa.id_lora_video_to_audio',
  idLoraAudio: 'ltxa.id_lora_audio',
  idLoraAudioToVideo: 'ltxa.id_lora_audio_to_video',
  idLoraOther: 'ltxa.id_lora_other',
  videoCrf: 'ltxa.video_crf',
  videoFormat: 'ltxa.video_format',
  videoPixFmt: 'ltxa.video_pix_fmt',
} as const;

export async function getLtxaSettings(): Promise<LtxaSettings> {
  const keys = Object.values(LTXA_KEYS);
  const settings = await prisma.systemSetting.findMany({ where: { key: { in: keys } } });
  const map = buildSettingsMap(settings, LTXA_KEYS, [], [
    LTXA_KEYS.anchorBlockIndexFilter,
    LTXA_KEYS.attentionTunerBlocks,
  ]);
  const k = LTXA_KEYS;
  return {
    unet: map.get(k.unet)!,
    unetWeightDtype: map.get(k.unetWeightDtype)!,
    clipName1: map.get(k.clipName1)!,
    clipName2: map.get(k.clipName2)!,
    videoVae: map.get(k.videoVae)!,
    secondPassSampler: map.get(k.secondPassSampler)!,
    audioVae: map.get(k.audioVae)!,
    negativePrompt: map.get(k.negativePrompt)!,
    videoConditioningPrompt: map.get(k.videoConditioningPrompt)!,
    audioConditioningPrompt: map.get(k.audioConditioningPrompt)!,
    frameRate: parseLtxNumber(map, k.frameRate),
    durationOptions: parseLtxNumberList(map, k.durationOptions),
    frameBase: parseLtxInteger(map, k.frameBase),
    megapixels: parseLtxNumber(map, k.megapixels),
    resizeMultipleOf: parseLtxInteger(map, k.resizeMultipleOf),
    resizeUpscaleMethod: map.get(k.resizeUpscaleMethod)!,
    preprocessImgCompression: parseLtxInteger(map, k.preprocessImgCompression),
    sampler: map.get(k.sampler)!,
    clownEta: parseLtxNumber(map, k.clownEta),
    clownBongmath: map.get(k.clownBongmath)! === 'true',
    schedulerSteps: parseLtxInteger(map, k.schedulerSteps),
    schedulerMaxShift: parseLtxNumber(map, k.schedulerMaxShift),
    schedulerBaseShift: parseLtxNumber(map, k.schedulerBaseShift),
    schedulerStretch: map.get(k.schedulerStretch)! === 'true',
    schedulerTerminal: parseLtxNumber(map, k.schedulerTerminal),
    nagScale: parseLtxNumber(map, k.nagScale),
    nagAlpha: parseLtxNumber(map, k.nagAlpha),
    nagTau: parseLtxNumber(map, k.nagTau),
    identityGuidanceScale: parseLtxNumber(map, k.identityGuidanceScale),
    identityStartPercent: parseLtxNumber(map, k.identityStartPercent),
    identityEndPercent: parseLtxNumber(map, k.identityEndPercent),
    secondPassIdentityGuidanceScale: parseLtxNumber(map, k.secondPassIdentityGuidanceScale),
    guideFrameIndex: parseLtxInteger(map, k.guideFrameIndex),
    guideStrength: parseLtxNumber(map, k.guideStrength),
    guideCrf: parseLtxInteger(map, k.guideCrf),
    guideBlurRadius: parseLtxInteger(map, k.guideBlurRadius),
    guideInterpolation: map.get(k.guideInterpolation)!,
    guideCrop: map.get(k.guideCrop)!,
    guideEnabled: map.get(k.guideEnabled)! === 'true',
    secondPassGuideEnabled: map.get(k.secondPassGuideEnabled)! === 'true',
    secondPassGuideFrameIndex: parseLtxInteger(map, k.secondPassGuideFrameIndex),
    secondPassGuideStrength: parseLtxNumber(map, k.secondPassGuideStrength),
    secondPassGuideCrf: parseLtxInteger(map, k.secondPassGuideCrf),
    secondPassGuideBlurRadius: parseLtxInteger(map, k.secondPassGuideBlurRadius),
    secondPassGuideInterpolation: map.get(k.secondPassGuideInterpolation)!,
    secondPassGuideCrop: map.get(k.secondPassGuideCrop)!,
    anchorStrength: parseLtxNumber(map, k.anchorStrength),
    anchorCacheAtStep: parseLtxInteger(map, k.anchorCacheAtStep),
    anchorSimilarityThreshold: parseLtxNumber(map, k.anchorSimilarityThreshold),
    anchorDecayWithDistance: parseLtxNumber(map, k.anchorDecayWithDistance),
    anchorEnergyThreshold: parseLtxNumber(map, k.anchorEnergyThreshold),
    anchorBypass: map.get(k.anchorBypass)! === 'true',
    anchorDebug: map.get(k.anchorDebug)! === 'true',
    anchorAdvancedMode: map.get(k.anchorAdvancedMode)! === 'true',
    anchorCacheMode: map.get(k.anchorCacheMode)!,
    anchorForwardsPerStep: parseLtxInteger(map, k.anchorForwardsPerStep),
    anchorCacheWarmup: parseLtxInteger(map, k.anchorCacheWarmup),
    anchorFrame: parseLtxInteger(map, k.anchorFrame),
    anchorDepthCurve: map.get(k.anchorDepthCurve)!,
    anchorBlockIndexFilter: map.get(k.anchorBlockIndexFilter)!,
    latentUpscaleModel: map.get(k.latentUpscaleModel)!,
    textAttentionAmplification: parseLtxNumber(map, k.textAttentionAmplification),
    multimodalVideoCfg: parseLtxNumber(map, k.multimodalVideoCfg),
    multimodalAudioCfg: parseLtxNumber(map, k.multimodalAudioCfg),
    multimodalInactiveCfg: parseLtxNumber(map, k.multimodalInactiveCfg),
    multimodalActiveSteps: parseLtxInteger(map, k.multimodalActiveSteps),
    secondPassCfg: parseLtxNumber(map, k.secondPassCfg),
    secondPassSigmas: map.get(k.secondPassSigmas)!,
    secondPassUpscaleMethod: map.get(k.secondPassUpscaleMethod)!,
    secondPassUpscaleBy: parseLtxNumber(map, k.secondPassUpscaleBy),
    sageAttention: map.get(k.sageAttention)!,
    sageAllowCompile: map.get(k.sageAllowCompile)! === 'true',
    memorySageTritonKernels: map.get(k.memorySageTritonKernels)! === 'true',
    torchFp16Accumulation: map.get(k.torchFp16Accumulation)! === 'true',
    chunkFeedForwardDimThreshold: parseLtxInteger(map, k.chunkFeedForwardDimThreshold),
    attentionTunerVideoScale: parseLtxNumber(map, k.attentionTunerVideoScale),
    attentionTunerVideoToAudioScale: parseLtxNumber(map, k.attentionTunerVideoToAudioScale),
    attentionTunerAudioScale: parseLtxNumber(map, k.attentionTunerAudioScale),
    attentionTunerAudioToVideoScale: parseLtxNumber(map, k.attentionTunerAudioToVideoScale),
    attentionTunerBlocks: map.get(k.attentionTunerBlocks)!,
    attentionTunerTritonKernels: map.get(k.attentionTunerTritonKernels)! === 'true',
    firstPassDistilledLoraName: map.get(k.firstPassDistilledLoraName)!,
    firstPassDistilledLoraStrength: parseLtxNumber(map, k.firstPassDistilledLoraStrength),
    secondPassDistilledLoraName: map.get(k.secondPassDistilledLoraName)!,
    secondPassDistilledLoraStrength: parseLtxNumber(map, k.secondPassDistilledLoraStrength),
    rtxEnabled: map.get(k.rtxEnabled)! === 'true',
    rtxResizeType: map.get(k.rtxResizeType)!,
    rtxScale: parseLtxNumber(map, k.rtxScale),
    rtxQuality: map.get(k.rtxQuality)!,
    forceFullUnloadVerbose: map.get(k.forceFullUnloadVerbose)! === 'true',
    sfwLoraChain: parseLtxLoraChain(map, k.sfwLoraChain),
    nsfwLoraChain: parseLtxLoraChain(map, k.nsfwLoraChain),
    idLora: parseLtxLoraSlot(map, {
      enabled: k.idLoraEnabled,
      name: k.idLoraName,
      strength: k.idLoraStrength,
      video: k.idLoraVideo,
      videoToAudio: k.idLoraVideoToAudio,
      audio: k.idLoraAudio,
      audioToVideo: k.idLoraAudioToVideo,
      other: k.idLoraOther,
    }),
    videoCrf: parseLtxInteger(map, k.videoCrf),
    videoFormat: map.get(k.videoFormat)!,
    videoPixFmt: map.get(k.videoPixFmt)!,
  };
}
