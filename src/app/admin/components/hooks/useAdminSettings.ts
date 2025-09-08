import { useState, useCallback } from 'react';
import { useAdminAuth } from './useAdminAuth';

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
      const response = await fetch('/api/admin/settings');
      const isValidResponse = await checkAdminResponse(response);
      if (!isValidResponse) return;
      
      if (!response.ok) {
        throw new Error('시스템 설정 조회 실패');
      }
      const data = await response.json();
      setSystemSettings(data);
    } catch {
      setError('시스템 설정을 불러올 수 없습니다.');
    } finally {
      setSettingsLoading(false);
    }
  }, [checkAdminResponse, setError]);

  const fetchModelSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/model-settings');
      const isValidResponse = await checkAdminResponse(response);
      if (!isValidResponse) return;
      
      if (!response.ok) {
        throw new Error('모델 설정 조회 실패');
      }
      const data = await response.json();
      setModelSettings(data.settings);
    } catch {
      setError('모델 설정을 불러올 수 없습니다.');
    }
  }, [checkAdminResponse, setError]);

  const fetchAvailableModels = useCallback(async () => {
    try {
      const [modelsResponse, samplersResponse] = await Promise.all([
        fetch('/api/comfyui/models'),
        fetch('/api/comfyui/samplers')
      ]);

      if (!modelsResponse.ok) {
        throw new Error('모델 목록 조회 실패');
      }
      if (!samplersResponse.ok) {
        throw new Error('샘플러 목록 조회 실패');
      }

      const modelsData = await modelsResponse.json();
      const samplersData = await samplersResponse.json();

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

  const updateSystemSetting = async (key: string, value: string, type: string = 'string', category: string = 'general') => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, type, category })
      });

      if (!response.ok) {
        throw new Error('시스템 설정 업데이트 실패');
      }

      showSuccess(`${key} 설정이 업데이트되었습니다.`);
      fetchSystemSettings();
    } catch {
      setError('시스템 설정 업데이트에 실패했습니다.');
    }
  };

  const updateModelSettings = async () => {
    try {
      const response = await fetch('/api/admin/model-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modelSettings)
      });

      if (!response.ok) {
        throw new Error('모델 설정 업데이트 실패');
      }

      const data = await response.json();
      setModelSettings(data.settings);
      showSuccess('모델 설정이 성공적으로 업데이트되었습니다.');
    } catch {
      setError('모델 설정 업데이트에 실패했습니다.');
    }
  };

  return {
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
  };
}