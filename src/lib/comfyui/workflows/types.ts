import type { LoRAPresetData } from '@/types/lora'

export type VideoModel = 'wan' | 'ltx'

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
}

export interface WanGenerationParams extends BaseGenerationParams {
  model: 'wan'
  loraPreset?: LoRAPresetData
  endImage?: string
}

export interface LtxGenerationParams extends BaseGenerationParams {
  model: 'ltx'
  endImage?: string
  loraPreset?: LoRAPresetData
  referenceAudio?: string
}

export type GenerationParams = WanGenerationParams | LtxGenerationParams
