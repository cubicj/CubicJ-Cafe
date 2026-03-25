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
  vfiCheckpoint: string;
  loraEnabled: boolean;
  megapixels: number;
  shift: number;
  nagScale: number;
  nagAlpha: number;
  nagTau: number;
  stepsHigh: number;
  stepsLow: number;
  sigmaStartYHigh: number;
  sigmaEndYHigh: number;
  sigmaStartYLow: number;
  sigmaEndYLow: number;
  sigmaCurveData: string;
  sigmaPreset: string;
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

export interface LtxSettings {
  unet: string;
  weightDtype: string;
  clipGguf: string;
  clipEmbeddings: string;
  audioVae: string;
  videoVae: string;
  spatialUpscaler: string;
  loraEnabled: boolean;
  cfg: number;
  sampler1stPass: string;
  sampler2ndPass: string;
  sigmas1stPass: string;
  sigmas2ndPass: string;
  audioNorm1stPass: string;
  audioNorm2ndPass: string;
  nagScale: number;
  duration: number;
  frameRate: number;
  megapixels: number;
  resizeMultipleOf: number;
  resizeUpscaleMethod: string;
  imgCompression: number;
  negativePrompt: string;
  vaeSpatialTiles: number;
  vaeSpatialOverlap: number;
  vaeTemporalTileLength: number;
  vaeTemporalOverlap: number;
  rtxResizeType: string;
  rtxScale: number;
  rtxQuality: string;
}

