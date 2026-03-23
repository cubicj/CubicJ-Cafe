import { useState, useCallback, useMemo } from 'react';
import { useAdminAuth } from './useAdminAuth';
import { apiClient, ApiError } from '@/lib/api-client';

interface SystemSettings {
  [category: string]: {
    [key: string]: {
      value: string;
      type: string;
    };
  };
}

interface ModelSettings {
  highDiffusionModel: string;
  lowDiffusionModel: string;
  textEncoder: string;
  vae: string;
  upscaleModel: string;
  clipVision: string;
  ksampler: string;
  highCfg: number;
  lowCfg: number;
  highShift: number;
  lowShift: number;
}

interface ModelList {
  diffusionModels: string[];
  textEncoders: string[];
  vaes: string[];
  upscaleModels: string[];
  clipVisions: string[];
  samplers: string[];
}

export function useAdminSettings() {
  const { checkAdminResponse, setError } = useAdminAuth();

  const handleAdminError = useCallback((err: unknown): boolean => {
    if (err instanceof ApiError) {
      checkAdminResponse(new Response(null, { status: err.status }));
      if (err.status === 401 || err.status === 403) return true;
    }
    return false;
  }, [checkAdminResponse]);
  
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({});
  const [modelSettings, setModelSettings] = useState<ModelSettings>({
    highDiffusionModel: '',
    lowDiffusionModel: '',
    textEncoder: '',
    vae: '',
    upscaleModel: '',
    clipVision: '',
    ksampler: '',
    highCfg: 3.0,
    lowCfg: 3.0,
    highShift: 5.0,
    lowShift: 5.0
  });
  const [availableModels, setAvailableModels] = useState<ModelList>({
    diffusionModels: [],
    textEncoders: [],
    vaes: [],
    upscaleModels: [],
    clipVisions: [],
    samplers: []
  });
  
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [success, setSuccess] = useState('');

  const showSuccess = useCallback((message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  }, []);

  const fetchSystemSettings = useCallback(async () => {
    try {
      const data = await apiClient.get<SystemSettings>('/api/admin/settings');
      setSystemSettings(data);
    } catch (err) {
      if (!handleAdminError(err)) {
        setError('시스템 설정을 불러올 수 없습니다.');
      }
    } finally {
      setSettingsLoading(false);
    }
  }, [handleAdminError, setError]);

  const fetchModelSettings = useCallback(async () => {
    try {
      const data = await apiClient.get<{ settings: ModelSettings }>('/api/admin/model-settings');
      setModelSettings(data.settings);
    } catch (err) {
      if (!handleAdminError(err)) {
        setError('모델 설정을 불러올 수 없습니다.');
      }
    }
  }, [handleAdminError, setError]);

  const fetchAvailableModels = useCallback(async () => {
    try {
      const [modelsData, samplersData] = await Promise.all([
        apiClient.get<{ models: Omit<ModelList, 'samplers'> }>('/api/comfyui/models'),
        apiClient.get<{ samplers: string[] }>('/api/comfyui/samplers')
      ]);

      setAvailableModels({
        ...modelsData.models,
        samplers: samplersData.samplers || []
      });
    } catch {
      setError('사용 가능한 모델 및 샘플러 목록을 불러올 수 없습니다.');
    } finally {
      setModelsLoading(false);
    }
  }, [setError]);

  const updateSystemSetting = useCallback(async (key: string, value: string, type: string = 'string', category: string = 'general') => {
    try {
      await apiClient.put('/api/admin/settings', { key, value, type, category });
      showSuccess(`${key} 설정이 업데이트되었습니다.`);
      fetchSystemSettings();
    } catch {
      setError('시스템 설정 업데이트에 실패했습니다.');
    }
  }, [showSuccess, fetchSystemSettings, setError]);

  const updateModelSettings = useCallback(async () => {
    try {
      const data = await apiClient.put<{ settings: ModelSettings }>('/api/admin/model-settings', modelSettings);
      setModelSettings(data.settings);
      showSuccess('모델 설정이 성공적으로 업데이트되었습니다.');
    } catch {
      setError('모델 설정 업데이트에 실패했습니다.');
    }
  }, [modelSettings, setModelSettings, showSuccess, setError]);

  return useMemo(() => ({
    systemSettings,
    setSystemSettings,
    modelSettings,
    setModelSettings,
    availableModels,
    settingsLoading,
    modelsLoading,
    success,
    fetchSystemSettings,
    fetchModelSettings,
    fetchAvailableModels,
    updateSystemSetting,
    updateModelSettings
  }), [
    systemSettings,
    modelSettings,
    availableModels,
    settingsLoading,
    modelsLoading,
    success,
    fetchSystemSettings,
    fetchModelSettings,
    fetchAvailableModels,
    updateSystemSetting,
    updateModelSettings
  ]);
}