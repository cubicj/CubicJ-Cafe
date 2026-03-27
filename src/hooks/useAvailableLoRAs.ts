import { useState, useEffect } from 'react';
import { createLogger } from '@/lib/logger';
import { apiClient, ApiError } from '@/lib/api-client';

const log = createLogger('hook');

export function useAvailableLoRAs(model: string = 'wan') {
  const [availableLoRAs, setAvailableLoRAs] = useState<string[]>([]);
  const [isRefreshingLoRAs, setIsRefreshingLoRAs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailableLoRAs = async (showLoading = false) => {
    if (showLoading) {
      setIsRefreshingLoRAs(true);
    }

    try {
      const data = await apiClient.get<{ loras: string[] }>(`/api/comfyui/loras?model=${model}`);
      setAvailableLoRAs(data.loras || []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        setAvailableLoRAs([]);
        return;
      }
      if (err instanceof Error && !err.message.includes('503') && !err.message.includes('Service Unavailable')) {
        log.error('Failed to fetch LoRA list', { error: err instanceof Error ? err.message : String(err) });
      }
      setAvailableLoRAs([]);
      if (showLoading) {
        setError(err instanceof Error ? err.message : 'LoRA 목록 조회 실패');
      }
    } finally {
      if (showLoading) {
        setIsRefreshingLoRAs(false);
      }
    }
  };

  const isLoRAAvailable = (loraFilename: string | null | undefined) => {
    if (!loraFilename) return false;
    return availableLoRAs.some(lora =>
      lora && (lora.includes(loraFilename) || loraFilename.includes(lora))
    );
  };

  useEffect(() => {
    fetchAvailableLoRAs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model]);

  return {
    availableLoRAs,
    isRefreshingLoRAs,
    error,
    fetchAvailableLoRAs,
    isLoRAAvailable,
  };
}
