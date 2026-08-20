import { prisma } from '../prisma';
import { createLogger } from '@/lib/logger';

const log = createLogger('database');

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

export function buildSettingsMap(
  settings: { key: string; value: string }[],
  keys: Record<string, string>,
  optionalKeys: readonly string[] = [],
  emptyStringKeys: readonly string[] = []
): Map<string, string> {
  const map = new Map<string, string>();
  for (const s of settings) {
    map.set(s.key, s.value);
  }
  const allKeys = Object.values(keys);
  const optional = new Set(optionalKeys);
  const emptyStringAllowed = new Set(emptyStringKeys);
  const missing = allKeys.filter(k => {
    if (optional.has(k)) {
      return false;
    }
    if (!map.has(k)) {
      return true;
    }
    return !emptyStringAllowed.has(k) && !map.get(k);
  });
  if (missing.length > 0) {
    throw new Error(`필수 설정값 누락: ${missing.join(', ')}`);
  }
  return map;
}

export function parseLtxLoraSlot(
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

export function parseLtxAnchorSettings(
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

export function parseLtxLoraChain(map: Map<string, string>, key: string): LtxLoraChainItem[] {
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

export function parseLtxNumber(map: Map<string, string>, key: string): number {
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

export function parseLtxInteger(map: Map<string, string>, key: string): number {
  const parsed = parseLtxNumber(map, key);
  if (!Number.isInteger(parsed)) {
    throw new Error(`Invalid integer setting: ${key} = "${map.get(key)!}"`);
  }
  return parsed;
}

export function parseLtxNumberList(map: Map<string, string>, key: string): number[] {
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
