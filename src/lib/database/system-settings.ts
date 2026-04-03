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
  unetHigh: string;
  unetLow: string;
  clip: string;
  vae: string;
  vfiEnabled: boolean;
  rifeModel: string;
  rifePrecision: string;
  rifeResolutionProfile: string;
  rifeCustomMinDim: number;
  rifeCustomOptDim: number;
  rifeCustomMaxDim: number;
  vfiMethod: string;
  gmfssModel: string;
  colorMatchEnabled: boolean;
  colorMatchMethod: string;
  colorMatchStrength: number;
  rtxEnabled: boolean;
  loraEnabled: boolean;
  megapixels: number;
  shift: number;
  nagScale: number;
  nagAlpha: number;
  nagTau: number;
  stepsHigh: number;
  stepsLow: number;
  moeScheduler: string;
  moeBoundary: number;
  moeInterval: number;
  moeDenoise: number;
  length: number;
  sampler: string;
  negativePrompt: string;
  resizeMultipleOf: number;
  resizeUpscaleMethod: string;
  vfiClearCache: number;
  vfiMultiplier: number;
  rtxResizeType: string;
  rtxScale: number;
  rtxQuality: string;
  frameRate: number;
  videoCrf: number;
  videoFormat: string;
  videoPixFmt: string;
}

export interface LtxSharedSettings {
  passMode: '1pass' | '2pass';
  clipGguf: string;
  clipEmbeddings: string;
  audioVae: string;
  videoVae: string;
  frameRate: number;
  duration: number;
  megapixels: number;
  resizeMultipleOf: number;
  resizeUpscaleMethod: string;
  sampler: string;
  clownEta: number;
  clownBongmath: boolean;
  imgCompression: number;
  negativePrompt: string;
  loraEnabled: boolean;
  idLoraName: string;
  colorMatchEnabled: boolean;
  colorMatchMethod: string;
  colorMatchStrength: number;
  vfiEnabled: boolean;
  vfiMethod: string;
  vfiMultiplier: number;
  vfiClearCache: number;
  rifeModel: string;
  rifePrecision: string;
  rifeResolutionProfile: string;
  rifeCustomMinDim: number;
  rifeCustomOptDim: number;
  rifeCustomMaxDim: number;
  gmfssModel: string;
  rtxEnabled: boolean;
  rtxResizeType: string;
  rtxScale: number;
  rtxQuality: string;
  upscaleModel: string;
  videoCrf: number;
  videoFormat: string;
  videoPixFmt: string;
}

export interface Ltx1PassModeSettings {
  unet: string;
  weightDtype: string;
  nagScale: number;
  nagAlpha: number;
  nagTau: number;
  audioNormEnabled: boolean;
  audioNorm: string;
  schedulerSteps: number;
  schedulerMaxShift: number;
  schedulerBaseShift: number;
  schedulerStretch: boolean;
  schedulerTerminal: number;
  idLoraStrength: number;
  identityGuidanceScale: number;
  identityStartPercent: number;
  identityEndPercent: number;
  distilledLoraEnabled: boolean;
  distilledLoraName: string;
  distilledLoraStrength: number;
}

export interface Ltx2PassModeSettings {
  unet: string;
  weightDtype: string;
  nagScale: number;
  nagAlpha: number;
  nagTau: number;
  audioNorm1st: string;
  schedulerSteps: number;
  schedulerMaxShift: number;
  schedulerBaseShift: number;
  schedulerStretch: boolean;
  schedulerTerminal: number;
  idLoraStrength: number;
  identityGuidanceScale: number;
  identityStartPercent: number;
  identityEndPercent: number;
  unet2nd: string;
  weightDtype2nd: string;
  nagScale2nd: number;
  nagAlpha2nd: number;
  nagTau2nd: number;
  audioNorm2nd: string;
  sigmas2nd: string;
  idLoraStrength2nd: number;
  identityGuidanceScale2nd: number;
  identityStartPercent2nd: number;
  identityEndPercent2nd: number;
  distilledLoraEnabled: boolean;
  distilledLoraName: string;
  distilledLoraStrength: number;
}

