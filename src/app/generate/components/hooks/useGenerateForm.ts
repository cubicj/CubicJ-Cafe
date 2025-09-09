"use client";

import { useState, useEffect } from "react";
import { User } from "@/types";

interface ServerInfo {
  type: 'local' | 'runpod'
  name: string
  status: 'connected' | 'disconnected' | 'error'
  queue?: {
    remaining: number
  }
  error?: string
}

interface ComfyUIStatus {
  servers: ServerInfo[]
  summary: {
    local: {
      active: number
      total: number
    }
    runpod: {
      active: number
      total: number
    }
    totalActive: number
    totalServers: number
  }
  error?: string
  timestamp: string
}

interface SubmitMessage {
  type: 'success' | 'error';
  message: string;
  requestId?: string;
}

interface UseGenerateFormReturn {
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  endImageFile: File | null;
  setEndImageFile: (file: File | null) => void;
  isLoopEnabled: boolean;
  setIsLoopEnabled: (enabled: boolean) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  selectedPresetIds: string[];
  setSelectedPresetIds: (ids: string[]) => void;
  currentPresets: Array<{ id: string; name: string; loraItems: Array<{ loraFilename: string; strength: number; group: string }> }>;
  setCurrentPresets: (presets: Array<{ id: string; name: string; loraItems: Array<{ loraFilename: string; strength: number; group: string }> }>) => void;
  presets: Array<{ id: string; name: string; loraItems: Array<{ loraFilename: string; strength: number; group: string }> }>;
  setPresets: (presets: Array<{ id: string; name: string; loraItems: Array<{ loraFilename: string; strength: number; group: string }> }>) => void;
  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;
  isNSFW: boolean;
  setIsNSFW: (nsfw: boolean) => void;
  videoDuration: number;
  setVideoDuration: (duration: number) => void;
  submitMessage: SubmitMessage | null;
  setSubmitMessage: (message: SubmitMessage | null) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  isLoadingAuth: boolean;
  setIsLoadingAuth: (loading: boolean) => void;
  serverStatus: ComfyUIStatus | null;
  setServerStatus: (status: ComfyUIStatus | null) => void;
  isRefreshing: boolean;
  setIsRefreshing: (refreshing: boolean) => void;
  isLoadingServerStatus: boolean;
  setIsLoadingServerStatus: (loading: boolean) => void;
  isFormValid: boolean;
  handleGenerate: () => Promise<void>;
  handleNewGeneration: () => void;
  handleRefreshStatus: () => Promise<void>;
  fetchUser: () => Promise<void>;
  fetchServerStatus: () => Promise<void>;
  fetchPresets: () => Promise<any[]>;
}

