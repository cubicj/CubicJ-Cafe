import { prisma } from './prisma';
import { createLogger } from '@/lib/logger';

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
  clipVisionModel: string;
  basePrecision: string;
  quantization: string;
  attentionMode: string;
  blocksToSwap: number;
  offloadImgEmb: boolean;
  offloadTxtEmb: boolean;
  vaceBlocksToSwap: number;
  prefetchBlocks: number;
  contextFrames: number;
  contextStride: number;
  contextOverlap: number;
  fuseMethod: string;
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
}

export interface LtxSettings {
  unet: string;
  weightDtype: string;
  audioVae: string;
  videoVae: string;
  clipGguf: string;
  clipEmbeddings: string;
  sampler: string;
  clownEta: number;
  clownBongmath: boolean;
  imgCompression: number;
  negativePrompt: string;
  frameRate: number;
  megapixels: number;
  resizeMultipleOf: number;
  resizeUpscaleMethod: string;
  schedulerSteps: number;
  schedulerMaxShift: number;
  schedulerBaseShift: number;
  schedulerStretch: boolean;
  schedulerTerminal: number;
  nagScale: number;
  nagAlpha: number;
  nagTau: number;
  audioNormEnabled: boolean;
  audioNorm: string;
  identityGuidanceScale: number;
  identityStartPercent: number;
  identityEndPercent: number;
  distilledLoraEnabled: boolean;
  distilledLoraName: string;
  distilledLoraStrength: number;
  idLoraName: string;
  idLoraStrength: number;
  rtxEnabled: boolean;
  rtxResizeType: string;
  rtxScale: number;
  rtxQuality: string;
  videoCrf: number;
  videoFormat: string;
  videoPixFmt: string;
  durationOptions: number[];
}

export const WAN_KEYS = {
  wanvideoModelHigh: 'wan.wanvideo_model_high',
  wanvideoModelLow: 'wan.wanvideo_model_low',
  t5Encoder: 'wan.t5_encoder',
  wanvideoVae: 'wan.wanvideo_vae',
  clipVisionModel: 'wan.clip_vision_model',
  basePrecision: 'wan.base_precision',
  quantization: 'wan.quantization',
  attentionMode: 'wan.attention_mode',
  blocksToSwap: 'wan.blocks_to_swap',
  offloadImgEmb: 'wan.offload_img_emb',
  offloadTxtEmb: 'wan.offload_txt_emb',
  vaceBlocksToSwap: 'wan.vace_blocks_to_swap',
  prefetchBlocks: 'wan.prefetch_blocks',
  contextFrames: 'wan.context_frames',
  contextStride: 'wan.context_stride',
  contextOverlap: 'wan.context_overlap',
  fuseMethod: 'wan.fuse_method',
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
} as const;

export const LTX_KEYS = {
  unet: 'ltx.unet',
  weightDtype: 'ltx.weight_dtype',
  audioVae: 'ltx.audio_vae',
  videoVae: 'ltx.video_vae',
  clipGguf: 'ltx.clip_gguf',
  clipEmbeddings: 'ltx.clip_embeddings',
  sampler: 'ltx.sampler',
  clownEta: 'ltx.clown_eta',
  clownBongmath: 'ltx.clown_bongmath',
  imgCompression: 'ltx.img_compression',
  negativePrompt: 'ltx.negative_prompt',
  frameRate: 'ltx.frame_rate',
  megapixels: 'ltx.megapixels',
  resizeMultipleOf: 'ltx.resize_multiple_of',
  resizeUpscaleMethod: 'ltx.resize_upscale_method',
  schedulerSteps: 'ltx.scheduler_steps',
  schedulerMaxShift: 'ltx.scheduler_max_shift',
  schedulerBaseShift: 'ltx.scheduler_base_shift',
  schedulerStretch: 'ltx.scheduler_stretch',
  schedulerTerminal: 'ltx.scheduler_terminal',
  nagScale: 'ltx.nag_scale',
  nagAlpha: 'ltx.nag_alpha',
  nagTau: 'ltx.nag_tau',
  audioNormEnabled: 'ltx.audio_norm_enabled',
  audioNorm: 'ltx.audio_norm',
  identityGuidanceScale: 'ltx.identity_guidance_scale',
  identityStartPercent: 'ltx.identity_start_percent',
  identityEndPercent: 'ltx.identity_end_percent',
  distilledLoraEnabled: 'ltx.distilled_lora_enabled',
  distilledLoraName: 'ltx.distilled_lora_name',
  distilledLoraStrength: 'ltx.distilled_lora_strength',
  idLoraName: 'ltx.id_lora_name',
  idLoraStrength: 'ltx.id_lora_strength',
  rtxEnabled: 'ltx.rtx_enabled',
  rtxResizeType: 'ltx.rtx_resize_type',
  rtxScale: 'ltx.rtx_scale',
  rtxQuality: 'ltx.rtx_quality',
  videoCrf: 'ltx.video_crf',
  videoFormat: 'ltx.video_format',
  videoPixFmt: 'ltx.video_pix_fmt',
  durationOptions: 'ltx.duration_options',
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
    clipVisionModel: map.get(k.clipVisionModel)!,
    basePrecision: map.get(k.basePrecision)!,
    quantization: map.get(k.quantization)!,
    attentionMode: map.get(k.attentionMode)!,
    blocksToSwap: parseInt(map.get(k.blocksToSwap)!, 10),
    offloadImgEmb: map.get(k.offloadImgEmb)! === 'true',
    offloadTxtEmb: map.get(k.offloadTxtEmb)! === 'true',
    vaceBlocksToSwap: parseInt(map.get(k.vaceBlocksToSwap)!, 10),
    prefetchBlocks: parseInt(map.get(k.prefetchBlocks)!, 10),
    contextFrames: parseInt(map.get(k.contextFrames)!, 10),
    contextStride: parseInt(map.get(k.contextStride)!, 10),
    contextOverlap: parseInt(map.get(k.contextOverlap)!, 10),
    fuseMethod: map.get(k.fuseMethod)!,
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
  };
}

