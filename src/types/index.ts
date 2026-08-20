export * from './lora';

export interface User {
  id: string;
  discordId: string;
  discordUsername: string;
  nickname: string;
  avatar: string | null;
  createdAt?: string;
  lastActiveAt?: string;
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

export interface ComfyUIWorkflow {
  [key: string]: ComfyUINode;
}

interface ComfyUINode {
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

interface ComfyUINodeError {
  type?: string;
  message: string;
  details?: string;
  traceback?: string[];
}