export type Ltx1PassSettings = LtxSharedSettings & { passMode: '1pass' } & Ltx1PassModeSettings;
export type Ltx2PassSettings = LtxSharedSettings & { passMode: '2pass' } & Ltx2PassModeSettings;
export type LtxSettings = Ltx1PassSettings | Ltx2PassSettings;

export const WAN_KEYS = {
  unetHigh: 'wan.unet_high',
  unetLow: 'wan.unet_low',
  clip: 'wan.clip',
  vae: 'wan.vae',
  vfiEnabled: 'wan.vfi_enabled',
  rifeModel: 'wan.rife_model',
  rifePrecision: 'wan.rife_precision',
  rifeResolutionProfile: 'wan.rife_resolution_profile',
  rifeCustomMinDim: 'wan.rife_custom_min_dim',
  rifeCustomOptDim: 'wan.rife_custom_opt_dim',
  rifeCustomMaxDim: 'wan.rife_custom_max_dim',
  vfiMethod: 'wan.vfi_method',
  gmfssModel: 'wan.gmfss_model',
  colorMatchEnabled: 'wan.color_match_enabled',
  colorMatchMethod: 'wan.color_match_method',
  colorMatchStrength: 'wan.color_match_strength',
  rtxEnabled: 'wan.rtx_enabled',
  loraEnabled: 'wan.lora_enabled',
  megapixels: 'wan.megapixels',
  shift: 'wan.shift',
  nagScale: 'wan.nag_scale',
  nagAlpha: 'wan.nag_alpha',
  nagTau: 'wan.nag_tau',
  stepsHigh: 'wan.steps_high',
  stepsLow: 'wan.steps_low',
  moeScheduler: 'wan.moe_scheduler',
  moeBoundary: 'wan.moe_boundary',
  moeInterval: 'wan.moe_interval',
  moeDenoise: 'wan.moe_denoise',
  length: 'wan.length',
  sampler: 'wan.sampler',
  negativePrompt: 'wan.negative_prompt',
  resizeMultipleOf: 'wan.resize_multiple_of',
  resizeUpscaleMethod: 'wan.resize_upscale_method',
  vfiClearCache: 'wan.vfi_clear_cache',
  vfiMultiplier: 'wan.vfi_multiplier',
  rtxResizeType: 'wan.rtx_resize_type',
  rtxScale: 'wan.rtx_scale',
  rtxQuality: 'wan.rtx_quality',
  frameRate: 'wan.frame_rate',
  videoCrf: 'wan.video_crf',
  videoFormat: 'wan.video_format',
  videoPixFmt: 'wan.video_pix_fmt',
} as const;

export const LTX_SHARED_KEYS = {
  passMode: 'ltx.pass_mode',
  clipGguf: 'ltx.clip_gguf',
  clipEmbeddings: 'ltx.clip_embeddings',
  audioVae: 'ltx.audio_vae',
  videoVae: 'ltx.video_vae',
  frameRate: 'ltx.frame_rate',
  duration: 'ltx.duration',
  megapixels: 'ltx.megapixels',
  resizeMultipleOf: 'ltx.resize_multiple_of',
  resizeUpscaleMethod: 'ltx.resize_upscale_method',
  sampler: 'ltx.sampler',
  clownEta: 'ltx.clown_eta',
  clownBongmath: 'ltx.clown_bongmath',
  imgCompression: 'ltx.img_compression',
  negativePrompt: 'ltx.negative_prompt',
  loraEnabled: 'ltx.lora_enabled',
  idLoraName: 'ltx.id_lora_name',
  colorMatchEnabled: 'ltx.color_match_enabled',
  colorMatchMethod: 'ltx.color_match_method',
  colorMatchStrength: 'ltx.color_match_strength',
  vfiEnabled: 'ltx.vfi_enabled',
  vfiMethod: 'ltx.vfi_method',
  vfiMultiplier: 'ltx.vfi_multiplier',
  vfiClearCache: 'ltx.vfi_clear_cache',
  rifeModel: 'ltx.rife_model',
  rifePrecision: 'ltx.rife_precision',
  rifeResolutionProfile: 'ltx.rife_resolution_profile',
  rifeCustomMinDim: 'ltx.rife_custom_min_dim',
  rifeCustomOptDim: 'ltx.rife_custom_opt_dim',
  rifeCustomMaxDim: 'ltx.rife_custom_max_dim',
  gmfssModel: 'ltx.gmfss_model',
  rtxEnabled: 'ltx.rtx_enabled',
  rtxResizeType: 'ltx.rtx_resize_type',
  rtxScale: 'ltx.rtx_scale',
  rtxQuality: 'ltx.rtx_quality',
  upscaleModel: 'ltx.upscale_model',
  videoCrf: 'ltx.video_crf',
  videoFormat: 'ltx.video_format',
  videoPixFmt: 'ltx.video_pix_fmt',
} as const;

