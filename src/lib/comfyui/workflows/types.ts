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
}

export interface BaseGenerationParams {
  prompt: string
  inputImage: string
}

export interface WanGenerationParams extends BaseGenerationParams {
  model: 'wan'
  loraPreset?: LoRAPresetData
  endImage?: string
  videoLength: number
}

export interface LtxGenerationParams extends BaseGenerationParams {
  model: 'ltx'
  durationSeconds: number
}

export type GenerationParams = WanGenerationParams | LtxGenerationParams
