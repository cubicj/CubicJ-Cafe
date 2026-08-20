import { useCallback, useEffect, useState } from 'react';
import { apiClient, ApiError } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import type { User } from '@/types';
import type { ComfyUIStatus } from './useI2VForm.types';

const log = createLogger('i2v');

interface UseServerStatusOptions {
  isLoadingAuth: boolean;
  user: User | null;
}

export function useServerStatus({ isLoadingAuth, user }: UseServerStatusOptions) {
  const [serverStatus, setServerStatus] = useState<ComfyUIStatus | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingServerStatus, setIsLoadingServerStatus] = useState(true);

  const fetchServerStatus = useCallback(async () => {
    if (isLoadingAuth || !user) {
      setIsLoadingServerStatus(false);
      return;
    }

    setIsLoadingServerStatus(true);
    try {
      const data = await apiClient.get<ComfyUIStatus>('/api/comfyui/status');
      setServerStatus(data);
    } catch (error) {
      if (error instanceof ApiError && error.status === 503) return;
      if (error instanceof Error && !error.message.includes('503') && !error.message.includes('Service Unavailable')) {
        log.error('Failed to fetch server status', { error: error instanceof Error ? error.message : String(error) });
      }
    } finally {
      setIsLoadingServerStatus(false);
    }
  }, [isLoadingAuth, user]);

  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    await fetchServerStatus();
    setIsRefreshing(false);
  };

  return {
    serverStatus,
    setServerStatus,
    isRefreshing,
    setIsRefreshing,
    isLoadingServerStatus,
    setIsLoadingServerStatus,
    fetchServerStatus,
    handleRefreshStatus,
  };
}

interface UseInitialServerStatusOptions extends UseServerStatusOptions {
  setServerStatus: (status: ComfyUIStatus | null) => void;
  setIsLoadingServerStatus: (loading: boolean) => void;
}

export function useInitialServerStatus({
  isLoadingAuth,
  user,
  setServerStatus,
  setIsLoadingServerStatus,
}: UseInitialServerStatusOptions) {
  useEffect(() => {
    if (isLoadingAuth || !user) return;

    apiClient.get<ComfyUIStatus>('/api/comfyui/status')
      .then(setServerStatus)
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 503) return;
        if (error instanceof Error && !error.message.includes('503') && !error.message.includes('Service Unavailable')) {
          log.error('Failed to fetch server status', { error: error.message });
        }
      })
      .finally(() => setIsLoadingServerStatus(false));
  }, [isLoadingAuth, setIsLoadingServerStatus, setServerStatus, user]);
}
