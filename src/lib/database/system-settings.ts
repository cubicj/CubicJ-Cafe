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
  loraEnabled: boolean;
  megapixels: number;
  shift: number;
  nagScale: number;
  stepsHigh: number;
  stepsLow: number;
  length: number;
  sampler: string;
  negativePrompt: string;
}

export interface LtxSettings {
  loraEnabled: boolean;
  cfg: number;
  steps: number;
  nagScale: number;
  duration: number;
  megapixels: number;
  imgCompression: number;
  negativePrompt: string;
}

const WAN_KEYS = {
  loraEnabled: 'wan.lora_enabled',
  megapixels: 'wan.megapixels',
  shift: 'wan.shift',
  nagScale: 'wan.nag_scale',
  stepsHigh: 'wan.steps_high',
  stepsLow: 'wan.steps_low',
  length: 'wan.length',
  sampler: 'wan.sampler',
  negativePrompt: 'wan.negative_prompt',
} as const;

const LTX_KEYS = {
  loraEnabled: 'ltx.lora_enabled',
  cfg: 'ltx.cfg',
  steps: 'ltx.steps',
  nagScale: 'ltx.nag_scale',
  duration: 'ltx.duration',
  megapixels: 'ltx.megapixels',
  imgCompression: 'ltx.img_compression',
  negativePrompt: 'ltx.negative_prompt',
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
    loraEnabled: map.get(WAN_KEYS.loraEnabled)! === 'true',
    megapixels: parseFloat(map.get(WAN_KEYS.megapixels)!),
    shift: parseFloat(map.get(WAN_KEYS.shift)!),
    nagScale: parseFloat(map.get(WAN_KEYS.nagScale)!),
    stepsHigh: parseInt(map.get(WAN_KEYS.stepsHigh)!, 10),
    stepsLow: parseInt(map.get(WAN_KEYS.stepsLow)!, 10),
    length: parseInt(map.get(WAN_KEYS.length)!, 10),
    sampler: map.get(WAN_KEYS.sampler)!,
    negativePrompt: map.get(WAN_KEYS.negativePrompt)!,
  };
}

export async function getLtxSettings(): Promise<LtxSettings> {
  const keys = Object.values(LTX_KEYS);
  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: keys } },
  });
  const map = buildSettingsMap(settings, LTX_KEYS);

  return {
    loraEnabled: map.get(LTX_KEYS.loraEnabled)! === 'true',
    cfg: parseFloat(map.get(LTX_KEYS.cfg)!),
    steps: parseInt(map.get(LTX_KEYS.steps)!, 10),
    nagScale: parseFloat(map.get(LTX_KEYS.nagScale)!),
    duration: parseInt(map.get(LTX_KEYS.duration)!, 10),
    megapixels: parseFloat(map.get(LTX_KEYS.megapixels)!),
    imgCompression: parseInt(map.get(LTX_KEYS.imgCompression)!, 10),
    negativePrompt: map.get(LTX_KEYS.negativePrompt)!,
  };
}
