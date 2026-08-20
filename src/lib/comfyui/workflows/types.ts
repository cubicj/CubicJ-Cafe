export const VIDEO_MODELS = ['wan', 'ltxa', 'ltxr', 'ltx-wan'] as const

export type VideoModel = (typeof VIDEO_MODELS)[number]

export interface ModelCapabilities {
  loraPresets: boolean
  endImage: boolean
  videoDuration: boolean
  audio: boolean
  nsfw: boolean
}

export interface ModelConfig {
  displayName: string
  capabilities: ModelCapabilities
  durationOptions: number[]
  defaultDuration: number
}

interface BaseGenerationParams {
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

export interface H3Fl2vaGenerationParams {
  model: 'h3-fl2va'
  prompt: string
  videoDuration: number
  isNSFW?: boolean
  inputImage?: string
  endImage?: string
}

export type GenerationParams = WanGenerationParams | LtxaGenerationParams | LtxrGenerationParams | LtxWanGenerationParams | H3Fl2vaGenerationParams
