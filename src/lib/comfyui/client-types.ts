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
  ggufClips: string[]
  clipEmbeddings: string[]
  kjVaes: string[]
  latentUpscalers: string[]
  vfiCheckpoints: string[]
}

export interface VideoFileInfo {
  filename: string
  subfolder: string
  type: string
}

export interface WsExecutedData {
  node: string
  output: {
    gifs?: Array<{ filename: string; subfolder: string; type: string }>
    images?: Array<{ filename: string; subfolder: string; type: string }>
  } | null
  prompt_id: string
}

export interface WsExecutionErrorData {
  prompt_id: string
  node_id: string
  node_type: string
  exception_message: string
  exception_type: string
}

export interface WsMessage {
  type: 'executed' | 'executing' | 'execution_error' | 'progress' | 'status' | 'execution_start' | 'execution_cached'
  data: Record<string, unknown>
}