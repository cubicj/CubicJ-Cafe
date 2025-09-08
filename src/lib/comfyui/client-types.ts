import type { ComfyUIWorkflow } from '@/types'

export interface ComfyUIPromptRequest {
  prompt: ComfyUIWorkflow
  client_id?: string
}

export interface ComfyUIQueueResponse {
  exec_info: {
    queue_remaining: number
  }
}

export interface ComfyUIQueueStatus {
  queue_running: Array<[number, string, Record<string, unknown>]>
  queue_pending: Array<[number, string, Record<string, unknown>]>
}

export interface ComfyUIHistoryResponse {
  [promptId: string]: {
    prompt: Array<Record<string, unknown>>
    outputs: {
      [nodeId: string]: {
        images?: Array<{
          filename: string
          subfolder: string
          type: string
        }>
        gifs?: Array<{
          filename: string
          subfolder: string
          type: string
        }>
      }
    }
  }
}

export interface DownloadedMedia {
  filename: string
  localPath: string
  url: string
  type: 'image' | 'video'
}

export interface ModelListResponse {
  diffusionModels: string[]
  textEncoders: string[]
  vaes: string[]
  upscaleModels: string[]
  clipVisions: string[]
}