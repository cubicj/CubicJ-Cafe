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

export interface LtxLoraChainItem {
  id: string;
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

export interface LtxaSettings {
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
  rtxEnabled: boolean;
  rtxResizeType: string;
  rtxScale: number;
  rtxQuality: string;
  sfwLoraChain: LtxLoraChainItem[];
  nsfwLoraChain: LtxLoraChainItem[];
  idLora: LtxLoraSlotSettings;
  videoCrf: number;
  videoFormat: string;
  videoPixFmt: string;
}

export const MODEL_ENABLED_KEYS = {
  wan: 'wan.enabled',
  ltxa: 'ltxa.enabled',
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

export const LTXA_KEYS = {
  endImageEnabled: 'ltxa.end_image_enabled',
  checkpoint: 'ltxa.checkpoint',
  textEncoder: 'ltxa.text_encoder',
  negativePrompt: 'ltxa.negative_prompt',
  videoConditioningPrompt: 'ltxa.video_conditioning_prompt',
  audioConditioningPrompt: 'ltxa.audio_conditioning_prompt',
  frameRate: 'ltxa.frame_rate',
  durationOptions: 'ltxa.duration_options',
  frameBase: 'ltxa.frame_base',
  megapixels: 'ltxa.megapixels',
  resizeMultipleOf: 'ltxa.resize_multiple_of',
  resizeUpscaleMethod: 'ltxa.resize_upscale_method',
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
  guideFrameIndex: 'ltxa.guide_frame_index',
  guideStrength: 'ltxa.guide_strength',
  guideCrf: 'ltxa.guide_crf',
  guideBlurRadius: 'ltxa.guide_blur_radius',
  guideInterpolation: 'ltxa.guide_interpolation',
  guideCrop: 'ltxa.guide_crop',
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
  secondPassAnchorStrength: 'ltxa.second_pass_anchor_strength',
  secondPassAnchorCacheAtStep: 'ltxa.second_pass_anchor_cache_at_step',
  secondPassAnchorSimilarityThreshold: 'ltxa.second_pass_anchor_similarity_threshold',
  secondPassAnchorDecayWithDistance: 'ltxa.second_pass_anchor_decay_with_distance',
  secondPassAnchorEnergyThreshold: 'ltxa.second_pass_anchor_energy_threshold',
  secondPassAnchorBypass: 'ltxa.second_pass_anchor_bypass',
  secondPassAnchorDebug: 'ltxa.second_pass_anchor_debug',
  secondPassAnchorAdvancedMode: 'ltxa.second_pass_anchor_advanced_mode',
  secondPassAnchorCacheMode: 'ltxa.second_pass_anchor_cache_mode',
  secondPassAnchorForwardsPerStep: 'ltxa.second_pass_anchor_forwards_per_step',
  secondPassAnchorCacheWarmup: 'ltxa.second_pass_anchor_cache_warmup',
  secondPassAnchorFrame: 'ltxa.second_pass_anchor_frame',
  secondPassAnchorDepthCurve: 'ltxa.second_pass_anchor_depth_curve',
  secondPassAnchorBlockIndexFilter: 'ltxa.second_pass_anchor_block_index_filter',
  rtxEnabled: 'ltxa.rtx_enabled',
  rtxResizeType: 'ltxa.rtx_resize_type',
  rtxScale: 'ltxa.rtx_scale',
  rtxQuality: 'ltxa.rtx_quality',
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

function parseLtxLoraChain(map: Map<string, string>, key: string): LtxLoraChainItem[] {
  const raw = map.get(key)!;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid LTX LoRA chain JSON: ${key}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`Invalid LTX LoRA chain shape: ${key}`);
  }

  return parsed.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Invalid LTX LoRA chain item at ${key}[${index}]`);
    }
    const row = item as Record<string, unknown>;
    const requiredString = typeof row.id === 'string' && typeof row.name === 'string';
    const requiredBoolean = typeof row.enabled === 'boolean';
    const requiredNumbers =
      typeof row.strength === 'number' &&
      typeof row.video === 'number' &&
      typeof row.videoToAudio === 'number' &&
      typeof row.audio === 'number' &&
      typeof row.audioToVideo === 'number' &&
      typeof row.other === 'number';

    if (!requiredString || !requiredBoolean || !requiredNumbers) {
      throw new Error(`Invalid LTX LoRA chain item at ${key}[${index}]`);
    }

    const id = row.id as string;
    const enabled = row.enabled as boolean;
    const name = row.name as string;
    const strength = row.strength as number;
    const video = row.video as number;
    const videoToAudio = row.videoToAudio as number;
    const audio = row.audio as number;
    const audioToVideo = row.audioToVideo as number;
    const other = row.other as number;

    return {
      id,
      enabled,
      name,
      strength,
      video,
      videoToAudio,
      audio,
      audioToVideo,
      other,
    };
  });
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

export async function getLtxaSettings(): Promise<LtxaSettings> {
  const keys = Object.values(LTXA_KEYS);
  const settings = await prisma.systemSetting.findMany({ where: { key: { in: keys } } });
  const map = buildSettingsMap(settings, LTXA_KEYS);
  const k = LTXA_KEYS;
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
    rtxEnabled: map.get(k.rtxEnabled)! === 'true',
    rtxResizeType: map.get(k.rtxResizeType)!,
    rtxScale: parseLtxNumber(map, k.rtxScale),
    rtxQuality: map.get(k.rtxQuality)!,
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
    ['ltxa', MODEL_ENABLED_KEYS.ltxa],
    ['ltx-wan', MODEL_ENABLED_KEYS['ltx-wan']],
  ] as const)
    .filter(([, key]) => values.get(key) !== 'false')
    .map(([model]) => model)
}