export const LTX_1PASS_KEYS = {
  unet: 'ltx.1pass.unet',
  weightDtype: 'ltx.1pass.weight_dtype',
  nagScale: 'ltx.1pass.nag_scale',
  nagAlpha: 'ltx.1pass.nag_alpha',
  nagTau: 'ltx.1pass.nag_tau',
  audioNormEnabled: 'ltx.1pass.audio_norm_enabled',
  audioNorm: 'ltx.1pass.audio_norm',
  schedulerSteps: 'ltx.1pass.scheduler_steps',
  schedulerMaxShift: 'ltx.1pass.scheduler_max_shift',
  schedulerBaseShift: 'ltx.1pass.scheduler_base_shift',
  schedulerStretch: 'ltx.1pass.scheduler_stretch',
  schedulerTerminal: 'ltx.1pass.scheduler_terminal',
  idLoraStrength: 'ltx.1pass.id_lora_strength',
  identityGuidanceScale: 'ltx.1pass.identity_guidance_scale',
  identityStartPercent: 'ltx.1pass.identity_start_percent',
  identityEndPercent: 'ltx.1pass.identity_end_percent',
  distilledLoraEnabled: 'ltx.1pass.distilled_lora_enabled',
  distilledLoraName: 'ltx.1pass.distilled_lora_name',
  distilledLoraStrength: 'ltx.1pass.distilled_lora_strength',
} as const;

