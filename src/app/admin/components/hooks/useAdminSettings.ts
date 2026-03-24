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
  const [settingsLoading, setSettingsLoading] = useState(true);
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

  const updateSystemSetting = useCallback(async (key: string, value: string, type: string = 'string', category: string = 'general') => {
    try {
      await apiClient.put('/api/admin/settings', { key, value, type, category });
      showSuccess(`${key} 설정이 업데이트되었습니다.`);
      fetchSystemSettings();
    } catch {
      setError('시스템 설정 업데이트에 실패했습니다.');
    }
  }, [showSuccess, fetchSystemSettings, setError]);

  return useMemo(() => ({
    systemSettings,
    setSystemSettings,
    settingsLoading,
    success,
    fetchSystemSettings,
    updateSystemSetting
  }), [
    systemSettings,
    settingsLoading,
    success,
    fetchSystemSettings,
    updateSystemSetting
  ]);
}
