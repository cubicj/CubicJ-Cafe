import { useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import { MODEL_REGISTRY } from '@/lib/comfyui/workflows/registry';
import { VIDEO_MODELS, type ModelCapabilities, type VideoModel } from '@/lib/comfyui/workflows/types';
import type { User } from '@/types';
import type { PresetData } from './useI2VForm.types';

const log = createLogger('i2v');

interface UseModelCapabilitiesOptions {
  isLoadingAuth: boolean;
  user: User | null;
  isNSFW: boolean;
  setIsNSFW: (nsfw: boolean) => void;
  setSelectedPresetIds: (ids: string[]) => void;
  setCurrentPresets: (presets: PresetData[]) => void;
}

export function useModelCapabilities({
  isLoadingAuth,
  user,
  isNSFW,
  setIsNSFW,
  setSelectedPresetIds,
  setCurrentPresets,
}: UseModelCapabilitiesOptions) {
  const [activeModel, setActiveModelState] = useState<VideoModel>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('activeModel');
        if (saved === 'ltx') {
          localStorage.setItem('activeModel', 'ltxa');
          return 'ltxa';
        }
        if (saved && (VIDEO_MODELS as readonly string[]).includes(saved)) return saved as VideoModel;
      } catch { /* ignore */ }
    }
    return 'wan';
  });
  const [videoDuration, setVideoDuration] = useState<number>(
    MODEL_REGISTRY[activeModel].defaultDuration
  );
  const initialModelRef = useRef(activeModel);
  const initialDurationRef = useRef(videoDuration);
  const previousActiveModelRef = useRef(activeModel);
  const nonLtxrIsNSFWRef = useRef(isNSFW);
  const [capabilitiesMap, setCapabilitiesMap] = useState<Record<VideoModel, ModelCapabilities> | null>(null);
  const [durationOptionsMap, setDurationOptionsMap] = useState<Record<VideoModel, number[]> | null>(null);
  const [durationLabelsMap, setDurationLabelsMap] = useState<Record<VideoModel, Record<number, string>> | null>(null);
  const [enabledModels, setEnabledModels] = useState<VideoModel[]>((Object.keys(MODEL_REGISTRY) as VideoModel[]));
  const capabilities: ModelCapabilities = capabilitiesMap?.[activeModel] ?? MODEL_REGISTRY[activeModel].capabilities;
  const capabilitiesRef = useRef(capabilities);
  const durationOptions: number[] = durationOptionsMap?.[activeModel] ?? MODEL_REGISTRY[activeModel].durationOptions;
  const durationLabels: Record<number, string> = durationLabelsMap?.[activeModel] ?? Object.fromEntries(durationOptions.map(duration => [duration, `${duration}초`]));

  useEffect(() => {
    capabilitiesRef.current = capabilities;
  }, [capabilities]);

  useEffect(() => {
    if (isLoadingAuth || !user) return;

    const fetchCapabilities = async () => {
      try {
        const data = await apiClient.get<{
          capabilities: Record<VideoModel, ModelCapabilities>;
          durationOptions: Record<VideoModel, number[]>;
          durationLabels: Record<VideoModel, Record<number, string>>;
          enabledModels: VideoModel[];
        }>('/api/i2v/capabilities');
        setCapabilitiesMap(data.capabilities);
        setDurationOptionsMap(data.durationOptions);
        setDurationLabelsMap(data.durationLabels);
        setEnabledModels(data.enabledModels);
        const initialEnabledModel = data.enabledModels.includes(initialModelRef.current)
          ? initialModelRef.current
          : data.enabledModels[0];
        if (initialEnabledModel && initialEnabledModel !== initialModelRef.current) {
          setActiveModelState(initialEnabledModel);
          localStorage.setItem('activeModel', initialEnabledModel);
        }
        const options = initialEnabledModel ? data.durationOptions[initialEnabledModel] : data.durationOptions[initialModelRef.current];
        if (options && !options.includes(initialDurationRef.current)) {
          setVideoDuration(options[0]);
        }
      } catch {
        log.warn('Failed to fetch capabilities, using static defaults');
      }
    };
    fetchCapabilities();
  }, [isLoadingAuth, user]);

  useEffect(() => {
    const previousActiveModel = previousActiveModelRef.current;
    const previousCapabilities = capabilitiesMap?.[previousActiveModel]
      ?? MODEL_REGISTRY[previousActiveModel].capabilities;

    if (!capabilities.nsfw) {
      if (previousCapabilities.nsfw) {
        nonLtxrIsNSFWRef.current = isNSFW;
      }
      previousActiveModelRef.current = activeModel;
      if (isNSFW) {
        setIsNSFW(false);
      }
      return;
    }

    if (!previousCapabilities.nsfw) {
      previousActiveModelRef.current = activeModel;
      if (isNSFW !== nonLtxrIsNSFWRef.current) {
        setIsNSFW(nonLtxrIsNSFWRef.current);
      }
      return;
    }

    nonLtxrIsNSFWRef.current = isNSFW;
    previousActiveModelRef.current = activeModel;
  }, [activeModel, capabilities.nsfw, capabilitiesMap, isNSFW, setIsNSFW]);

  const setFormIsNSFW = (nsfw: boolean) => {
    if (!capabilities.nsfw) {
      setIsNSFW(false);
      return;
    }

    nonLtxrIsNSFWRef.current = nsfw;
    setIsNSFW(nsfw);
  };

  const setActiveModel = (model: VideoModel) => {
    if (!enabledModels.includes(model)) return;
    setActiveModelState(model);
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeModel', model);
    }
    setSelectedPresetIds([]);
    setCurrentPresets([]);
    const options = durationOptionsMap?.[model] ?? MODEL_REGISTRY[model].durationOptions;
    setVideoDuration(options[0]);
  };

  return {
    activeModel,
    setActiveModel,
    setFormIsNSFW,
    videoDuration,
    setVideoDuration,
    enabledModels,
    capabilities,
    capabilitiesRef,
    durationOptions,
    durationLabels,
  };
}
