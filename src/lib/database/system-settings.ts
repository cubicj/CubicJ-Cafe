import { prisma } from './prisma';
import { createLogger } from '@/lib/logger';
import type { VideoModel } from '@/lib/comfyui/workflows/types';

const log = createLogger('database');

export async function getSystemSetting(key: string, defaultValue: string = ''): Promise<string> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key }
    });
    return setting?.value || defaultValue;
  } catch (error) {
    log.error('System setting fetch error', { key, error: error instanceof Error ? error.message : String(error) });
    return defaultValue;
  }
}

export async function getSystemSettingAsNumber(key: string, defaultValue: number = 0): Promise<number> {
  try {
    const value = await getSystemSetting(key, defaultValue.toString());
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  } catch {
    return defaultValue;
  }
}

export async function getSystemSettingRequired(key: string): Promise<string> {
  const setting = await prisma.systemSetting.findUnique({ where: { key } });
  if (!setting || !setting.value) {
    throw new Error(`필수 설정값 누락: ${key}`);
  }
  return setting.value;
}

export async function getSystemSettingAsFloat(key: string): Promise<number> {
  const value = await getSystemSettingRequired(key);
  const parsed = parseFloat(value);
  if (isNaN(parsed)) {
    throw new Error(`유효하지 않은 숫자 설정값: ${key} = "${value}"`);
  }
  return parsed;
}

