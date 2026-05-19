export type VideoModel = 'wan' | 'ltxa' | 'ltx-wan'

export interface ModelCapabilities {
  loraPresets: boolean
  endImage: boolean
  videoDuration: boolean
  audio: boolean
}

export interface ModelConfig {
  displayName: string
  capabilities: ModelCapabilities
  defaultSubfolder: string
  durationOptions: number[]
  defaultDuration: number
}

export interface BaseGenerationParams {
  prompt: string
  inputImage: string
  videoDuration: number
  isNSFW?: boolean
}

export interface WanGenerationParams extends BaseGenerationParams {
  model: 'wan'
  endImage?: string
}

export interface LtxaGenerationParams extends BaseGenerationParams {
  model: 'ltxa'
  endImage?: string
  referenceAudio?: string
}

export interface LtxWanGenerationParams extends BaseGenerationParams {
  model: 'ltx-wan'
  endImage?: string
  referenceAudio?: string
}

export type GenerationParams = WanGenerationParams | LtxaGenerationParams | LtxWanGenerationParams
