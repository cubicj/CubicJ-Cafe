import { useState, useEffect } from 'react';

export interface SubmitMessage {
  type: 'success' | 'error';
  message: string;
  requestId?: string;
}

export interface LoRAPreset {
  id: string;
  name: string;
  loraItems: Array<{
    loraFilename: string;
    strength: number;
    group: string;
  }>;
}

export function useGenerateForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [endImageFile, setEndImageFile] = useState<File | null>(null);
  const [isLoopEnabled, setIsLoopEnabled] = useState(false);
  const [prompt, setPrompt] = useState('');
  
  const [selectedPresetIds, setSelectedPresetIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('selectedPresetIds');
      try {
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  });
  
  const [currentPresets, setCurrentPresets] = useState<LoRAPreset[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isNSFW, setIsNSFW] = useState(false);
  
  const [videoDuration, setVideoDuration] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('videoDuration');
      try {
        const parsed = stored ? parseFloat(stored) : 4;
        return isNaN(parsed) ? 4 : Math.max(1, Math.min(6, parsed));
      } catch {
        return 4;
      }
    }
    return 4;
  });
  
  const [submitMessage, setSubmitMessage] = useState<SubmitMessage | null>(null);

  useEffect(() => {
    localStorage.setItem('selectedPresetIds', JSON.stringify(selectedPresetIds));
  }, [selectedPresetIds]);

  useEffect(() => {
    localStorage.setItem('videoDuration', videoDuration.toString());
  }, [videoDuration]);

  const validateForm = (): string | null => {
    if (!selectedFile) {
      return '이미지를 업로드해주세요.';
    }
    
    if (!prompt.trim()) {
      return '프롬프트를 입력해주세요.';
    }
    
    return null;
  };

  const mergeLoRAPresets = (presets: LoRAPreset[]) => {
    const mergedLoRAMap = new Map();
    
    presets.forEach(preset => {
      preset.loraItems.forEach(item => {
        mergedLoRAMap.set(item.loraFilename, {
          loraFilename: item.loraFilename,
          strength: item.strength,
          group: item.group
        });
      });
    });
    
    return Array.from(mergedLoRAMap.values());
  };

  const handleGenerate = async () => {
    const validationError = validateForm();
    if (validationError) {
      setSubmitMessage({ type: 'error', message: validationError });
      return;
    }

    setIsGenerating(true);
    setSubmitMessage(null);
    
    try {
      const formData = new FormData();
      formData.append('image', selectedFile!);
      
      if (endImageFile) {
        formData.append('endImage', endImageFile);
      }
      
      formData.append('prompt', prompt.trim());
      formData.append('isNSFW', isNSFW.toString());
      formData.append('duration', videoDuration.toString());
      
      if (currentPresets && currentPresets.length > 0) {
        const mergedLoRAItems = mergeLoRAPresets(currentPresets);
        
        if (mergedLoRAItems.length > 0) {
          formData.append('loraPreset', JSON.stringify({
            presetIds: selectedPresetIds,
            presetNames: currentPresets.map(p => p.name),
            loraItems: mergedLoRAItems,
          }));
        }
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (!response.ok) {
        if (response.status === 429) {
          setSubmitMessage({ 
            type: 'error', 
            message: result.error || '현재 처리 중인 요청이 2개입니다. 기존 요청이 완료된 후 다시 시도해주세요.' 
          });
        } else {
          setSubmitMessage({ 
            type: 'error', 
            message: result.error || '요청 처리 중 오류가 발생했습니다.' 
          });
        }
        return;
      }

      if (result.success) {
        setSubmitMessage({ 
          type: 'success', 
          message: '요청이 큐에 추가되었습니다! 위쪽 실행 큐에서 진행 상황을 확인하세요.',
          requestId: result.requestId
        });
        
        resetFormAfterSubmit();
      }
      
    } catch (error) {
      console.error('큐 요청 실패:', error);
      
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

  const resetFormAfterSubmit = () => {
    setSelectedFile(null);
    setEndImageFile(null);
    setIsLoopEnabled(false);
    setPrompt('');
  };

  const handleNewGeneration = () => {
    setSelectedFile(null);
    setEndImageFile(null);
    setIsLoopEnabled(false);
    setPrompt('');
    setSubmitMessage(null);
  };

  const clearSubmitMessage = () => {
    setSubmitMessage(null);
  };

  return {
    selectedFile,
    setSelectedFile,
    endImageFile,
    setEndImageFile,
    isLoopEnabled,
    setIsLoopEnabled,
    prompt,
    setPrompt,
    selectedPresetIds,
    setSelectedPresetIds,
    currentPresets,
    setCurrentPresets,
    isGenerating,
    isNSFW,
    setIsNSFW,
    videoDuration,
    setVideoDuration,
    submitMessage,
    handleGenerate,
    handleNewGeneration,
    clearSubmitMessage,
  };
}