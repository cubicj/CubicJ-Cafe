import { useState, useEffect } from 'react';

export function useAvailableLoRAs() {
  const [availableLoRAs, setAvailableLoRAs] = useState<string[]>([]);
  const [isRefreshingLoRAs, setIsRefreshingLoRAs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailableLoRAs = async (showLoading = false) => {
    if (showLoading) {
      setIsRefreshingLoRAs(true);
    }
    
    try {
      const response = await fetch('/api/comfyui/loras');
      const data = await response.json();
      
      if (response.ok) {
        setAvailableLoRAs(data.loras || []);
      } else {
        // 503 서비스 이용 불가능 상태는 로그만 남기고 에러 처리하지 않음
        if (response.status === 503) {
          setAvailableLoRAs([]);
          return;
        }
        throw new Error(data.error || 'LoRA 목록 조회 실패');
      }
    } catch (err) {
      console.error('❌ LoRA 목록 조회 실패:', err);
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
  }, []);

  return {
    availableLoRAs,
    isRefreshingLoRAs,
    error,
    fetchAvailableLoRAs,
    isLoRAAvailable,
  };
}