export async function getLtxSettings(): Promise<LtxSettings> {
  const keys = Object.values(LTX_KEYS);
  const settings = await prisma.systemSetting.findMany({ where: { key: { in: keys } } });
  const map = buildSettingsMap(settings, LTX_KEYS);
  const k = LTX_KEYS;
  return {
    unet: map.get(k.unet)!,
    weightDtype: map.get(k.weightDtype)!,
    audioVae: map.get(k.audioVae)!,
    videoVae: map.get(k.videoVae)!,
    clipGguf: map.get(k.clipGguf)!,
    clipEmbeddings: map.get(k.clipEmbeddings)!,
    sampler: map.get(k.sampler)!,
    clownEta: parseFloat(map.get(k.clownEta)!),
    clownBongmath: map.get(k.clownBongmath)! === 'true',
    imgCompression: parseInt(map.get(k.imgCompression)!, 10),
    negativePrompt: map.get(k.negativePrompt)!,
    frameRate: parseFloat(map.get(k.frameRate)!),
    megapixels: parseFloat(map.get(k.megapixels)!),
    resizeMultipleOf: parseInt(map.get(k.resizeMultipleOf)!, 10),
    resizeUpscaleMethod: map.get(k.resizeUpscaleMethod)!,
    schedulerSteps: parseInt(map.get(k.schedulerSteps)!, 10),
    schedulerMaxShift: parseFloat(map.get(k.schedulerMaxShift)!),
    schedulerBaseShift: parseFloat(map.get(k.schedulerBaseShift)!),
    schedulerStretch: map.get(k.schedulerStretch)! === 'true',
    schedulerTerminal: parseFloat(map.get(k.schedulerTerminal)!),
    nagScale: parseFloat(map.get(k.nagScale)!),
    nagAlpha: parseFloat(map.get(k.nagAlpha)!),
    nagTau: parseFloat(map.get(k.nagTau)!),
    audioNormEnabled: map.get(k.audioNormEnabled)! === 'true',
    audioNorm: map.get(k.audioNorm)!,
    identityGuidanceScale: parseFloat(map.get(k.identityGuidanceScale)!),
    identityStartPercent: parseFloat(map.get(k.identityStartPercent)!),
    identityEndPercent: parseFloat(map.get(k.identityEndPercent)!),
    distilledLoraEnabled: map.get(k.distilledLoraEnabled)! === 'true',
    distilledLoraName: map.get(k.distilledLoraName)!,
    distilledLoraStrength: parseFloat(map.get(k.distilledLoraStrength)!),
    idLoraName: map.get(k.idLoraName)!,
    idLoraStrength: parseFloat(map.get(k.idLoraStrength)!),
    rtxEnabled: map.get(k.rtxEnabled)! === 'true',
    rtxResizeType: map.get(k.rtxResizeType)!,
    rtxScale: parseFloat(map.get(k.rtxScale)!),
    rtxQuality: map.get(k.rtxQuality)!,
    videoCrf: parseInt(map.get(k.videoCrf)!, 10),
    videoFormat: map.get(k.videoFormat)!,
    videoPixFmt: map.get(k.videoPixFmt)!,
    durationOptions: map.get(k.durationOptions)!.split(',').map(Number),
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
  clipVisionModel: string
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
  clipVisionModel: 'ltx-wan.clip_vision_model',
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
    clipVisionModel: map.get(k.clipVisionModel)!,
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