const WAN_KEYS = {
  unetHigh: 'wan.unet_high',
  unetLow: 'wan.unet_low',
  clip: 'wan.clip',
  vae: 'wan.vae',
  vfiCheckpoint: 'wan.vfi_checkpoint',
  loraEnabled: 'wan.lora_enabled',
  megapixels: 'wan.megapixels',
  shift: 'wan.shift',
  nagScale: 'wan.nag_scale',
  nagAlpha: 'wan.nag_alpha',
  nagTau: 'wan.nag_tau',
  stepsHigh: 'wan.steps_high',
  stepsLow: 'wan.steps_low',
  sigmaStartYHigh: 'wan.sigma_start_y_high',
  sigmaEndYHigh: 'wan.sigma_end_y_high',
  sigmaStartYLow: 'wan.sigma_start_y_low',
  sigmaEndYLow: 'wan.sigma_end_y_low',
  sigmaCurveData: 'wan.sigma_curve_data',
  sigmaPreset: 'wan.sigma_preset',
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

const LTX_KEYS = {
  unet: 'ltx.unet',
  weightDtype: 'ltx.weight_dtype',
  clipGguf: 'ltx.clip_gguf',
  clipEmbeddings: 'ltx.clip_embeddings',
  audioVae: 'ltx.audio_vae',
  videoVae: 'ltx.video_vae',
  spatialUpscaler: 'ltx.spatial_upscaler',
  loraEnabled: 'ltx.lora_enabled',
  cfg: 'ltx.cfg',
  sampler1stPass: 'ltx.sampler_1st_pass',
  sampler2ndPass: 'ltx.sampler_2nd_pass',
  sigmas1stPass: 'ltx.sigmas_1st_pass',
  sigmas2ndPass: 'ltx.sigmas_2nd_pass',
  audioNorm1stPass: 'ltx.audio_norm_1st_pass',
  audioNorm2ndPass: 'ltx.audio_norm_2nd_pass',
  nagScale: 'ltx.nag_scale',
  duration: 'ltx.duration',
  frameRate: 'ltx.frame_rate',
  megapixels: 'ltx.megapixels',
  resizeMultipleOf: 'ltx.resize_multiple_of',
  resizeUpscaleMethod: 'ltx.resize_upscale_method',
  imgCompression: 'ltx.img_compression',
  negativePrompt: 'ltx.negative_prompt',
  vaeSpatialTiles: 'ltx.vae_spatial_tiles',
  vaeSpatialOverlap: 'ltx.vae_spatial_overlap',
  vaeTemporalTileLength: 'ltx.vae_temporal_tile_length',
  vaeTemporalOverlap: 'ltx.vae_temporal_overlap',
  rtxResizeType: 'ltx.rtx_resize_type',
  rtxScale: 'ltx.rtx_scale',
  rtxQuality: 'ltx.rtx_quality',
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
    vfiCheckpoint: map.get(WAN_KEYS.vfiCheckpoint)!,
    loraEnabled: map.get(WAN_KEYS.loraEnabled)! === 'true',
    megapixels: parseFloat(map.get(WAN_KEYS.megapixels)!),
    shift: parseFloat(map.get(WAN_KEYS.shift)!),
    nagScale: parseFloat(map.get(WAN_KEYS.nagScale)!),
    nagAlpha: parseFloat(map.get(WAN_KEYS.nagAlpha)!),
    nagTau: parseFloat(map.get(WAN_KEYS.nagTau)!),
    stepsHigh: parseInt(map.get(WAN_KEYS.stepsHigh)!, 10),
    stepsLow: parseInt(map.get(WAN_KEYS.stepsLow)!, 10),
    sigmaStartYHigh: parseFloat(map.get(WAN_KEYS.sigmaStartYHigh)!),
    sigmaEndYHigh: parseFloat(map.get(WAN_KEYS.sigmaEndYHigh)!),
    sigmaStartYLow: parseFloat(map.get(WAN_KEYS.sigmaStartYLow)!),
    sigmaEndYLow: parseFloat(map.get(WAN_KEYS.sigmaEndYLow)!),
    sigmaCurveData: map.get(WAN_KEYS.sigmaCurveData)!,
    sigmaPreset: map.get(WAN_KEYS.sigmaPreset)!,
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
  const keys = Object.values(LTX_KEYS);
  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: keys } },
  });
  const map = buildSettingsMap(settings, LTX_KEYS);

  return {
    unet: map.get(LTX_KEYS.unet)!,
    weightDtype: map.get(LTX_KEYS.weightDtype)!,
    clipGguf: map.get(LTX_KEYS.clipGguf)!,
    clipEmbeddings: map.get(LTX_KEYS.clipEmbeddings)!,
    audioVae: map.get(LTX_KEYS.audioVae)!,
    videoVae: map.get(LTX_KEYS.videoVae)!,
    spatialUpscaler: map.get(LTX_KEYS.spatialUpscaler)!,
    loraEnabled: map.get(LTX_KEYS.loraEnabled)! === 'true',
    cfg: parseFloat(map.get(LTX_KEYS.cfg)!),
    sampler1stPass: map.get(LTX_KEYS.sampler1stPass)!,
    sampler2ndPass: map.get(LTX_KEYS.sampler2ndPass)!,
    sigmas1stPass: map.get(LTX_KEYS.sigmas1stPass)!,
    sigmas2ndPass: map.get(LTX_KEYS.sigmas2ndPass)!,
    audioNorm1stPass: map.get(LTX_KEYS.audioNorm1stPass)!,
    audioNorm2ndPass: map.get(LTX_KEYS.audioNorm2ndPass)!,
    nagScale: parseFloat(map.get(LTX_KEYS.nagScale)!),
    duration: parseInt(map.get(LTX_KEYS.duration)!, 10),
    frameRate: parseInt(map.get(LTX_KEYS.frameRate)!, 10),
    megapixels: parseFloat(map.get(LTX_KEYS.megapixels)!),
    resizeMultipleOf: parseInt(map.get(LTX_KEYS.resizeMultipleOf)!, 10),
    resizeUpscaleMethod: map.get(LTX_KEYS.resizeUpscaleMethod)!,
    imgCompression: parseInt(map.get(LTX_KEYS.imgCompression)!, 10),
    negativePrompt: map.get(LTX_KEYS.negativePrompt)!,
    vaeSpatialTiles: parseInt(map.get(LTX_KEYS.vaeSpatialTiles)!, 10),
    vaeSpatialOverlap: parseInt(map.get(LTX_KEYS.vaeSpatialOverlap)!, 10),
    vaeTemporalTileLength: parseInt(map.get(LTX_KEYS.vaeTemporalTileLength)!, 10),
    vaeTemporalOverlap: parseInt(map.get(LTX_KEYS.vaeTemporalOverlap)!, 10),
    rtxResizeType: map.get(LTX_KEYS.rtxResizeType)!,
    rtxScale: parseFloat(map.get(LTX_KEYS.rtxScale)!),
    rtxQuality: map.get(LTX_KEYS.rtxQuality)!,
  };
}
