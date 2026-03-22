import { useState, useEffect } from 'react';
import { createLogger } from '@/lib/logger';

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
      const response = await fetch(`/api/comfyui/loras?model=${model}`);
      const data = await response.json();
      
      if (response.ok) {
        setAvailableLoRAs(data.loras || []);
      } else {
        if (response.status === 503) {
          setAvailableLoRAs([]);
          return;
        }
        throw new Error(data.error || 'LoRA 목록 조회 실패');
      }
    } catch (err) {
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchAvailableLoRAs();
  }, [model]);

  return {
    availableLoRAs,
    isRefreshingLoRAs,
    error,
    fetchAvailableLoRAs,
    isLoRAAvailable,
  };
}