export function useGenerateForm(): UseGenerateFormReturn {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [endImageFile, setEndImageFile] = useState<File | null>(null);
  const [isLoopEnabled, setIsLoopEnabled] = useState(false);
  const [prompt, setPrompt] = useState("");
  
  const [selectedPresetIds, setSelectedPresetIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('selectedPresetIds');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });
  
  const [currentPresets, setCurrentPresets] = useState<Array<{ id: string; name: string; loraItems: Array<{ loraFilename: string; strength: number; group: string }> }>>([]);
  const [presets, setPresets] = useState<Array<{ id: string; name: string; loraItems: Array<{ loraFilename: string; strength: number; group: string }> }>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isNSFW, setIsNSFW] = useState(false);
  
  const [videoDuration, setVideoDuration] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('videoDuration');
        return saved ? parseInt(saved, 10) : 5;
      } catch {
        return 5;
      }
    }
    return 5;
  });

  const [submitMessage, setSubmitMessage] = useState<SubmitMessage | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [serverStatus, setServerStatus] = useState<ComfyUIStatus | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingServerStatus, setIsLoadingServerStatus] = useState(true);

  useEffect(() => {
    if (isLoopEnabled && selectedFile) {
      setEndImageFile(selectedFile);
    } else if (!isLoopEnabled) {
      setEndImageFile(null);
    }
  }, [isLoopEnabled, selectedFile]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedPresetIds', JSON.stringify(selectedPresetIds));
    }
  }, [selectedPresetIds]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('videoDuration', videoDuration.toString());
    }
  }, [videoDuration]);

  const fetchUser = async () => {
    setIsLoadingAuth(true);
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user || null);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
      setUser(null);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const fetchServerStatus = async () => {
    setIsLoadingServerStatus(true);
    try {
      const response = await fetch('/api/comfyui/status');
      if (response.ok) {
        const data = await response.json();
        setServerStatus(data);
      }
    } catch (error) {
      // 503 상태코드는 정상적인 상황(서버 다운)이므로 에러 로깅하지 않음
      if (error instanceof Error && !error.message.includes('503') && !error.message.includes('Service Unavailable')) {
        console.error('서버 상태 조회 실패:', error);
      }
    } finally {
      setIsLoadingServerStatus(false);
    }
  };

  const fetchPresets = async () => {
    try {
      const response = await fetch('/api/lora-presets');
      const data = await response.json();
      
      if (response.ok) {
        return data.presets || [];
      }
    } catch (err) {
      console.error('❌ LoRA 프리셋 목록 조회 실패:', err);
    }
    return [];
  };

  const handleGenerate = async () => {
    if (!selectedFile) {
      setSubmitMessage({ type: 'error', message: '이미지를 업로드해주세요.' });
      return;
    }
    
    if (!prompt.trim()) {
      setSubmitMessage({ type: 'error', message: '프롬프트를 입력해주세요.' });
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
      formData.append('isNSFW', isNSFW.toString());
      formData.append('duration', videoDuration.toString());
      
      if (currentPresets && currentPresets.length > 0) {
        const mergedLoRAMap = new Map();
        
        currentPresets.forEach(preset => {
          preset.loraItems.forEach(item => {
            mergedLoRAMap.set(item.loraFilename, {
              loraFilename: item.loraFilename,
              strength: item.strength,
              group: item.group
            });
          });
        });
        
        const mergedLoRAItems = Array.from(mergedLoRAMap.values());
        
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
        
        setSelectedFile(null);
        setEndImageFile(null);
        setIsLoopEnabled(false);
        setPrompt("");
      }
      
    } catch (error) {
      console.error("큐 요청 실패:", error);
      
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

  const handleNewGeneration = () => {
    setSelectedFile(null);
    setEndImageFile(null);
    setIsLoopEnabled(false);
    setPrompt("");
    setSubmitMessage(null);
  };

  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    await fetchServerStatus();
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchUser();
    fetchServerStatus();
    
    fetchPresets().then((allPresets) => {
      setPresets(allPresets);
    });
  }, []);

  useEffect(() => {
    if (presets.length > 0) {
      if (selectedPresetIds.length === 0) {
        const basePreset = presets.find(preset => preset.name === '베이스 가속로라');
        
        if (basePreset) {
          setSelectedPresetIds([basePreset.id]);
        }
      }
    }
  }, [presets, selectedPresetIds]);

  useEffect(() => {
    if (presets.length > 0 && selectedPresetIds.length > 0) {
      const restoredPresets = presets.filter(preset => 
        selectedPresetIds.includes(preset.id)
      );
      if (restoredPresets.length > 0) {
        setCurrentPresets(restoredPresets);
      }
    } else if (selectedPresetIds.length === 0) {
      setCurrentPresets([]);
    }
  }, [presets, selectedPresetIds]);

  const isFormValid = !!selectedFile && prompt.trim().length > 0 && (serverStatus?.summary?.totalActive || 0) > 0;

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
    presets,
    setPresets,
    isGenerating,
    setIsGenerating,
    isNSFW,
    setIsNSFW,
    videoDuration,
    setVideoDuration,
    submitMessage,
    setSubmitMessage,
    user,
    setUser,
    isLoadingAuth,
    setIsLoadingAuth,
    serverStatus,
    setServerStatus,
    isRefreshing,
    setIsRefreshing,
    isLoadingServerStatus,
    setIsLoadingServerStatus,
    isFormValid,
    handleGenerate,
    handleNewGeneration,
    handleRefreshStatus,
    fetchUser,
    fetchServerStatus,
    fetchPresets,
  };
}