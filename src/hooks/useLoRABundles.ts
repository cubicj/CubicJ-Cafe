import { useState, useEffect } from 'react';

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
      console.error('❌ LoRA 번들 목록 조회 실패:', err);
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