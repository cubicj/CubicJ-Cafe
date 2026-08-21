import { MODEL_REGISTRY } from '@/lib/comfyui/workflows/registry';
import type { VideoModel } from '@/lib/comfyui/workflows/types';
import { prisma } from '../prisma';
import { MODEL_ENABLED_KEYS, resolveEnabledModels } from './models';

export interface CapabilitiesSettingsProjection {
  enabledModels: VideoModel[];
  loraEnabled: Record<VideoModel, boolean>;
  durationOptions: Record<VideoModel, number[]>;
  ltxaFrameBase: number | null;
  ltxaFrameRate: number | null;
  ltxrFrameBase: number | null;
  ltxrFrameRate: number | null;
  ltxrEndImageEnabled: boolean;
  h3Fl2vaFramesPerStep: number | null;
  h3Fl2vaFrameBase: number | null;
  h3Fl2vaFrameRate: number | null;
  h3Ref2vaFramesPerStep: number | null;
  h3Ref2vaFrameBase: number | null;
  h3Ref2vaFrameRate: number | null;
}

export async function getCapabilitiesSettingsProjection(): Promise<CapabilitiesSettingsProjection> {
  const rows = await prisma.systemSetting.findMany({
    where: {
      key: {
        in: [
          'wan.lora_enabled',
          'ltxa.lora_enabled',
          'wan.duration_options',
          'ltxa.duration_options',
          'ltxr.duration_options',
          'ltx-wan.duration_options',
          'ltxa.frame_base',
          'ltxa.frame_rate',
          'ltxr.frame_base',
          'ltxr.frame_rate',
          'ltxr.end_image_enabled',
          'h3-fl2va.duration_options',
          'h3-fl2va.frames_per_step',
          'h3-fl2va.frame_base',
          'h3-fl2va.frame_rate',
          'h3-ref2va.duration_options',
          'h3-ref2va.frames_per_step',
          'h3-ref2va.frame_base',
          'h3-ref2va.frame_rate',
          ...Object.values(MODEL_ENABLED_KEYS),
        ],
      },
    },
  });

  const settingsMap = new Map(rows.map(row => [row.key, row.value]));
  const parseCsv = (value: string | undefined): number[] | null =>
    value ? value.split(',').map(item => parseInt(item.trim(), 10)).filter(item => Number.isFinite(item)) : null;
  const parsePositiveNumber = (value: string | undefined): number | null => {
    const parsed = value ? Number(value) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  };

  return {
    enabledModels: resolveEnabledModels(settingsMap),
    loraEnabled: {
      wan: settingsMap.get('wan.lora_enabled') === 'true',
      ltxa: settingsMap.get('ltxa.lora_enabled') === 'true',
      ltxr: false,
      'ltx-wan': false,
      'h3-fl2va': false,
      'h3-ref2va': false,
    },
    durationOptions: {
      wan: parseCsv(settingsMap.get('wan.duration_options')) ?? MODEL_REGISTRY.wan.durationOptions,
      ltxa: parseCsv(settingsMap.get('ltxa.duration_options')) ?? MODEL_REGISTRY.ltxa.durationOptions,
      ltxr: parseCsv(settingsMap.get('ltxr.duration_options')) ?? MODEL_REGISTRY.ltxr.durationOptions,
      'ltx-wan': parseCsv(settingsMap.get('ltx-wan.duration_options')) ?? MODEL_REGISTRY['ltx-wan'].durationOptions,
      'h3-fl2va': parseCsv(settingsMap.get('h3-fl2va.duration_options')) ?? MODEL_REGISTRY['h3-fl2va'].durationOptions,
      'h3-ref2va': parseCsv(settingsMap.get('h3-ref2va.duration_options')) ?? MODEL_REGISTRY['h3-ref2va'].durationOptions,
    },
    ltxaFrameBase: parsePositiveNumber(settingsMap.get('ltxa.frame_base')),
    ltxaFrameRate: parsePositiveNumber(settingsMap.get('ltxa.frame_rate')),
    ltxrFrameBase: parsePositiveNumber(settingsMap.get('ltxr.frame_base')),
    ltxrFrameRate: parsePositiveNumber(settingsMap.get('ltxr.frame_rate')),
    ltxrEndImageEnabled: settingsMap.get('ltxr.end_image_enabled') === 'true',
    h3Fl2vaFramesPerStep: parsePositiveNumber(settingsMap.get('h3-fl2va.frames_per_step')),
    h3Fl2vaFrameBase: parsePositiveNumber(settingsMap.get('h3-fl2va.frame_base')),
    h3Fl2vaFrameRate: parsePositiveNumber(settingsMap.get('h3-fl2va.frame_rate')),
    h3Ref2vaFramesPerStep: parsePositiveNumber(settingsMap.get('h3-ref2va.frames_per_step')),
    h3Ref2vaFrameBase: parsePositiveNumber(settingsMap.get('h3-ref2va.frame_base')),
    h3Ref2vaFrameRate: parsePositiveNumber(settingsMap.get('h3-ref2va.frame_rate')),
  };
}
