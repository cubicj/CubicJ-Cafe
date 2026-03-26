export * from './lora';

export interface User {
  id: string;
  discordId: string;
  discordUsername: string;
  nickname: string;
  avatar: string | null;
  createdAt?: string;
  lastLoginAt?: string;
  updatedAt?: string;
}

export interface GenerationJob {
  id: string;
  userId: string;
  prompt: string;
  negativePrompt?: string;
  imageUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  comfyuiJobId?: string;
  promptId?: string;
  error?: string;
  isNSFW?: boolean;
  videoModel?: string;
  userInfo?: {
    name: string;
    email?: string;
    image?: string;
    discordId?: string;
  };
}

export interface GeneratedImage {
  id: string;
  jobId: string;
  imageUrl: string;
  filename: string;
  fileSize: number;
  createdAt: Date;
}

export interface ComfyUIWorkflow {
  [key: string]: ComfyUINode;
}

export interface ComfyUINode {
  inputs?: Record<string, unknown>;
  class_type: string;
  _meta?: {
    title?: string;
  };
}

export interface ComfyUIResponse {
  prompt_id: string;
  number: number;
  node_errors: Record<string, ComfyUINodeError>;
}

export interface ComfyUINodeError {
  type?: string;
  message: string;
  details?: string;
  traceback?: string[];
}

export type {
  VideoModel,
  ModelCapabilities,
  ModelConfig,
  GenerationParams,
  WanGenerationParams,
  LtxGenerationParams,
} from '@/lib/comfyui/workflows/types'

export interface DiscordMessage {
  content: string;
  embeds?: Array<{
    title?: string;
    description?: string;
    image?: {
      url: string;
    };
    fields?: Array<{
      name: string;
      value: string;
      inline?: boolean;
    }>;
  }>;
}

export interface DownloadedMedia {
  filename: string;
  localPath: string;
  url: string;
  type: 'image' | 'video';
}