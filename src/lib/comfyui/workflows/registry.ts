import type { VideoModel, ModelConfig } from './types';

export const MODEL_REGISTRY: Record<VideoModel, ModelConfig> = {
  wan: {
    displayName: 'WAN 2.2',
    capabilities: {
      loraPresets: false,
      endImage: true,
      videoDuration: true,
      audio: false,
      nsfw: true,
      startImageOptional: false,
    },
    durationOptions: [5, 6, 7],
    defaultDuration: 5,
  },
  ltxa: {
    displayName: 'LTX(Anime)',
    capabilities: {
      loraPresets: false,
      endImage: false,
      videoDuration: true,
      audio: true,
      nsfw: true,
      startImageOptional: false,
    },
    durationOptions: [5, 6, 7],
    defaultDuration: 5,
  },
  ltxr: {
    displayName: 'LTX(Real)',
    capabilities: {
      loraPresets: false,
      endImage: true,
      videoDuration: true,
      audio: true,
      nsfw: false,
      startImageOptional: false,
    },
    durationOptions: [5, 6, 7],
    defaultDuration: 5,
  },
  'ltx-wan': {
    displayName: 'L+W',
    capabilities: {
      loraPresets: false,
      endImage: true,
      videoDuration: true,
      audio: true,
      nsfw: true,
      startImageOptional: false,
    },
    durationOptions: [5, 6, 7, 8],
    defaultDuration: 5,
  },
  'h3-fl2va': {
    displayName: 'H3 FL2VA',
    capabilities: {
      loraPresets: false,
      endImage: true,
      videoDuration: true,
      audio: false,
      nsfw: true,
      startImageOptional: true,
    },
    durationOptions: [7],
    defaultDuration: 7,
  },
};

export function isLtxLoraFamily(model: string): boolean {
  return model === 'ltx' || model === 'ltxa';
}
