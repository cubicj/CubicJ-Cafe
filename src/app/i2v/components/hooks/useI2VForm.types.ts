import type { ModelCapabilities, VideoModel } from '@/lib/comfyui/workflows/types';
import type { ReferenceSetState } from './useReferenceSet';

export interface ServerInfo {
  type: 'local' | 'runpod';
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  queue?: {
    remaining: number;
  };
  error?: string;
}

export interface ComfyUIStatus {
  servers: ServerInfo[];
  summary: {
    local: {
      active: number;
      total: number;
    };
    runpod: {
      active: number;
      total: number;
    };
    totalActive: number;
    totalServers: number;
  };
  error?: string;
  timestamp: string;
}

export interface LoRAItemData {
  loraFilename: string;
  loraName: string;
  strength: number;
  group: string;
  order: number;
}

export interface PresetData {
  id: string;
  name: string;
  loraItems: LoRAItemData[];
}

export interface SubmitMessage {
  type: 'success' | 'error';
  message: string;
  requestId?: string;
}

export interface UseI2VFormReturn {
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  endImageFile: File | null;
  setEndImageFile: (file: File | null) => void;
  audioPresetId: string | null;
  setAudioPresetId: (id: string | null) => void;
  isLoopEnabled: boolean;
  setIsLoopEnabled: (enabled: boolean) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  selectedPresetIds: string[];
  setSelectedPresetIds: (ids: string[]) => void;
  currentPresets: PresetData[];
  setCurrentPresets: (presets: PresetData[]) => void;
  presets: PresetData[];
  setPresets: (presets: PresetData[]) => void;
  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;
  isNSFW: boolean;
  setIsNSFW: (nsfw: boolean) => void;
  videoDuration: number;
  setVideoDuration: (duration: number) => void;
  submitMessage: SubmitMessage | null;
  setSubmitMessage: (message: SubmitMessage | null) => void;
  serverStatus: ComfyUIStatus | null;
  setServerStatus: (status: ComfyUIStatus | null) => void;
  isRefreshing: boolean;
  setIsRefreshing: (refreshing: boolean) => void;
  isLoadingServerStatus: boolean;
  setIsLoadingServerStatus: (loading: boolean) => void;
  activeModel: VideoModel;
  setActiveModel: (model: VideoModel) => void;
  enabledModels: VideoModel[];
  capabilities: ModelCapabilities;
  durationOptions: number[];
  durationLabels: Record<number, string>;
  referenceSet: ReferenceSetState;
  isLoadingAuth: boolean;
  hasUnavailableLoRAs: boolean;
  setHasUnavailableLoRAs: (has: boolean) => void;
  isFormValid: boolean;
  handleSubmit: () => Promise<void>;
  handleReset: () => void;
  handleRefreshStatus: () => Promise<void>;
  fetchServerStatus: () => Promise<void>;
  fetchPresets: () => Promise<PresetData[]>;
}
