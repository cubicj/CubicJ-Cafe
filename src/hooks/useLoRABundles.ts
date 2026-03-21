import { useState, useEffect } from 'react';
import { createLogger } from '@/lib/logger';

const log = createLogger('hook');

interface LoRABundle {
  id: string;
  displayName: string;
  highLoRAFilename: string | null;
  lowLoRAFilename: string | null;
  order: number;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export function useLoRABundles() {
  const [availableBundles, setAvailableBundles] = useState<LoRABundle[]>([]);
  const [isLoadingBundles, setIsLoadingBundles] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailableBundles = async () => {
    setIsLoadingBundles(true);
    setError(null);
    
    try {
      const response = await fetch('/api/lora-bundles');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '번들 목록을 가져오는데 실패했습니다');
      }
      
      setAvailableBundles(data.bundles || []);
    } catch (err) {
      log.error('Failed to fetch LoRA bundle list', { error: err instanceof Error ? err.message : String(err) });
      setError(err instanceof Error ? err.message : '번들 목록 조회 실패');
    } finally {
      setIsLoadingBundles(false);
    }
  };

  useEffect(() => {
    fetchAvailableBundles();
  }, []);

  return {
    availableBundles,
    isLoadingBundles,
    error,
    fetchAvailableBundles,
  };
}