export async function setSystemSetting(
  key: string,
  value: string,
  type: string = 'string',
  category: string = 'general'
): Promise<void> {
  try {
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value, type, category },
      create: { key, value, type, category }
    });
  } catch (error) {
    log.error('System setting save error', { key, error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

export interface WanSettings {
  wanvideoModelHigh: string;
  wanvideoModelLow: string;
  t5Encoder: string;
  wanvideoVae: string;
  basePrecision: string;
  quantization: string;
  attentionMode: string;
  blocksToSwap: number;
  offloadImgEmb: boolean;
  offloadTxtEmb: boolean;
  vaceBlocksToSwap: number;
  prefetchBlocks: number;
  samplerSteps: number;
  shift: number;
  scheduler: string;
  sigmasHigh: string;
  sigmasLow: string;
  megapixels: number;
  resizeMultipleOf: number;
  resizeUpscaleMethod: string;
  nagScale: number;
  nagAlpha: number;
  nagTau: number;
  rtxEnabled: boolean;
  rtxResizeType: string;
  rtxScale: number;
  rtxQuality: string;
  frameRate: number;
  videoCrf: number;
  videoFormat: string;
  videoPixFmt: string;
  negativePrompt: string;
  durationOptions: number[];
  propagateX0High: boolean;
  propagateX0StrengthHigh: number;
  propagateX0Low: boolean;
  propagateX0StrengthLow: number;
  disableWindowReinjectHigh: boolean;
  disableWindowReinjectLow: boolean;
}

export interface LtxLoraSlotSettings {
  enabled: boolean;
  name: string;
  strength: number;
  video: number;
  videoToAudio: number;
  audio: number;
  audioToVideo: number;
  other: number;
}

export interface LtxAnchorSettings {
  strength: number;
  cacheAtStep: number;
  similarityThreshold: number;
  decayWithDistance: number;
  energyThreshold: number;
  bypass: boolean;
  debug: boolean;
  advancedMode: boolean;
  cacheMode: string;
  forwardsPerStep: number;
  cacheWarmup: number;
  anchorFrame: number;
  depthCurve: string;
  blockIndexFilter: string;
}

export interface LtxSettings {
  checkpoint: string;
  textEncoder: string;
  negativePrompt: string;
  videoConditioningPrompt: string;
  audioConditioningPrompt: string;
  frameRate: number;
  durationOptions: number[];
  frameBase: number;
  megapixels: number;
  resizeMultipleOf: number;
  resizeUpscaleMethod: string;
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
  guideFrameIndex: number;
  guideStrength: number;
  guideCrf: number;
  guideBlurRadius: number;
  guideInterpolation: string;
  guideCrop: string;
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
  secondPassAnchor: LtxAnchorSettings;
  sfwLoras: [LtxLoraSlotSettings, LtxLoraSlotSettings, LtxLoraSlotSettings, LtxLoraSlotSettings];
  nsfwLoras: [LtxLoraSlotSettings, LtxLoraSlotSettings, LtxLoraSlotSettings, LtxLoraSlotSettings];
  idLora: LtxLoraSlotSettings;
  videoCrf: number;
  videoFormat: string;
  videoPixFmt: string;
}

export const MODEL_ENABLED_KEYS = {
  wan: 'wan.enabled',
  ltx: 'ltx.enabled',
  'ltx-wan': 'ltx-wan.enabled',
} as const

export const WAN_KEYS = {
  wanvideoModelHigh: 'wan.wanvideo_model_high',
  wanvideoModelLow: 'wan.wanvideo_model_low',
  t5Encoder: 'wan.t5_encoder',
  wanvideoVae: 'wan.wanvideo_vae',
  basePrecision: 'wan.base_precision',
  quantization: 'wan.quantization',
  attentionMode: 'wan.attention_mode',
  blocksToSwap: 'wan.blocks_to_swap',
  offloadImgEmb: 'wan.offload_img_emb',
  offloadTxtEmb: 'wan.offload_txt_emb',
  vaceBlocksToSwap: 'wan.vace_blocks_to_swap',
  prefetchBlocks: 'wan.prefetch_blocks',
  samplerSteps: 'wan.sampler_steps',
  shift: 'wan.shift',
  scheduler: 'wan.scheduler',
  sigmasHigh: 'wan.sigmas_high',
  sigmasLow: 'wan.sigmas_low',
  megapixels: 'wan.megapixels',
  resizeMultipleOf: 'wan.resize_multiple_of',
  resizeUpscaleMethod: 'wan.resize_upscale_method',
  nagScale: 'wan.nag_scale',
  nagAlpha: 'wan.nag_alpha',
  nagTau: 'wan.nag_tau',
  rtxEnabled: 'wan.rtx_enabled',
  rtxResizeType: 'wan.rtx_resize_type',
  rtxScale: 'wan.rtx_scale',
  rtxQuality: 'wan.rtx_quality',
  frameRate: 'wan.frame_rate',
  videoCrf: 'wan.video_crf',
  videoFormat: 'wan.video_format',
  videoPixFmt: 'wan.video_pix_fmt',
  negativePrompt: 'wan.negative_prompt',
  durationOptions: 'wan.duration_options',
  disableWindowReinjectHigh: 'wan.disable_window_reinject_high',
  disableWindowReinjectLow: 'wan.disable_window_reinject_low',
  propagateX0High: 'wan.propagate_x0_high',
  propagateX0StrengthHigh: 'wan.propagate_x0_strength_high',
  propagateX0Low: 'wan.propagate_x0_low',
  propagateX0StrengthLow: 'wan.propagate_x0_strength_low',
} as const;

export const LTX_KEYS = {
  checkpoint: 'ltx.checkpoint',
  textEncoder: 'ltx.text_encoder',
  negativePrompt: 'ltx.negative_prompt',
  videoConditioningPrompt: 'ltx.video_conditioning_prompt',
  audioConditioningPrompt: 'ltx.audio_conditioning_prompt',
  frameRate: 'ltx.frame_rate',
  durationOptions: 'ltx.duration_options',
  frameBase: 'ltx.frame_base',
  megapixels: 'ltx.megapixels',
  resizeMultipleOf: 'ltx.resize_multiple_of',
  resizeUpscaleMethod: 'ltx.resize_upscale_method',
  sampler: 'ltx.sampler',
  clownEta: 'ltx.clown_eta',
  clownBongmath: 'ltx.clown_bongmath',
  schedulerSteps: 'ltx.scheduler_steps',
  schedulerMaxShift: 'ltx.scheduler_max_shift',
  schedulerBaseShift: 'ltx.scheduler_base_shift',
  schedulerStretch: 'ltx.scheduler_stretch',
  schedulerTerminal: 'ltx.scheduler_terminal',
  nagScale: 'ltx.nag_scale',
  nagAlpha: 'ltx.nag_alpha',
  nagTau: 'ltx.nag_tau',
  identityGuidanceScale: 'ltx.identity_guidance_scale',
  identityStartPercent: 'ltx.identity_start_percent',
  identityEndPercent: 'ltx.identity_end_percent',
  guideFrameIndex: 'ltx.guide_frame_index',
  guideStrength: 'ltx.guide_strength',
  guideCrf: 'ltx.guide_crf',
  guideBlurRadius: 'ltx.guide_blur_radius',
  guideInterpolation: 'ltx.guide_interpolation',
  guideCrop: 'ltx.guide_crop',
  anchorStrength: 'ltx.anchor_strength',
  anchorCacheAtStep: 'ltx.anchor_cache_at_step',
  anchorSimilarityThreshold: 'ltx.anchor_similarity_threshold',
  anchorDecayWithDistance: 'ltx.anchor_decay_with_distance',
  anchorEnergyThreshold: 'ltx.anchor_energy_threshold',
  anchorBypass: 'ltx.anchor_bypass',
  anchorDebug: 'ltx.anchor_debug',
  anchorAdvancedMode: 'ltx.anchor_advanced_mode',
  anchorCacheMode: 'ltx.anchor_cache_mode',
  anchorForwardsPerStep: 'ltx.anchor_forwards_per_step',
  anchorCacheWarmup: 'ltx.anchor_cache_warmup',
  anchorFrame: 'ltx.anchor_frame',
  anchorDepthCurve: 'ltx.anchor_depth_curve',
  anchorBlockIndexFilter: 'ltx.anchor_block_index_filter',
  latentUpscaleModel: 'ltx.latent_upscale_model',
  textAttentionAmplification: 'ltx.text_attention_amplification',
  multimodalVideoCfg: 'ltx.multimodal_video_cfg',
  multimodalAudioCfg: 'ltx.multimodal_audio_cfg',
  multimodalInactiveCfg: 'ltx.multimodal_inactive_cfg',
  multimodalActiveSteps: 'ltx.multimodal_active_steps',
  secondPassCfg: 'ltx.second_pass_cfg',
  secondPassSigmas: 'ltx.second_pass_sigmas',
  secondPassUpscaleMethod: 'ltx.second_pass_upscale_method',
  secondPassUpscaleBy: 'ltx.second_pass_upscale_by',
  secondPassAnchorStrength: 'ltx.second_pass_anchor_strength',
  secondPassAnchorCacheAtStep: 'ltx.second_pass_anchor_cache_at_step',
  secondPassAnchorSimilarityThreshold: 'ltx.second_pass_anchor_similarity_threshold',
  secondPassAnchorDecayWithDistance: 'ltx.second_pass_anchor_decay_with_distance',
  secondPassAnchorEnergyThreshold: 'ltx.second_pass_anchor_energy_threshold',
  secondPassAnchorBypass: 'ltx.second_pass_anchor_bypass',
  secondPassAnchorDebug: 'ltx.second_pass_anchor_debug',
  secondPassAnchorAdvancedMode: 'ltx.second_pass_anchor_advanced_mode',
  secondPassAnchorCacheMode: 'ltx.second_pass_anchor_cache_mode',
  secondPassAnchorForwardsPerStep: 'ltx.second_pass_anchor_forwards_per_step',
  secondPassAnchorCacheWarmup: 'ltx.second_pass_anchor_cache_warmup',
  secondPassAnchorFrame: 'ltx.second_pass_anchor_frame',
  secondPassAnchorDepthCurve: 'ltx.second_pass_anchor_depth_curve',
  secondPassAnchorBlockIndexFilter: 'ltx.second_pass_anchor_block_index_filter',
  sfwLora1Enabled: 'ltx.sfw_lora_1_enabled',
  sfwLora1Name: 'ltx.sfw_lora_1_name',
  sfwLora1Strength: 'ltx.sfw_lora_1_strength',
  sfwLora1Video: 'ltx.sfw_lora_1_video',
  sfwLora1VideoToAudio: 'ltx.sfw_lora_1_video_to_audio',
  sfwLora1Audio: 'ltx.sfw_lora_1_audio',
  sfwLora1AudioToVideo: 'ltx.sfw_lora_1_audio_to_video',
  sfwLora1Other: 'ltx.sfw_lora_1_other',
  sfwLora2Enabled: 'ltx.sfw_lora_2_enabled',
  sfwLora2Name: 'ltx.sfw_lora_2_name',
  sfwLora2Strength: 'ltx.sfw_lora_2_strength',
  sfwLora2Video: 'ltx.sfw_lora_2_video',
  sfwLora2VideoToAudio: 'ltx.sfw_lora_2_video_to_audio',
  sfwLora2Audio: 'ltx.sfw_lora_2_audio',
  sfwLora2AudioToVideo: 'ltx.sfw_lora_2_audio_to_video',
  sfwLora2Other: 'ltx.sfw_lora_2_other',
  sfwLora3Enabled: 'ltx.sfw_lora_3_enabled',
  sfwLora3Name: 'ltx.sfw_lora_3_name',
  sfwLora3Strength: 'ltx.sfw_lora_3_strength',
  sfwLora3Video: 'ltx.sfw_lora_3_video',
  sfwLora3VideoToAudio: 'ltx.sfw_lora_3_video_to_audio',
  sfwLora3Audio: 'ltx.sfw_lora_3_audio',
  sfwLora3AudioToVideo: 'ltx.sfw_lora_3_audio_to_video',
  sfwLora3Other: 'ltx.sfw_lora_3_other',
  sfwLora4Enabled: 'ltx.sfw_lora_4_enabled',
  sfwLora4Name: 'ltx.sfw_lora_4_name',
  sfwLora4Strength: 'ltx.sfw_lora_4_strength',
  sfwLora4Video: 'ltx.sfw_lora_4_video',
  sfwLora4VideoToAudio: 'ltx.sfw_lora_4_video_to_audio',
  sfwLora4Audio: 'ltx.sfw_lora_4_audio',
  sfwLora4AudioToVideo: 'ltx.sfw_lora_4_audio_to_video',
  sfwLora4Other: 'ltx.sfw_lora_4_other',
  nsfwLora1Enabled: 'ltx.nsfw_lora_1_enabled',
  nsfwLora1Name: 'ltx.nsfw_lora_1_name',
  nsfwLora1Strength: 'ltx.nsfw_lora_1_strength',
  nsfwLora1Video: 'ltx.nsfw_lora_1_video',
  nsfwLora1VideoToAudio: 'ltx.nsfw_lora_1_video_to_audio',
  nsfwLora1Audio: 'ltx.nsfw_lora_1_audio',
  nsfwLora1AudioToVideo: 'ltx.nsfw_lora_1_audio_to_video',
  nsfwLora1Other: 'ltx.nsfw_lora_1_other',
  nsfwLora2Enabled: 'ltx.nsfw_lora_2_enabled',
  nsfwLora2Name: 'ltx.nsfw_lora_2_name',
  nsfwLora2Strength: 'ltx.nsfw_lora_2_strength',
  nsfwLora2Video: 'ltx.nsfw_lora_2_video',
  nsfwLora2VideoToAudio: 'ltx.nsfw_lora_2_video_to_audio',
  nsfwLora2Audio: 'ltx.nsfw_lora_2_audio',
  nsfwLora2AudioToVideo: 'ltx.nsfw_lora_2_audio_to_video',
  nsfwLora2Other: 'ltx.nsfw_lora_2_other',
  nsfwLora3Enabled: 'ltx.nsfw_lora_3_enabled',
  nsfwLora3Name: 'ltx.nsfw_lora_3_name',
  nsfwLora3Strength: 'ltx.nsfw_lora_3_strength',
  nsfwLora3Video: 'ltx.nsfw_lora_3_video',
  nsfwLora3VideoToAudio: 'ltx.nsfw_lora_3_video_to_audio',
  nsfwLora3Audio: 'ltx.nsfw_lora_3_audio',
  nsfwLora3AudioToVideo: 'ltx.nsfw_lora_3_audio_to_video',
  nsfwLora3Other: 'ltx.nsfw_lora_3_other',
  nsfwLora4Enabled: 'ltx.nsfw_lora_4_enabled',
  nsfwLora4Name: 'ltx.nsfw_lora_4_name',
  nsfwLora4Strength: 'ltx.nsfw_lora_4_strength',
  nsfwLora4Video: 'ltx.nsfw_lora_4_video',
  nsfwLora4VideoToAudio: 'ltx.nsfw_lora_4_video_to_audio',
  nsfwLora4Audio: 'ltx.nsfw_lora_4_audio',
  nsfwLora4AudioToVideo: 'ltx.nsfw_lora_4_audio_to_video',
  nsfwLora4Other: 'ltx.nsfw_lora_4_other',
  idLoraEnabled: 'ltx.id_lora_enabled',
  idLoraName: 'ltx.id_lora_name',
  idLoraStrength: 'ltx.id_lora_strength',
  idLoraVideo: 'ltx.id_lora_video',
  idLoraVideoToAudio: 'ltx.id_lora_video_to_audio',
  idLoraAudio: 'ltx.id_lora_audio',
  idLoraAudioToVideo: 'ltx.id_lora_audio_to_video',
  idLoraOther: 'ltx.id_lora_other',
  videoCrf: 'ltx.video_crf',
  videoFormat: 'ltx.video_format',
  videoPixFmt: 'ltx.video_pix_fmt',
} as const;

function buildSettingsMap(
  settings: { key: string; value: string }[],
  keys: Record<string, string>
): Map<string, string> {
  const map = new Map<string, string>();
  for (const s of settings) {
    map.set(s.key, s.value);
  }
  const allKeys = Object.values(keys);
  const missing = allKeys.filter(k => !map.has(k) || !map.get(k));
  if (missing.length > 0) {
    throw new Error(`필수 설정값 누락: ${missing.join(', ')}`);
  }
  return map;
}

export async function getWanSettings(): Promise<WanSettings> {
  const keys = Object.values(WAN_KEYS);
  const settings = await prisma.systemSetting.findMany({ where: { key: { in: keys } } });
  const map = buildSettingsMap(settings, WAN_KEYS);
  const k = WAN_KEYS;
  return {
    wanvideoModelHigh: map.get(k.wanvideoModelHigh)!,
    wanvideoModelLow: map.get(k.wanvideoModelLow)!,
    t5Encoder: map.get(k.t5Encoder)!,
    wanvideoVae: map.get(k.wanvideoVae)!,
    basePrecision: map.get(k.basePrecision)!,
    quantization: map.get(k.quantization)!,
    attentionMode: map.get(k.attentionMode)!,
    blocksToSwap: parseInt(map.get(k.blocksToSwap)!, 10),
    offloadImgEmb: map.get(k.offloadImgEmb)! === 'true',
    offloadTxtEmb: map.get(k.offloadTxtEmb)! === 'true',
    vaceBlocksToSwap: parseInt(map.get(k.vaceBlocksToSwap)!, 10),
    prefetchBlocks: parseInt(map.get(k.prefetchBlocks)!, 10),
    samplerSteps: parseInt(map.get(k.samplerSteps)!, 10),
    shift: parseFloat(map.get(k.shift)!),
    scheduler: map.get(k.scheduler)!,
    sigmasHigh: map.get(k.sigmasHigh)!,
    sigmasLow: map.get(k.sigmasLow)!,
    megapixels: parseFloat(map.get(k.megapixels)!),
    resizeMultipleOf: parseInt(map.get(k.resizeMultipleOf)!, 10),
    resizeUpscaleMethod: map.get(k.resizeUpscaleMethod)!,
    nagScale: parseFloat(map.get(k.nagScale)!),
    nagAlpha: parseFloat(map.get(k.nagAlpha)!),
    nagTau: parseFloat(map.get(k.nagTau)!),
    rtxEnabled: map.get(k.rtxEnabled)! === 'true',
    rtxResizeType: map.get(k.rtxResizeType)!,
    rtxScale: parseFloat(map.get(k.rtxScale)!),
    rtxQuality: map.get(k.rtxQuality)!,
    frameRate: parseFloat(map.get(k.frameRate)!),
    videoCrf: parseInt(map.get(k.videoCrf)!, 10),
    videoFormat: map.get(k.videoFormat)!,
    videoPixFmt: map.get(k.videoPixFmt)!,
    negativePrompt: map.get(k.negativePrompt)!,
    durationOptions: map.get(k.durationOptions)!.split(',').map(Number),
    disableWindowReinjectHigh: map.get(k.disableWindowReinjectHigh)! === 'true',
    disableWindowReinjectLow: map.get(k.disableWindowReinjectLow)! === 'true',
    propagateX0High: map.get(k.propagateX0High)! === 'true',
    propagateX0StrengthHigh: parseFloat(map.get(k.propagateX0StrengthHigh)!),
    propagateX0Low: map.get(k.propagateX0Low)! === 'true',
    propagateX0StrengthLow: parseFloat(map.get(k.propagateX0StrengthLow)!),
  };
}

function parseLtxLoraSlot(
  map: Map<string, string>,
  keys: {
    enabled: string;
    name: string;
    strength: string;
    video: string;
    videoToAudio: string;
    audio: string;
    audioToVideo: string;
    other: string;
  }
): LtxLoraSlotSettings {
  return {
    enabled: map.get(keys.enabled)! === 'true',
    name: map.get(keys.name)!,
    strength: parseLtxNumber(map, keys.strength),
    video: parseLtxNumber(map, keys.video),
    videoToAudio: parseLtxNumber(map, keys.videoToAudio),
    audio: parseLtxNumber(map, keys.audio),
    audioToVideo: parseLtxNumber(map, keys.audioToVideo),
    other: parseLtxNumber(map, keys.other),
  };
}

function parseLtxAnchorSettings(
  map: Map<string, string>,
  keys: {
    strength: string;
    cacheAtStep: string;
    similarityThreshold: string;
    decayWithDistance: string;
    energyThreshold: string;
    bypass: string;
    debug: string;
    advancedMode: string;
    cacheMode: string;
    forwardsPerStep: string;
    cacheWarmup: string;
    anchorFrame: string;
    depthCurve: string;
    blockIndexFilter: string;
  }
): LtxAnchorSettings {
  return {
    strength: parseLtxNumber(map, keys.strength),
    cacheAtStep: parseLtxInteger(map, keys.cacheAtStep),
    similarityThreshold: parseLtxNumber(map, keys.similarityThreshold),
    decayWithDistance: parseLtxNumber(map, keys.decayWithDistance),
    energyThreshold: parseLtxNumber(map, keys.energyThreshold),
    bypass: map.get(keys.bypass)! === 'true',
    debug: map.get(keys.debug)! === 'true',
    advancedMode: map.get(keys.advancedMode)! === 'true',
    cacheMode: map.get(keys.cacheMode)!,
    forwardsPerStep: parseLtxInteger(map, keys.forwardsPerStep),
    cacheWarmup: parseLtxInteger(map, keys.cacheWarmup),
    anchorFrame: parseLtxInteger(map, keys.anchorFrame),
    depthCurve: map.get(keys.depthCurve)!,
    blockIndexFilter: map.get(keys.blockIndexFilter)!,
  };
}

function parseLtxNumber(map: Map<string, string>, key: string): number {
  const value = map.get(key)!;
  if (value.trim() === '') {
    throw new Error(`Invalid numeric setting: ${key} = "${value}"`);
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric setting: ${key} = "${value}"`);
  }
  return parsed;
}

function parseLtxInteger(map: Map<string, string>, key: string): number {
  const parsed = parseLtxNumber(map, key);
  if (!Number.isInteger(parsed)) {
    throw new Error(`Invalid integer setting: ${key} = "${map.get(key)!}"`);
  }
  return parsed;
}

function parseLtxNumberList(map: Map<string, string>, key: string): number[] {
  const value = map.get(key)!;
  if (value.trim() === '') {
    throw new Error(`Invalid numeric setting: ${key} = "${value}"`);
  }
  const parts = value.split(',').map(part => part.trim());
  const parsed = parts.map(Number);
  if (parts.some(part => part === '')) {
    throw new Error(`Invalid numeric setting: ${key} = "${value}"`);
  }
  if (parsed.length === 0 || parsed.some(item => !Number.isFinite(item))) {
    throw new Error(`Invalid numeric setting: ${key} = "${value}"`);
  }
  return parsed;
}

export async function getLtxSettings(): Promise<LtxSettings> {
  const keys = Object.values(LTX_KEYS);
  const settings = await prisma.systemSetting.findMany({ where: { key: { in: keys } } });
  const map = buildSettingsMap(settings, LTX_KEYS);
  const k = LTX_KEYS;
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
    sfwLoras: [
      parseLtxLoraSlot(map, {
        enabled: k.sfwLora1Enabled,
        name: k.sfwLora1Name,
        strength: k.sfwLora1Strength,
        video: k.sfwLora1Video,
        videoToAudio: k.sfwLora1VideoToAudio,
        audio: k.sfwLora1Audio,
        audioToVideo: k.sfwLora1AudioToVideo,
        other: k.sfwLora1Other,
      }),
      parseLtxLoraSlot(map, {
        enabled: k.sfwLora2Enabled,
        name: k.sfwLora2Name,
        strength: k.sfwLora2Strength,
        video: k.sfwLora2Video,
        videoToAudio: k.sfwLora2VideoToAudio,
        audio: k.sfwLora2Audio,
        audioToVideo: k.sfwLora2AudioToVideo,
        other: k.sfwLora2Other,
      }),
      parseLtxLoraSlot(map, {
        enabled: k.sfwLora3Enabled,
        name: k.sfwLora3Name,
        strength: k.sfwLora3Strength,
        video: k.sfwLora3Video,
        videoToAudio: k.sfwLora3VideoToAudio,
        audio: k.sfwLora3Audio,
        audioToVideo: k.sfwLora3AudioToVideo,
        other: k.sfwLora3Other,
      }),
      parseLtxLoraSlot(map, {
        enabled: k.sfwLora4Enabled,
        name: k.sfwLora4Name,
        strength: k.sfwLora4Strength,
        video: k.sfwLora4Video,
        videoToAudio: k.sfwLora4VideoToAudio,
        audio: k.sfwLora4Audio,
        audioToVideo: k.sfwLora4AudioToVideo,
        other: k.sfwLora4Other,
      }),
    ],
    nsfwLoras: [
      parseLtxLoraSlot(map, {
        enabled: k.nsfwLora1Enabled,
        name: k.nsfwLora1Name,
        strength: k.nsfwLora1Strength,
        video: k.nsfwLora1Video,
        videoToAudio: k.nsfwLora1VideoToAudio,
        audio: k.nsfwLora1Audio,
        audioToVideo: k.nsfwLora1AudioToVideo,
        other: k.nsfwLora1Other,
      }),
      parseLtxLoraSlot(map, {
        enabled: k.nsfwLora2Enabled,
        name: k.nsfwLora2Name,
        strength: k.nsfwLora2Strength,
        video: k.nsfwLora2Video,
        videoToAudio: k.nsfwLora2VideoToAudio,
        audio: k.nsfwLora2Audio,
        audioToVideo: k.nsfwLora2AudioToVideo,
        other: k.nsfwLora2Other,
      }),
      parseLtxLoraSlot(map, {
        enabled: k.nsfwLora3Enabled,
        name: k.nsfwLora3Name,
        strength: k.nsfwLora3Strength,
        video: k.nsfwLora3Video,
        videoToAudio: k.nsfwLora3VideoToAudio,
        audio: k.nsfwLora3Audio,
        audioToVideo: k.nsfwLora3AudioToVideo,
        other: k.nsfwLora3Other,
      }),
      parseLtxLoraSlot(map, {
        enabled: k.nsfwLora4Enabled,
        name: k.nsfwLora4Name,
        strength: k.nsfwLora4Strength,
        video: k.nsfwLora4Video,
        videoToAudio: k.nsfwLora4VideoToAudio,
        audio: k.nsfwLora4Audio,
        audioToVideo: k.nsfwLora4AudioToVideo,
        other: k.nsfwLora4Other,
      }),
    ],
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

export interface LtxWanSettings {
  audioNormEnabled: boolean
  distilledLoraEnabled: boolean
  loraEnabledWan: boolean
  vfiEnabled: boolean
  rtxEnabled: boolean
  durationOptions: number[]

  unet: string
  weightDtype: string
  clipGguf: string
  clipEmbeddings: string
  videoVae: string
  audioVae: string

  frameRate: number
  megapixels: number
  resizeMultipleOf: number
  resizeUpscaleMethod: string
  imgCompression: number
  sampler: string
  clownEta: number
  clownBongmath: boolean

  schedulerSteps: number
  schedulerMaxShift: number
  schedulerBaseShift: number
  schedulerStretch: boolean
  schedulerTerminal: number

  nagScale: number
  nagAlpha: number
  nagTau: number

  audioNorm: string
  identityGuidanceScale: number
  identityStartPercent: number
  identityEndPercent: number
  idLoraName: string
  idLoraStrength: number

  distilledLoraName: string
  distilledLoraStrength: number

  negativePromptLtx: string

  unetWan: string
  clipWan: string
  vaeWan: string
  shift: number

  cfgWan: number

  schedulerWan: string
  stepsWan: number
  denoiseWan: number
  sigmasWan: string

  nagScaleWan: number
  nagAlphaWan: number
  nagTauWan: number

  negativePromptWan: string
  blocksToSwap: number
  prefetchBlocks: number
  propagateX0: boolean
  propagateX0Strength: number
  disableWindowReinject: boolean

  vfiMethod: string
  rifeModel: string
  rifePrecision: string
  rifeResolutionProfile: string
  rifeCustomMinDim: number
  rifeCustomOptDim: number
  rifeCustomMaxDim: number
  gmfssModel: string
  vfiMultiplier: number
  vfiClearCache: number

  rtxResizeType: string
  rtxScale: number
  rtxQuality: string

  videoCrf: number
  videoFormat: string
  videoPixFmt: string
}

export const LTX_WAN_KEYS = {
  audioNormEnabled: 'ltx-wan.audio_norm_enabled',
  distilledLoraEnabled: 'ltx-wan.distilled_lora_enabled',
  loraEnabledWan: 'ltx-wan.lora_enabled_wan',
  vfiEnabled: 'ltx-wan.vfi_enabled',
  rtxEnabled: 'ltx-wan.rtx_enabled',
  durationOptions: 'ltx-wan.duration_options',

  unet: 'ltx-wan.unet',
  weightDtype: 'ltx-wan.weight_dtype',
  clipGguf: 'ltx-wan.clip_gguf',
  clipEmbeddings: 'ltx-wan.clip_embeddings',
  videoVae: 'ltx-wan.video_vae',
  audioVae: 'ltx-wan.audio_vae',

  frameRate: 'ltx-wan.frame_rate',
  megapixels: 'ltx-wan.megapixels',
  resizeMultipleOf: 'ltx-wan.resize_multiple_of',
  resizeUpscaleMethod: 'ltx-wan.resize_upscale_method',
  imgCompression: 'ltx-wan.img_compression',
  sampler: 'ltx-wan.sampler',
  clownEta: 'ltx-wan.clown_eta',
  clownBongmath: 'ltx-wan.clown_bongmath',

  schedulerSteps: 'ltx-wan.scheduler_steps',
  schedulerMaxShift: 'ltx-wan.scheduler_max_shift',
  schedulerBaseShift: 'ltx-wan.scheduler_base_shift',
  schedulerStretch: 'ltx-wan.scheduler_stretch',
  schedulerTerminal: 'ltx-wan.scheduler_terminal',

  nagScale: 'ltx-wan.nag_scale',
  nagAlpha: 'ltx-wan.nag_alpha',
  nagTau: 'ltx-wan.nag_tau',

  audioNorm: 'ltx-wan.audio_norm',
  identityGuidanceScale: 'ltx-wan.identity_guidance_scale',
  identityStartPercent: 'ltx-wan.identity_start_percent',
  identityEndPercent: 'ltx-wan.identity_end_percent',
  idLoraName: 'ltx-wan.id_lora_name',
  idLoraStrength: 'ltx-wan.id_lora_strength',

  distilledLoraName: 'ltx-wan.distilled_lora_name',
  distilledLoraStrength: 'ltx-wan.distilled_lora_strength',

  negativePromptLtx: 'ltx-wan.negative_prompt_ltx',

  unetWan: 'ltx-wan.unet_wan',
  clipWan: 'ltx-wan.clip_wan',
  vaeWan: 'ltx-wan.vae_wan',
  shift: 'ltx-wan.shift',

  cfgWan: 'ltx-wan.cfg_wan',

  schedulerWan: 'ltx-wan.scheduler_wan',
  stepsWan: 'ltx-wan.steps_wan',
  denoiseWan: 'ltx-wan.denoise_wan',
  sigmasWan: 'ltx-wan.sigmas_wan',

  nagScaleWan: 'ltx-wan.nag_scale_wan',
  nagAlphaWan: 'ltx-wan.nag_alpha_wan',
  nagTauWan: 'ltx-wan.nag_tau_wan',

  negativePromptWan: 'ltx-wan.negative_prompt_wan',
  blocksToSwap: 'ltx-wan.blocks_to_swap',
  prefetchBlocks: 'ltx-wan.prefetch_blocks',
  disableWindowReinject: 'ltx-wan.disable_window_reinject',
  propagateX0: 'ltx-wan.propagate_x0',
  propagateX0Strength: 'ltx-wan.propagate_x0_strength',

  vfiMethod: 'ltx-wan.vfi_method',
  rifeModel: 'ltx-wan.rife_model',
  rifePrecision: 'ltx-wan.rife_precision',
  rifeResolutionProfile: 'ltx-wan.rife_resolution_profile',
  rifeCustomMinDim: 'ltx-wan.rife_custom_min_dim',
  rifeCustomOptDim: 'ltx-wan.rife_custom_opt_dim',
  rifeCustomMaxDim: 'ltx-wan.rife_custom_max_dim',
  gmfssModel: 'ltx-wan.gmfss_model',
  vfiMultiplier: 'ltx-wan.vfi_multiplier',
  vfiClearCache: 'ltx-wan.vfi_clear_cache',

  rtxResizeType: 'ltx-wan.rtx_resize_type',
  rtxScale: 'ltx-wan.rtx_scale',
  rtxQuality: 'ltx-wan.rtx_quality',

  videoCrf: 'ltx-wan.video_crf',
  videoFormat: 'ltx-wan.video_format',
  videoPixFmt: 'ltx-wan.video_pix_fmt',
} as const

export async function getLtxWanSettings(): Promise<LtxWanSettings> {
  const keys = Object.values(LTX_WAN_KEYS)
  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: keys } },
  })
  const map = buildSettingsMap(settings, LTX_WAN_KEYS)
  const k = LTX_WAN_KEYS

  return {
    audioNormEnabled: map.get(k.audioNormEnabled)! === 'true',
    distilledLoraEnabled: map.get(k.distilledLoraEnabled)! === 'true',
    loraEnabledWan: map.get(k.loraEnabledWan)! === 'true',
    vfiEnabled: map.get(k.vfiEnabled)! === 'true',
    rtxEnabled: map.get(k.rtxEnabled)! === 'true',
    durationOptions: map.get(k.durationOptions)!.split(',').map(Number),

    unet: map.get(k.unet)!,
    weightDtype: map.get(k.weightDtype)!,
    clipGguf: map.get(k.clipGguf)!,
    clipEmbeddings: map.get(k.clipEmbeddings)!,
    videoVae: map.get(k.videoVae)!,
    audioVae: map.get(k.audioVae)!,

    frameRate: parseInt(map.get(k.frameRate)!, 10),
    megapixels: parseFloat(map.get(k.megapixels)!),
    resizeMultipleOf: parseInt(map.get(k.resizeMultipleOf)!, 10),
    resizeUpscaleMethod: map.get(k.resizeUpscaleMethod)!,
    imgCompression: parseInt(map.get(k.imgCompression)!, 10),
    sampler: map.get(k.sampler)!,
    clownEta: parseFloat(map.get(k.clownEta)!),
    clownBongmath: map.get(k.clownBongmath)! === 'true',

    schedulerSteps: parseInt(map.get(k.schedulerSteps)!, 10),
    schedulerMaxShift: parseFloat(map.get(k.schedulerMaxShift)!),
    schedulerBaseShift: parseFloat(map.get(k.schedulerBaseShift)!),
    schedulerStretch: map.get(k.schedulerStretch)! === 'true',
    schedulerTerminal: parseFloat(map.get(k.schedulerTerminal)!),

    nagScale: parseFloat(map.get(k.nagScale)!),
    nagAlpha: parseFloat(map.get(k.nagAlpha)!),
    nagTau: parseFloat(map.get(k.nagTau)!),

    audioNorm: map.get(k.audioNorm)!,
    identityGuidanceScale: parseFloat(map.get(k.identityGuidanceScale)!),
    identityStartPercent: parseFloat(map.get(k.identityStartPercent)!),
    identityEndPercent: parseFloat(map.get(k.identityEndPercent)!),
    idLoraName: map.get(k.idLoraName)!,
    idLoraStrength: parseFloat(map.get(k.idLoraStrength)!),

    distilledLoraName: map.get(k.distilledLoraName)!,
    distilledLoraStrength: parseFloat(map.get(k.distilledLoraStrength)!),

    negativePromptLtx: map.get(k.negativePromptLtx)!,

    unetWan: map.get(k.unetWan)!,
    clipWan: map.get(k.clipWan)!,
    vaeWan: map.get(k.vaeWan)!,
    shift: parseFloat(map.get(k.shift)!),

    cfgWan: parseFloat(map.get(k.cfgWan)!),

    schedulerWan: map.get(k.schedulerWan)!,
    stepsWan: parseInt(map.get(k.stepsWan)!, 10),
    denoiseWan: parseFloat(map.get(k.denoiseWan)!),
    sigmasWan: map.get(k.sigmasWan)!,

    nagScaleWan: parseFloat(map.get(k.nagScaleWan)!),
    nagAlphaWan: parseFloat(map.get(k.nagAlphaWan)!),
    nagTauWan: parseFloat(map.get(k.nagTauWan)!),

    negativePromptWan: map.get(k.negativePromptWan)!,
    blocksToSwap: parseInt(map.get(k.blocksToSwap)!, 10),
    prefetchBlocks: parseInt(map.get(k.prefetchBlocks)!, 10),
    disableWindowReinject: map.get(k.disableWindowReinject)! === 'true',
    propagateX0: map.get(k.propagateX0)! === 'true',
    propagateX0Strength: parseFloat(map.get(k.propagateX0Strength)!),

    vfiMethod: map.get(k.vfiMethod)!,
    rifeModel: map.get(k.rifeModel)!,
    rifePrecision: map.get(k.rifePrecision)!,
    rifeResolutionProfile: map.get(k.rifeResolutionProfile)!,
    rifeCustomMinDim: parseInt(map.get(k.rifeCustomMinDim)!, 10),
    rifeCustomOptDim: parseInt(map.get(k.rifeCustomOptDim)!, 10),
    rifeCustomMaxDim: parseInt(map.get(k.rifeCustomMaxDim)!, 10),
    gmfssModel: map.get(k.gmfssModel)!,
    vfiMultiplier: parseInt(map.get(k.vfiMultiplier)!, 10),
    vfiClearCache: parseInt(map.get(k.vfiClearCache)!, 10),

    rtxResizeType: map.get(k.rtxResizeType)!,
    rtxScale: parseFloat(map.get(k.rtxScale)!),
    rtxQuality: map.get(k.rtxQuality)!,

    videoCrf: parseInt(map.get(k.videoCrf)!, 10),
    videoFormat: map.get(k.videoFormat)!,
    videoPixFmt: map.get(k.videoPixFmt)!,
  }
}

export async function getEnabledModels(): Promise<VideoModel[]> {
  const rows = await prisma.systemSetting.findMany({
    where: {
      key: {
        in: Object.values(MODEL_ENABLED_KEYS),
      },
    },
  })
  const values = new Map(rows.map(row => [row.key, row.value]))

  return ([
    ['wan', MODEL_ENABLED_KEYS.wan],
    ['ltx', MODEL_ENABLED_KEYS.ltx],
    ['ltx-wan', MODEL_ENABLED_KEYS['ltx-wan']],
  ] as const)
    .filter(([, key]) => values.get(key) !== 'false')
    .map(([model]) => model)
}