export const LTX_2PASS_KEYS = {
  unet: 'ltx.2pass.unet',
  weightDtype: 'ltx.2pass.weight_dtype',
  nagScale: 'ltx.2pass.nag_scale',
  nagAlpha: 'ltx.2pass.nag_alpha',
  nagTau: 'ltx.2pass.nag_tau',
  audioNorm1st: 'ltx.2pass.audio_norm_1st',
  schedulerSteps: 'ltx.2pass.scheduler_steps',
  schedulerMaxShift: 'ltx.2pass.scheduler_max_shift',
  schedulerBaseShift: 'ltx.2pass.scheduler_base_shift',
  schedulerStretch: 'ltx.2pass.scheduler_stretch',
  schedulerTerminal: 'ltx.2pass.scheduler_terminal',
  idLoraStrength: 'ltx.2pass.id_lora_strength',
  identityGuidanceScale: 'ltx.2pass.identity_guidance_scale',
  identityStartPercent: 'ltx.2pass.identity_start_percent',
  identityEndPercent: 'ltx.2pass.identity_end_percent',
  unet2nd: 'ltx.2pass.unet_2nd',
  weightDtype2nd: 'ltx.2pass.weight_dtype_2nd',
  nagScale2nd: 'ltx.2pass.nag_scale_2nd',
  nagAlpha2nd: 'ltx.2pass.nag_alpha_2nd',
  nagTau2nd: 'ltx.2pass.nag_tau_2nd',
  audioNorm2nd: 'ltx.2pass.audio_norm_2nd',
  sigmas2nd: 'ltx.2pass.sigmas_2nd',
  idLoraStrength2nd: 'ltx.2pass.id_lora_strength_2nd',
  identityGuidanceScale2nd: 'ltx.2pass.identity_guidance_scale_2nd',
  identityStartPercent2nd: 'ltx.2pass.identity_start_percent_2nd',
  identityEndPercent2nd: 'ltx.2pass.identity_end_percent_2nd',
  distilledLoraEnabled: 'ltx.2pass.distilled_lora_enabled',
  distilledLoraName: 'ltx.2pass.distilled_lora_name',
  distilledLoraStrength: 'ltx.2pass.distilled_lora_strength',
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
  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: keys } },
  });
  const map = buildSettingsMap(settings, WAN_KEYS);

  return {
    unetHigh: map.get(WAN_KEYS.unetHigh)!,
    unetLow: map.get(WAN_KEYS.unetLow)!,
    clip: map.get(WAN_KEYS.clip)!,
    vae: map.get(WAN_KEYS.vae)!,
    vfiEnabled: map.get(WAN_KEYS.vfiEnabled)! === 'true',
    rifeModel: map.get(WAN_KEYS.rifeModel)!,
    rifePrecision: map.get(WAN_KEYS.rifePrecision)!,
    rifeResolutionProfile: map.get(WAN_KEYS.rifeResolutionProfile)!,
    rifeCustomMinDim: parseInt(map.get(WAN_KEYS.rifeCustomMinDim)!, 10),
    rifeCustomOptDim: parseInt(map.get(WAN_KEYS.rifeCustomOptDim)!, 10),
    rifeCustomMaxDim: parseInt(map.get(WAN_KEYS.rifeCustomMaxDim)!, 10),
    vfiMethod: map.get(WAN_KEYS.vfiMethod)!,
    gmfssModel: map.get(WAN_KEYS.gmfssModel)!,
    colorMatchEnabled: map.get(WAN_KEYS.colorMatchEnabled)! === 'true',
    colorMatchMethod: map.get(WAN_KEYS.colorMatchMethod)!,
    colorMatchStrength: parseFloat(map.get(WAN_KEYS.colorMatchStrength)!),
    rtxEnabled: map.get(WAN_KEYS.rtxEnabled)! === 'true',
    loraEnabled: map.get(WAN_KEYS.loraEnabled)! === 'true',
    megapixels: parseFloat(map.get(WAN_KEYS.megapixels)!),
    shift: parseFloat(map.get(WAN_KEYS.shift)!),
    nagScale: parseFloat(map.get(WAN_KEYS.nagScale)!),
    nagAlpha: parseFloat(map.get(WAN_KEYS.nagAlpha)!),
    nagTau: parseFloat(map.get(WAN_KEYS.nagTau)!),
    stepsHigh: parseInt(map.get(WAN_KEYS.stepsHigh)!, 10),
    stepsLow: parseInt(map.get(WAN_KEYS.stepsLow)!, 10),
    moeScheduler: map.get(WAN_KEYS.moeScheduler)!,
    moeBoundary: parseFloat(map.get(WAN_KEYS.moeBoundary)!),
    moeInterval: parseFloat(map.get(WAN_KEYS.moeInterval)!),
    moeDenoise: parseFloat(map.get(WAN_KEYS.moeDenoise)!),
    length: parseInt(map.get(WAN_KEYS.length)!, 10),
    sampler: map.get(WAN_KEYS.sampler)!,
    negativePrompt: map.get(WAN_KEYS.negativePrompt)!,
    resizeMultipleOf: parseInt(map.get(WAN_KEYS.resizeMultipleOf)!, 10),
    resizeUpscaleMethod: map.get(WAN_KEYS.resizeUpscaleMethod)!,
    vfiClearCache: parseInt(map.get(WAN_KEYS.vfiClearCache)!, 10),
    vfiMultiplier: parseInt(map.get(WAN_KEYS.vfiMultiplier)!, 10),
    rtxResizeType: map.get(WAN_KEYS.rtxResizeType)!,
    rtxScale: parseFloat(map.get(WAN_KEYS.rtxScale)!),
    rtxQuality: map.get(WAN_KEYS.rtxQuality)!,
    frameRate: parseInt(map.get(WAN_KEYS.frameRate)!, 10),
    videoCrf: parseInt(map.get(WAN_KEYS.videoCrf)!, 10),
    videoFormat: map.get(WAN_KEYS.videoFormat)!,
    videoPixFmt: map.get(WAN_KEYS.videoPixFmt)!,
  };
}

