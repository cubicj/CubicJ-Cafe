import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import type { ModelCapabilities, VideoModel } from '@/lib/comfyui/workflows/types';
import type { User } from '@/types';
import type { PresetData } from './useI2VForm.types';

const log = createLogger('i2v');

export function useLoraPresetSelection() {
  const [selectedPresetIds, setSelectedPresetIdsState] = useState<string[]>(() => {
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
  const selectedPresetIdsRef = useRef(selectedPresetIds);
  const setSelectedPresetIds = useCallback((ids: string[]) => {
    selectedPresetIdsRef.current = ids;
    setSelectedPresetIdsState(ids);
  }, []);
  const [currentPresets, setCurrentPresets] = useState<PresetData[]>([]);
  const [presets, setPresets] = useState<PresetData[]>([]);

  return {
    selectedPresetIds,
    selectedPresetIdsRef,
    setSelectedPresetIds,
    currentPresets,
    setCurrentPresets,
    presets,
    setPresets,
  };
}

export function usePersistedLoraPresetSelection(selectedPresetIds: string[]) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedPresetIds', JSON.stringify(selectedPresetIds));
    }
  }, [selectedPresetIds]);
}

interface UseLoraPresetDataOptions {
  activeModel: VideoModel;
  isLoadingAuth: boolean;
  user: User | null;
  capabilitiesRef: { current: ModelCapabilities };
  selectedPresetIdsRef: { current: string[] };
  setPresets: (presets: PresetData[]) => void;
  setCurrentPresets: (presets: PresetData[]) => void;
}

export function useLoraPresetData({
  activeModel,
  isLoadingAuth,
  user,
  capabilitiesRef,
  selectedPresetIdsRef,
  setPresets,
  setCurrentPresets,
}: UseLoraPresetDataOptions) {
  const fetchPresets = useCallback(async (model?: string) => {
    if (isLoadingAuth || !user) return [];

    try {
      const m = model || activeModel;
      const data = await apiClient.get<{ presets: PresetData[] }>(`/api/lora-presets?model=${m}`);
      return data.presets || [];
    } catch (err) {
      log.error('Failed to fetch LoRA preset list', { error: err instanceof Error ? err.message : String(err) });
    }
    return [];
  }, [activeModel, isLoadingAuth, user]);

  useEffect(() => {
    let ignore = false;

    const reloadPresets = async () => {
      if (isLoadingAuth || !user) {
        if (!ignore) setPresets([]);
        return;
      }

      if (capabilitiesRef.current.loraPresets) {
        const allPresets = await fetchPresets(activeModel);
        if (!ignore) {
          setPresets(allPresets);
          const restoredPresets = allPresets.filter((preset) =>
            selectedPresetIdsRef.current.includes(preset.id)
          );
          if (restoredPresets.length > 0) setCurrentPresets(restoredPresets);
        }
      } else if (!ignore) {
        setPresets([]);
        setCurrentPresets([]);
      }
    };
    reloadPresets();
    return () => {
      ignore = true;
    };
  }, [
    activeModel,
    capabilitiesRef,
    fetchPresets,
    isLoadingAuth,
    selectedPresetIdsRef,
    setCurrentPresets,
    setPresets,
    user,
  ]);

  return fetchPresets;
}
