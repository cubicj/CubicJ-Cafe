import { prisma } from '../prisma';
import {
  buildSettingsMap,
  parseLtxAnchorSettings,
  parseLtxInteger,
  parseLtxLoraChain,
  parseLtxLoraSlot,
  parseLtxNumber,
  parseLtxNumberList,
  type LtxAnchorSettings,
} from './common';
import type { LtxaSettings } from './ltxa';

export type LtxrSettings = Omit<
  LtxaSettings,
  | 'audioVae'
  | 'unet'
  | 'unetWeightDtype'
  | 'clipName1'
  | 'clipName2'
  | 'videoVae'
  | 'secondPassSampler'
  | 'secondPassIdentityGuidanceScale'
  | 'guideEnabled'
  | 'secondPassGuideEnabled'
  | 'secondPassGuideFrameIndex'
  | 'secondPassGuideStrength'
  | 'secondPassGuideCrf'
  | 'secondPassGuideBlurRadius'
  | 'secondPassGuideInterpolation'
  | 'secondPassGuideCrop'
  | 'memorySageTritonKernels'
  | 'torchFp16Accumulation'
  | 'chunkFeedForwardDimThreshold'
  | 'attentionTunerVideoScale'
  | 'attentionTunerVideoToAudioScale'
  | 'attentionTunerAudioScale'
  | 'attentionTunerAudioToVideoScale'
  | 'attentionTunerBlocks'
  | 'attentionTunerTritonKernels'
  | 'firstPassDistilledLoraName'
  | 'firstPassDistilledLoraStrength'
  | 'secondPassDistilledLoraName'
  | 'secondPassDistilledLoraStrength'
  | 'forceFullUnloadVerbose'
  | 'nsfwLoraChain'
> & {
  checkpoint: string;
  textEncoder: string;
  secondPassAnchor: LtxAnchorSettings;
  watermarkEnabled: boolean;
  watermarkImageAssetId: string | null;
  watermarkPosition: string;
  watermarkScale: number;
  watermarkTransparency: number;
};

