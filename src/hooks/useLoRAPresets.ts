import { useState, useEffect } from 'react';
import { LoRAPresetItem } from '@/types';

interface LoRAPreset {
  id: string;
  name: string;
  isDefault: boolean;
  isPublic: boolean;
  order: number;
  loraItems: LoRAPresetItem[];
  createdAt: string;
  updatedAt: string;
}

export function useLoRAPresets() {
  const [presets, setPresets] = useState<LoRAPreset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPresets = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/lora-presets');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '프리셋을 불러오는데 실패했습니다');
      }
      
      setPresets(data.presets || []);
    } catch (err) {
      console.error('❌ 프리셋 조회 실패:', err);
      setError(err instanceof Error ? err.message : '프리셋 조회 실패');
    } finally {
      setIsLoading(false);
    }
  };

  const reorderPresets = async (presetIds: string[]) => {
    try {
      const response = await fetch('/api/lora-presets/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presetIds }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '프리셋 순서 변경에 실패했습니다');
      }
      
    } catch (err) {
      console.error('❌ 프리셋 순서 변경 실패:', err);
      alert(err instanceof Error ? err.message : '프리셋 순서 변경에 실패했습니다');
      fetchPresets();
    }
  };

  const savePreset = async (preset: Partial<LoRAPreset> & { loraItems: LoRAPresetItem[] }) => {
    try {
      const url = preset.id ? `/api/lora-presets/${preset.id}` : '/api/lora-presets';
      const method = preset.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: preset.name,
          loraItems: preset.loraItems,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '프리셋 저장에 실패했습니다');
      }
      
      await fetchPresets();
      return data;
    } catch (err) {
      console.error('❌ 프리셋 저장 실패:', err);
      throw err;
    }
  };

  const deletePreset = async (preset: LoRAPreset) => {
    if (preset.isDefault || preset.isPublic) {
      alert('기본 프리셋과 공개 프리셋은 삭제할 수 없습니다.');
      return;
    }
    
    if (!confirm(`"${preset.name}" 프리셋을 삭제하시겠습니까?`)) return;
    
    try {
      const response = await fetch(`/api/lora-presets/${preset.id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '프리셋 삭제에 실패했습니다');
      }
      
      await fetchPresets();
    } catch (err) {
      console.error('❌ 프리셋 삭제 실패:', err);
      alert(err instanceof Error ? err.message : '프리셋 삭제에 실패했습니다');
    }
  };

  useEffect(() => {
    fetchPresets();
  }, []);

  return {
    presets,
    setPresets,
    isLoading,
    error,
    fetchPresets,
    reorderPresets,
    savePreset,
    deletePreset,
  };
}