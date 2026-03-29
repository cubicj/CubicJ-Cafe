'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface I2VFormState {
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  endImageFile: File | null;
  setEndImageFile: (file: File | null) => void;
  audioFile: File | null;
  setAudioFile: (file: File | null) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  isNSFW: boolean;
  setIsNSFW: (nsfw: boolean) => void;
  isLoopEnabled: boolean;
  setIsLoopEnabled: (enabled: boolean) => void;
  clearForm: () => void;
}

const I2VFormContext = createContext<I2VFormState>({
  selectedFile: null,
  setSelectedFile: () => {},
  endImageFile: null,
  setEndImageFile: () => {},
  audioFile: null,
  setAudioFile: () => {},
  prompt: '',
  setPrompt: () => {},
  isNSFW: false,
  setIsNSFW: () => {},
  isLoopEnabled: false,
  setIsLoopEnabled: () => {},
  clearForm: () => {},
});

export function useI2VFormContext() {
  return useContext(I2VFormContext);
}

export function I2VFormProvider({ children }: { children: ReactNode }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [endImageFile, setEndImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isNSFW, setIsNSFW] = useState(false);
  const [isLoopEnabled, setIsLoopEnabled] = useState(false);

  const clearForm = () => {
    setSelectedFile(null);
    setEndImageFile(null);
    setAudioFile(null);
    setPrompt('');
    setIsNSFW(false);
    setIsLoopEnabled(false);
  };

  return (
    <I2VFormContext.Provider value={{
      selectedFile, setSelectedFile,
      endImageFile, setEndImageFile,
      audioFile, setAudioFile,
      prompt, setPrompt,
      isNSFW, setIsNSFW,
      isLoopEnabled, setIsLoopEnabled,
      clearForm,
    }}>
      {children}
    </I2VFormContext.Provider>
  );
}
