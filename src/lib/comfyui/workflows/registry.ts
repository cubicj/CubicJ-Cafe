import type { VideoModel, ModelConfig } from './types'

export const MODEL_REGISTRY: Record<VideoModel, ModelConfig> = {
  wan: {
    displayName: 'WAN 2.2',
    capabilities: { loraPresets: true, endImage: true, videoDuration: true, audio: false },
    defaultSubfolder: 'WAN',
    durationOptions: [5, 6, 7],
    defaultDuration: 5,
  },
  ltx: {
    displayName: 'LTX 2.3',
    capabilities: { loraPresets: true, endImage: true, videoDuration: true, audio: true },
    defaultSubfolder: 'LTX',
    durationOptions: [5, 6, 7],
    defaultDuration: 5,
  },
}

export const VIDEO_OUTPUT_TYPES: Record<VideoModel, {
  classTypes: string[]
  outputField: string
}> = {
  wan: { classTypes: ['VHS_VideoCombine'], outputField: 'gifs' },
  ltx: { classTypes: ['VHS_VideoCombine'], outputField: 'gifs' },
}
