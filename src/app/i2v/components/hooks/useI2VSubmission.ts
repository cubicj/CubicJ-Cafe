import { useState } from 'react';
import { apiClient, ApiError } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import type { ModelCapabilities, VideoModel } from '@/lib/comfyui/workflows/types';
import type { PresetData, SubmitMessage } from './useI2VForm.types';

const log = createLogger('i2v');

interface UseI2VSubmissionOptions {
  selectedFile: File | null;
  endImageFile: File | null;
  audioPresetId: string | null;
  isLoopEnabled: boolean;
  prompt: string;
  isNSFW: boolean;
  selectedPresetIds: string[];
  currentPresets: PresetData[];
  activeModel: VideoModel;
  enabledModels: VideoModel[];
  capabilities: ModelCapabilities;
  videoDuration: number;
  clearForm: () => void;
}

export function useI2VSubmission({
  selectedFile,
  endImageFile,
  audioPresetId,
  isLoopEnabled,
  prompt,
  isNSFW,
  selectedPresetIds,
  currentPresets,
  activeModel,
  enabledModels,
  capabilities,
  videoDuration,
  clearForm,
}: UseI2VSubmissionOptions) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasUnavailableLoRAs, setHasUnavailableLoRAs] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<SubmitMessage | null>(null);

  const handleSubmit = async () => {
    if (!enabledModels.includes(activeModel)) {
      setSubmitMessage({ type: 'error', message: '선택 가능한 모델이 없습니다.' });
      return;
    }

    if (!selectedFile) {
      setSubmitMessage({ type: 'error', message: '이미지를 업로드해주세요.' });
      return;
    }

    if (!prompt.trim()) {
      setSubmitMessage({ type: 'error', message: '프롬프트를 입력해주세요.' });
      return;
    }

    if (hasUnavailableLoRAs) {
      setSubmitMessage({ type: 'error', message: '선택한 LoRA 프리셋에 서버에서 찾을 수 없는 LoRA가 포함되어 있습니다. 프리셋을 수정하거나 해제한 후 다시 시도해주세요.' });
      return;
    }

    setIsGenerating(true);
    setSubmitMessage(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      if (endImageFile) {
        formData.append('endImage', endImageFile);
      }
      formData.append('prompt', prompt.trim());
      formData.append('model', activeModel);
      const effectiveIsNSFW = capabilities.nsfw ? isNSFW : false;
      formData.append('isNSFW', effectiveIsNSFW.toString());
      formData.append('isLoop', isLoopEnabled.toString());
      formData.append('videoDuration', videoDuration.toString());

      if (audioPresetId) {
        formData.append('audioPresetId', audioPresetId);
      }

      if (currentPresets && currentPresets.length > 0) {
        const mergedLoRAMap = new Map();

        currentPresets.forEach(preset => {
          preset.loraItems.forEach((item, index) => {
            mergedLoRAMap.set(item.loraFilename, {
              loraFilename: item.loraFilename,
              loraName: item.loraName,
              strength: item.strength,
              group: item.group,
              order: item.order ?? index,
            });
          });
        });

        const mergedLoRAItems = Array.from(mergedLoRAMap.values());

        if (mergedLoRAItems.length > 0) {
          formData.append('loraPreset', JSON.stringify({
            presetId: selectedPresetIds.join(','),
            presetName: currentPresets.map(p => p.name).join(', '),
            loraItems: mergedLoRAItems,
          }));
        }
      }

      await apiClient.postFormData<{ requestId: string }>('/api/i2v', formData);

      clearForm();
    } catch (error) {
      log.error('Queue request failed', { error: error instanceof Error ? error.message : String(error) });

      if (error instanceof ApiError) {
        if (error.status === 429) {
          setSubmitMessage({
            type: 'error',
            message: error.errorMessage || '현재 처리 중인 요청이 2개입니다. 기존 요청이 완료된 후 다시 시도해주세요.'
          });
        } else {
          setSubmitMessage({
            type: 'error',
            message: error.errorMessage || '요청 처리 중 오류가 발생했습니다.'
          });
        }
        return;
      }

      const isNetworkError = error instanceof TypeError && error.message.includes('fetch');
      const errorMessage = isNetworkError
        ? '네트워크 연결에 문제가 있습니다. 인터넷 연결과 서버 상태를 확인해주세요.'
        : (error instanceof Error ? error.message : '요청 처리 중 오류가 발생했습니다.');

      setSubmitMessage({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    clearForm();
    setSubmitMessage(null);
  };

  return {
    isGenerating,
    setIsGenerating,
    hasUnavailableLoRAs,
    setHasUnavailableLoRAs,
    submitMessage,
    setSubmitMessage,
    handleSubmit,
    handleReset,
  };
}