export const LTXR_KEYS = {
  endImageEnabled: 'ltxr.end_image_enabled',
  checkpoint: 'ltxr.checkpoint',
  textEncoder: 'ltxr.text_encoder',
  negativePrompt: 'ltxr.negative_prompt',
  videoConditioningPrompt: 'ltxr.video_conditioning_prompt',
  audioConditioningPrompt: 'ltxr.audio_conditioning_prompt',
  frameRate: 'ltxr.frame_rate',
  durationOptions: 'ltxr.duration_options',
  frameBase: 'ltxr.frame_base',
  megapixels: 'ltxr.megapixels',
  resizeMultipleOf: 'ltxr.resize_multiple_of',
  resizeUpscaleMethod: 'ltxr.resize_upscale_method',
  preprocessImgCompression: 'ltxr.preprocess_img_compression',
  sampler: 'ltxr.sampler',
  clownEta: 'ltxr.clown_eta',
  clownBongmath: 'ltxr.clown_bongmath',
  schedulerSteps: 'ltxr.scheduler_steps',
  schedulerMaxShift: 'ltxr.scheduler_max_shift',
  schedulerBaseShift: 'ltxr.scheduler_base_shift',
  schedulerStretch: 'ltxr.scheduler_stretch',
  schedulerTerminal: 'ltxr.scheduler_terminal',
  nagScale: 'ltxr.nag_scale',
  nagAlpha: 'ltxr.nag_alpha',
  nagTau: 'ltxr.nag_tau',
  identityGuidanceScale: 'ltxr.identity_guidance_scale',
  identityStartPercent: 'ltxr.identity_start_percent',
  identityEndPercent: 'ltxr.identity_end_percent',
  guideFrameIndex: 'ltxr.guide_frame_index',
  guideStrength: 'ltxr.guide_strength',
  guideCrf: 'ltxr.guide_crf',
  guideBlurRadius: 'ltxr.guide_blur_radius',
  guideInterpolation: 'ltxr.guide_interpolation',
  guideCrop: 'ltxr.guide_crop',
  anchorStrength: 'ltxr.anchor_strength',
  anchorCacheAtStep: 'ltxr.anchor_cache_at_step',
  anchorSimilarityThreshold: 'ltxr.anchor_similarity_threshold',
  anchorDecayWithDistance: 'ltxr.anchor_decay_with_distance',
  anchorEnergyThreshold: 'ltxr.anchor_energy_threshold',
  anchorBypass: 'ltxr.anchor_bypass',
  anchorDebug: 'ltxr.anchor_debug',
  anchorAdvancedMode: 'ltxr.anchor_advanced_mode',
  anchorCacheMode: 'ltxr.anchor_cache_mode',
  anchorForwardsPerStep: 'ltxr.anchor_forwards_per_step',
  anchorCacheWarmup: 'ltxr.anchor_cache_warmup',
  anchorFrame: 'ltxr.anchor_frame',
  anchorDepthCurve: 'ltxr.anchor_depth_curve',
  anchorBlockIndexFilter: 'ltxr.anchor_block_index_filter',
  latentUpscaleModel: 'ltxr.latent_upscale_model',
  textAttentionAmplification: 'ltxr.text_attention_amplification',
  multimodalVideoCfg: 'ltxr.multimodal_video_cfg',
  multimodalAudioCfg: 'ltxr.multimodal_audio_cfg',
  multimodalInactiveCfg: 'ltxr.multimodal_inactive_cfg',
  multimodalActiveSteps: 'ltxr.multimodal_active_steps',
  secondPassCfg: 'ltxr.second_pass_cfg',
  secondPassSigmas: 'ltxr.second_pass_sigmas',
  secondPassUpscaleMethod: 'ltxr.second_pass_upscale_method',
  secondPassUpscaleBy: 'ltxr.second_pass_upscale_by',
  secondPassAnchorStrength: 'ltxr.second_pass_anchor_strength',
  secondPassAnchorCacheAtStep: 'ltxr.second_pass_anchor_cache_at_step',
  secondPassAnchorSimilarityThreshold: 'ltxr.second_pass_anchor_similarity_threshold',
  secondPassAnchorDecayWithDistance: 'ltxr.second_pass_anchor_decay_with_distance',
  secondPassAnchorEnergyThreshold: 'ltxr.second_pass_anchor_energy_threshold',
  secondPassAnchorBypass: 'ltxr.second_pass_anchor_bypass',
  secondPassAnchorDebug: 'ltxr.second_pass_anchor_debug',
  secondPassAnchorAdvancedMode: 'ltxr.second_pass_anchor_advanced_mode',
  secondPassAnchorCacheMode: 'ltxr.second_pass_anchor_cache_mode',
  secondPassAnchorForwardsPerStep: 'ltxr.second_pass_anchor_forwards_per_step',
  secondPassAnchorCacheWarmup: 'ltxr.second_pass_anchor_cache_warmup',
  secondPassAnchorFrame: 'ltxr.second_pass_anchor_frame',
  secondPassAnchorDepthCurve: 'ltxr.second_pass_anchor_depth_curve',
  secondPassAnchorBlockIndexFilter: 'ltxr.second_pass_anchor_block_index_filter',
  sageAttention: 'ltxr.sage_attention',
  sageAllowCompile: 'ltxr.sage_allow_compile',
  rtxEnabled: 'ltxr.rtx_enabled',
  rtxResizeType: 'ltxr.rtx_resize_type',
  rtxScale: 'ltxr.rtx_scale',
  rtxQuality: 'ltxr.rtx_quality',
  sfwLoraChain: 'ltxr.sfw_lora_chain',
  idLoraEnabled: 'ltxr.id_lora_enabled',
  idLoraName: 'ltxr.id_lora_name',
  idLoraStrength: 'ltxr.id_lora_strength',
  idLoraVideo: 'ltxr.id_lora_video',
  idLoraVideoToAudio: 'ltxr.id_lora_video_to_audio',
  idLoraAudio: 'ltxr.id_lora_audio',
  idLoraAudioToVideo: 'ltxr.id_lora_audio_to_video',
  idLoraOther: 'ltxr.id_lora_other',
  videoCrf: 'ltxr.video_crf',
  videoFormat: 'ltxr.video_format',
  videoPixFmt: 'ltxr.video_pix_fmt',
  watermarkEnabled: 'ltxr.watermark_enabled',
  watermarkImageAssetId: 'ltxr.watermark_image',
  watermarkPosition: 'ltxr.watermark_position',
  watermarkScale: 'ltxr.watermark_scale',
  watermarkTransparency: 'ltxr.watermark_transparency',
} as const;

