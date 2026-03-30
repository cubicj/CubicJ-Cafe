"use client";

import { useState, useEffect } from "react";
import { createLogger } from '@/lib/logger';
import { apiClient, ApiError } from '@/lib/api-client';
import { useSession } from '@/contexts/SessionContext';
import { useI2VFormContext } from '@/contexts/I2VFormContext';
import type { VideoModel, ModelCapabilities } from "@/lib/comfyui/workflows/types";
import { MODEL_REGISTRY } from "@/lib/comfyui/workflows/registry";

const log = createLogger('i2v');

interface ServerInfo {
  type: 'local' | 'runpod'
  name: string
  status: 'connected' | 'disconnected' | 'error'
  queue?: {
    remaining: number
  }
  error?: string
}

interface ComfyUIStatus {
  servers: ServerInfo[]
  summary: {
    local: {
      active: number
      total: number
    }
    runpod: {
      active: number
      total: number
    }
    totalActive: number
    totalServers: number
  }
  error?: string
  timestamp: string
}

interface LoRAItemData {
  loraFilename: string;
  loraName: string;
  strength: number;
  group: string;
  order: number;
}

interface PresetData {
  id: string;
  name: string;
  loraItems: LoRAItemData[];
}

interface SubmitMessage {
  type: 'success' | 'error';
  message: string;
  requestId?: string;
}

