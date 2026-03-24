import type { VideoModel, ModelConfig } from './types'

export const MODEL_REGISTRY: Record<VideoModel, ModelConfig> = {
  wan: {
    displayName: 'WAN 2.2',
    capabilities: { loraPresets: false, endImage: true, videoDuration: false, audio: false },
    defaultSubfolder: 'WAN',
  },
  ltx: {
    displayName: 'LTX 2.3',
    capabilities: { loraPresets: true, endImage: true, videoDuration: false, audio: true },
    defaultSubfolder: 'LTX',
  },
}

export const VIDEO_OUTPUT_TYPES: Record<VideoModel, {
  classTypes: string[]
  outputField: string
}> = {
  wan: { classTypes: ['VHS_VideoCombine'], outputField: 'gifs' },
  ltx: { classTypes: ['SaveVideo'], outputField: 'images' },
}