export async function getLtxrSettings(): Promise<LtxrSettings> {
  const keys = Object.values(LTXR_KEYS);
  const settings = await prisma.systemSetting.findMany({ where: { key: { in: keys } } });
  const map = buildSettingsMap(settings, LTXR_KEYS, [LTXR_KEYS.watermarkImageAssetId]);
  const k = LTXR_KEYS;
  const watermarkEnabled = map.get(k.watermarkEnabled)! === 'true';
  const storedWatermarkImageAssetId = map.get(k.watermarkImageAssetId)?.trim() || null;
  if (watermarkEnabled && !storedWatermarkImageAssetId) {
    throw new Error(`필수 설정값 누락: ${k.watermarkImageAssetId}`);
  }
  const watermarkImageAssetId = watermarkEnabled ? storedWatermarkImageAssetId : null;

  return {
    checkpoint: map.get(k.checkpoint)!,
    textEncoder: map.get(k.textEncoder)!,
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
    guideFrameIndex: parseLtxInteger(map, k.guideFrameIndex),
    guideStrength: parseLtxNumber(map, k.guideStrength),
    guideCrf: parseLtxInteger(map, k.guideCrf),
    guideBlurRadius: parseLtxInteger(map, k.guideBlurRadius),
    guideInterpolation: map.get(k.guideInterpolation)!,
    guideCrop: map.get(k.guideCrop)!,
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
    secondPassAnchor: parseLtxAnchorSettings(map, {
      strength: k.secondPassAnchorStrength,
      cacheAtStep: k.secondPassAnchorCacheAtStep,
      similarityThreshold: k.secondPassAnchorSimilarityThreshold,
      decayWithDistance: k.secondPassAnchorDecayWithDistance,
      energyThreshold: k.secondPassAnchorEnergyThreshold,
      bypass: k.secondPassAnchorBypass,
      debug: k.secondPassAnchorDebug,
      advancedMode: k.secondPassAnchorAdvancedMode,
      cacheMode: k.secondPassAnchorCacheMode,
      forwardsPerStep: k.secondPassAnchorForwardsPerStep,
      cacheWarmup: k.secondPassAnchorCacheWarmup,
      anchorFrame: k.secondPassAnchorFrame,
      depthCurve: k.secondPassAnchorDepthCurve,
      blockIndexFilter: k.secondPassAnchorBlockIndexFilter,
    }),
    sageAttention: map.get(k.sageAttention)!,
    sageAllowCompile: map.get(k.sageAllowCompile)! === 'true',
    rtxEnabled: map.get(k.rtxEnabled)! === 'true',
    rtxResizeType: map.get(k.rtxResizeType)!,
    rtxScale: parseLtxNumber(map, k.rtxScale),
    rtxQuality: map.get(k.rtxQuality)!,
    sfwLoraChain: parseLtxLoraChain(map, k.sfwLoraChain),
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
    watermarkEnabled,
    watermarkImageAssetId,
    watermarkPosition: map.get(k.watermarkPosition)!,
    watermarkScale: parseLtxNumber(map, k.watermarkScale),
    watermarkTransparency: parseLtxNumber(map, k.watermarkTransparency),
  };
}