interface UseI2VFormReturn {
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
  capabilities: ModelCapabilities;
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

export function useI2VForm(): UseI2VFormReturn {
  const {
    selectedFile, setSelectedFile,
    endImageFile, setEndImageFile,
    audioPresetId, setAudioPresetId,
    isLoopEnabled, setIsLoopEnabled,
    prompt, setPrompt,
    isNSFW, setIsNSFW,
    clearForm,
  } = useI2VFormContext();

  const [selectedPresetIds, setSelectedPresetIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('selectedPresetIds');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [currentPresets, setCurrentPresets] = useState<Array<{ id: string; name: string; loraItems: Array<{ loraFilename: string; loraName: string; strength: number; group: string; order: number }> }>>([]);
  const [presets, setPresets] = useState<Array<{ id: string; name: string; loraItems: Array<{ loraFilename: string; loraName: string; strength: number; group: string; order: number }> }>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasUnavailableLoRAs, setHasUnavailableLoRAs] = useState(false);

  const [submitMessage, setSubmitMessage] = useState<SubmitMessage | null>(null);
  const { isLoading: isLoadingAuth } = useSession();
  const [serverStatus, setServerStatus] = useState<ComfyUIStatus | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingServerStatus, setIsLoadingServerStatus] = useState(true);
  const [activeModel, setActiveModelState] = useState<VideoModel>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('activeModel');
        if (saved === 'wan' || saved === 'ltx') return saved;
      } catch { /* ignore */ }
    }
    return 'wan';
  });
  const capabilities: ModelCapabilities = MODEL_REGISTRY[activeModel].capabilities;

  useEffect(() => {
    if (isLoopEnabled && selectedFile) {
      setEndImageFile(selectedFile);
    } else if (!isLoopEnabled) {
      setEndImageFile(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setEndImageFile is a React setState, always stable
  }, [isLoopEnabled, selectedFile]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedPresetIds', JSON.stringify(selectedPresetIds));
    }
  }, [selectedPresetIds]);

  const fetchServerStatus = async () => {
    setIsLoadingServerStatus(true);
    try {
      const data = await apiClient.get<ComfyUIStatus>('/api/comfyui/status');
      setServerStatus(data);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 503)) return;
      if (error instanceof Error && !error.message.includes('503') && !error.message.includes('Service Unavailable')) {
        log.error('Failed to fetch server status', { error: error instanceof Error ? error.message : String(error) });
      }
    } finally {
      setIsLoadingServerStatus(false);
    }
  };

  const fetchPresets = async (model?: string) => {
    try {
      const m = model || activeModel;
      const data = await apiClient.get<{ presets: PresetData[] }>(`/api/lora-presets?model=${m}`);
      return data.presets || [];
    } catch (err) {
      log.error('Failed to fetch LoRA preset list', { error: err instanceof Error ? err.message : String(err) });
    }
    return [];
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setSubmitMessage({ type: 'error', message: '이미지를 업로드해주세요.' });
      return;
    }

    if (!prompt.trim()) {
      setSubmitMessage({ type: 'error', message: '프롬프트를 입력해주세요.' });
      return;
    }

    if (hasUnavailableLoRAs) {
      setSubmitMessage({ type: 'error', message: '선택한 LoRA 프리셋에 서버에서 찾을 수 없는 LoRA가 포함되어 있습니다. 프리셋을 수정하거나 해제한 후 다시 시도해주세요.' });
      return;
    }

    setIsGenerating(true);
    setSubmitMessage(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      if (endImageFile) {
        formData.append('endImage', endImageFile);
      }
      formData.append('prompt', prompt.trim());
      formData.append('model', activeModel);
      formData.append('isNSFW', isNSFW.toString());
      formData.append('isLoop', isLoopEnabled.toString());

      if (audioPresetId) {
        formData.append('audioPresetId', audioPresetId);
      }

      if (currentPresets && currentPresets.length > 0) {
        const mergedLoRAMap = new Map();

        currentPresets.forEach(preset => {
          preset.loraItems.forEach((item, index) => {
            mergedLoRAMap.set(item.loraFilename, {
              loraFilename: item.loraFilename,
              loraName: item.loraName,
              strength: item.strength,
              group: item.group,
              order: item.order ?? index,
            });
          });
        });

        const mergedLoRAItems = Array.from(mergedLoRAMap.values());

        if (mergedLoRAItems.length > 0) {
          formData.append('loraPreset', JSON.stringify({
            presetId: selectedPresetIds.join(','),
            presetName: currentPresets.map(p => p.name).join(', '),
            loraItems: mergedLoRAItems,
          }));
        }
      }

      const result = await apiClient.postFormData<{ requestId: string }>('/api/i2v', formData);

      setSubmitMessage({
        type: 'success',
        message: '요청이 큐에 추가되었습니다! 위쪽 실행 큐에서 진행 상황을 확인하세요.',
        requestId: result.requestId
      });

      clearForm();

    } catch (error) {
      log.error('Queue request failed', { error: error instanceof Error ? error.message : String(error) });

      if (error instanceof ApiError) {
        if (error.status === 429) {
          setSubmitMessage({
            type: 'error',
            message: error.errorMessage || '현재 처리 중인 요청이 2개입니다. 기존 요청이 완료된 후 다시 시도해주세요.'
          });
        } else {
          setSubmitMessage({
            type: 'error',
            message: error.errorMessage || '요청 처리 중 오류가 발생했습니다.'
          });
        }
        return;
      }

      const isNetworkError = error instanceof TypeError && error.message.includes('fetch');
      const errorMessage = isNetworkError
        ? '네트워크 연결에 문제가 있습니다. 인터넷 연결과 서버 상태를 확인해주세요.'
        : (error instanceof Error ? error.message : '요청 처리 중 오류가 발생했습니다.');

      setSubmitMessage({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    clearForm();
    setSubmitMessage(null);
  };

  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    await fetchServerStatus();
    setIsRefreshing(false);
  };

  const setActiveModel = (model: VideoModel) => {
    setActiveModelState(model);
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeModel', model);
    }
    setSelectedPresetIds([]);
    setCurrentPresets([]);
  };

  useEffect(() => {
    fetchServerStatus();
  }, []);

  useEffect(() => {
    const reloadPresets = async () => {
      if (capabilities.loraPresets) {
        const allPresets = await fetchPresets(activeModel);
        setPresets(allPresets);
      } else {
        setPresets([]);
      }
    };
    reloadPresets();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- capabilities and fetchPresets derived from activeModel
  }, [activeModel]);

  useEffect(() => {
    if (presets.length > 0 && selectedPresetIds.length > 0) {
      const restoredPresets = presets.filter(preset =>
        selectedPresetIds.includes(preset.id)
      );
      if (restoredPresets.length > 0) {
        setCurrentPresets(restoredPresets);
      }
    } else if (selectedPresetIds.length === 0) {
      setCurrentPresets([]);
    }
  }, [presets, selectedPresetIds]);

  const isFormValid = !!selectedFile && prompt.trim().length > 0 && (serverStatus?.summary?.totalActive || 0) > 0;

  return {
    selectedFile,
    setSelectedFile,
    endImageFile,
    setEndImageFile,
    audioPresetId,
    setAudioPresetId,
    isLoopEnabled,
    setIsLoopEnabled,
    prompt,
    setPrompt,
    selectedPresetIds,
    setSelectedPresetIds,
    currentPresets,
    setCurrentPresets,
    presets,
    setPresets,
    isGenerating,
    setIsGenerating,
    isNSFW,
    setIsNSFW,
    submitMessage,
    setSubmitMessage,
    isLoadingAuth,
    hasUnavailableLoRAs,
    setHasUnavailableLoRAs,
    serverStatus,
    setServerStatus,
    isRefreshing,
    setIsRefreshing,
    isLoadingServerStatus,
    setIsLoadingServerStatus,
    activeModel,
    setActiveModel,
    capabilities,
    isFormValid,
    handleSubmit,
    handleReset,
    handleRefreshStatus,
    fetchServerStatus,
    fetchPresets,
  };
}
