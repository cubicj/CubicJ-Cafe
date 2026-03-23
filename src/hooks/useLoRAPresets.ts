import { useState, useEffect } from 'react';
import { LoRAPresetItem } from '@/types';
import { createLogger } from '@/lib/logger';
import { apiClient } from '@/lib/api-client';

const log = createLogger('hook');

interface LoRAPreset {
  id: string;
  name: string;
  isDefault: boolean;
  isPublic: boolean;
  order: number;
  model: string;
  loraItems: LoRAPresetItem[];
  createdAt: string;
  updatedAt: string;
}

export function useLoRAPresets(model: string = 'wan') {
  const [presets, setPresets] = useState<LoRAPreset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPresets = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.get<{ presets: LoRAPreset[] }>(`/api/lora-presets?model=${model}`);
      setPresets(data.presets || []);
    } catch (err) {
      log.error('Failed to fetch presets', { error: err instanceof Error ? err.message : String(err) });
      setError(err instanceof Error ? err.message : '프리셋 조회 실패');
    } finally {
      setIsLoading(false);
    }
  };

  const reorderPresets = async (presetIds: string[]) => {
    try {
      await apiClient.put('/api/lora-presets/reorder', { presetIds });
    } catch (err) {
      log.error('Failed to reorder presets', { error: err instanceof Error ? err.message : String(err) });
      alert(err instanceof Error ? err.message : '프리셋 순서 변경에 실패했습니다');
      fetchPresets();
    }
  };

  const savePreset = async (preset: Partial<LoRAPreset> & { loraItems: LoRAPresetItem[] }) => {
    try {
      const body = {
        name: preset.name,
        model,
        loraItems: preset.loraItems,
      };

      const data = preset.id
        ? await apiClient.put(`/api/lora-presets/${preset.id}`, body)
        : await apiClient.post('/api/lora-presets', body);

      await fetchPresets();
      return data;
    } catch (err) {
      log.error('Failed to save preset', { error: err instanceof Error ? err.message : String(err) });
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
      await apiClient.delete(`/api/lora-presets/${preset.id}`);
      await fetchPresets();
    } catch (err) {
      log.error('Failed to delete preset', { error: err instanceof Error ? err.message : String(err) });
      alert(err instanceof Error ? err.message : '프리셋 삭제에 실패했습니다');
    }
  };

  useEffect(() => {
    fetchPresets();
  }, [model]);

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
