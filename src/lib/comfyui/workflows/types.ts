export type VideoModel = 'wan' | 'ltxa' | 'ltxr' | 'ltx-wan'

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

export interface LtxrGenerationParams extends BaseGenerationParams {
  model: 'ltxr'
  endImage?: string
  referenceAudio?: string
  watermarkImage?: string
}

export interface LtxWanGenerationParams extends BaseGenerationParams {
  model: 'ltx-wan'
  endImage?: string
  referenceAudio?: string
}

export type GenerationParams = WanGenerationParams | LtxaGenerationParams | LtxrGenerationParams | LtxWanGenerationParams