export async function getLtxSettings(): Promise<LtxSettings> {
  const passModeSetting = await prisma.systemSetting.findUnique({
    where: { key: LTX_SHARED_KEYS.passMode },
  });
  const passMode = (passModeSetting?.value === '1pass' ? '1pass' : '2pass') as '1pass' | '2pass';

  const modeKeys = passMode === '1pass' ? LTX_1PASS_KEYS : LTX_2PASS_KEYS;
  const allKeys = [...Object.values(LTX_SHARED_KEYS), ...Object.values(modeKeys)];

  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: allKeys } },
  });
  const map = new Map<string, string>();
  for (const s of settings) {
    map.set(s.key, s.value);
  }

  const missing = allKeys.filter(k => !map.has(k) || !map.get(k));
  if (missing.length > 0) {
    throw new Error(`Required LTX settings missing: ${missing.join(', ')}`);
  }

  const shared: LtxSharedSettings = {
    passMode,
    clipGguf: map.get(LTX_SHARED_KEYS.clipGguf)!,
    clipEmbeddings: map.get(LTX_SHARED_KEYS.clipEmbeddings)!,
    audioVae: map.get(LTX_SHARED_KEYS.audioVae)!,
    videoVae: map.get(LTX_SHARED_KEYS.videoVae)!,
    frameRate: parseFloat(map.get(LTX_SHARED_KEYS.frameRate)!),
    duration: parseInt(map.get(LTX_SHARED_KEYS.duration)!, 10),
    megapixels: parseFloat(map.get(LTX_SHARED_KEYS.megapixels)!),
    resizeMultipleOf: parseInt(map.get(LTX_SHARED_KEYS.resizeMultipleOf)!, 10),
    resizeUpscaleMethod: map.get(LTX_SHARED_KEYS.resizeUpscaleMethod)!,
    sampler: map.get(LTX_SHARED_KEYS.sampler)!,
    clownEta: parseFloat(map.get(LTX_SHARED_KEYS.clownEta)!),
    clownBongmath: map.get(LTX_SHARED_KEYS.clownBongmath)! === 'true',
    imgCompression: parseInt(map.get(LTX_SHARED_KEYS.imgCompression)!, 10),
    negativePrompt: map.get(LTX_SHARED_KEYS.negativePrompt)!,
    loraEnabled: map.get(LTX_SHARED_KEYS.loraEnabled)! === 'true',
    idLoraName: map.get(LTX_SHARED_KEYS.idLoraName)!,
    colorMatchEnabled: map.get(LTX_SHARED_KEYS.colorMatchEnabled)! === 'true',
    colorMatchMethod: map.get(LTX_SHARED_KEYS.colorMatchMethod)!,
    colorMatchStrength: parseFloat(map.get(LTX_SHARED_KEYS.colorMatchStrength)!),
    vfiEnabled: map.get(LTX_SHARED_KEYS.vfiEnabled)! === 'true',
    vfiMethod: map.get(LTX_SHARED_KEYS.vfiMethod)!,
    vfiMultiplier: parseInt(map.get(LTX_SHARED_KEYS.vfiMultiplier)!, 10),
    vfiClearCache: parseInt(map.get(LTX_SHARED_KEYS.vfiClearCache)!, 10),
    rifeModel: map.get(LTX_SHARED_KEYS.rifeModel)!,
    rifePrecision: map.get(LTX_SHARED_KEYS.rifePrecision)!,
    rifeResolutionProfile: map.get(LTX_SHARED_KEYS.rifeResolutionProfile)!,
    rifeCustomMinDim: parseInt(map.get(LTX_SHARED_KEYS.rifeCustomMinDim)!, 10),
    rifeCustomOptDim: parseInt(map.get(LTX_SHARED_KEYS.rifeCustomOptDim)!, 10),
    rifeCustomMaxDim: parseInt(map.get(LTX_SHARED_KEYS.rifeCustomMaxDim)!, 10),
    gmfssModel: map.get(LTX_SHARED_KEYS.gmfssModel)!,
    rtxEnabled: map.get(LTX_SHARED_KEYS.rtxEnabled)! === 'true',
    rtxResizeType: map.get(LTX_SHARED_KEYS.rtxResizeType)!,
    rtxScale: parseFloat(map.get(LTX_SHARED_KEYS.rtxScale)!),
    rtxQuality: map.get(LTX_SHARED_KEYS.rtxQuality)!,
    upscaleModel: map.get(LTX_SHARED_KEYS.upscaleModel)!,
    videoCrf: parseInt(map.get(LTX_SHARED_KEYS.videoCrf)!, 10),
    videoFormat: map.get(LTX_SHARED_KEYS.videoFormat)!,
    videoPixFmt: map.get(LTX_SHARED_KEYS.videoPixFmt)!,
  };

  if (passMode === '1pass') {
    const k = LTX_1PASS_KEYS;
    return {
      ...shared,
      passMode: '1pass',
      unet: map.get(k.unet)!,
      weightDtype: map.get(k.weightDtype)!,
      nagScale: parseFloat(map.get(k.nagScale)!),
      nagAlpha: parseFloat(map.get(k.nagAlpha)!),
      nagTau: parseFloat(map.get(k.nagTau)!),
      audioNormEnabled: map.get(k.audioNormEnabled)! === 'true',
      audioNorm: map.get(k.audioNorm)!,
      schedulerSteps: parseInt(map.get(k.schedulerSteps)!, 10),
      schedulerMaxShift: parseFloat(map.get(k.schedulerMaxShift)!),
      schedulerBaseShift: parseFloat(map.get(k.schedulerBaseShift)!),
      schedulerStretch: map.get(k.schedulerStretch)! === 'true',
      schedulerTerminal: parseFloat(map.get(k.schedulerTerminal)!),
      idLoraStrength: parseFloat(map.get(k.idLoraStrength)!),
      identityGuidanceScale: parseFloat(map.get(k.identityGuidanceScale)!),
      identityStartPercent: parseFloat(map.get(k.identityStartPercent)!),
      identityEndPercent: parseFloat(map.get(k.identityEndPercent)!),
      distilledLoraEnabled: map.get(k.distilledLoraEnabled)! === 'true',
      distilledLoraName: map.get(k.distilledLoraName)!,
      distilledLoraStrength: parseFloat(map.get(k.distilledLoraStrength)!),
    };
  }

  const k = LTX_2PASS_KEYS;
  return {
    ...shared,
    passMode: '2pass',
    unet: map.get(k.unet)!,
    weightDtype: map.get(k.weightDtype)!,
    nagScale: parseFloat(map.get(k.nagScale)!),
    nagAlpha: parseFloat(map.get(k.nagAlpha)!),
    nagTau: parseFloat(map.get(k.nagTau)!),
    audioNorm1st: map.get(k.audioNorm1st)!,
    schedulerSteps: parseInt(map.get(k.schedulerSteps)!, 10),
    schedulerMaxShift: parseFloat(map.get(k.schedulerMaxShift)!),
    schedulerBaseShift: parseFloat(map.get(k.schedulerBaseShift)!),
    schedulerStretch: map.get(k.schedulerStretch)! === 'true',
    schedulerTerminal: parseFloat(map.get(k.schedulerTerminal)!),
    idLoraStrength: parseFloat(map.get(k.idLoraStrength)!),
    identityGuidanceScale: parseFloat(map.get(k.identityGuidanceScale)!),
    identityStartPercent: parseFloat(map.get(k.identityStartPercent)!),
    identityEndPercent: parseFloat(map.get(k.identityEndPercent)!),
    unet2nd: map.get(k.unet2nd)!,
    weightDtype2nd: map.get(k.weightDtype2nd)!,
    nagScale2nd: parseFloat(map.get(k.nagScale2nd)!),
    nagAlpha2nd: parseFloat(map.get(k.nagAlpha2nd)!),
    nagTau2nd: parseFloat(map.get(k.nagTau2nd)!),
    audioNorm2nd: map.get(k.audioNorm2nd)!,
    sigmas2nd: map.get(k.sigmas2nd)!,
    idLoraStrength2nd: parseFloat(map.get(k.idLoraStrength2nd)!),
    identityGuidanceScale2nd: parseFloat(map.get(k.identityGuidanceScale2nd)!),
    identityStartPercent2nd: parseFloat(map.get(k.identityStartPercent2nd)!),
    identityEndPercent2nd: parseFloat(map.get(k.identityEndPercent2nd)!),
    distilledLoraEnabled: map.get(k.distilledLoraEnabled)! === 'true',
    distilledLoraName: map.get(k.distilledLoraName)!,
    distilledLoraStrength: parseFloat(map.get(k.distilledLoraStrength)!),
  };
}
