'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface GenerateFormState {
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  endImageFile: File | null;
  setEndImageFile: (file: File | null) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  isNSFW: boolean;
  setIsNSFW: (nsfw: boolean) => void;
  isLoopEnabled: boolean;
  setIsLoopEnabled: (enabled: boolean) => void;
  clearForm: () => void;
}

const GenerateFormContext = createContext<GenerateFormState>({
  selectedFile: null,
  setSelectedFile: () => {},
  endImageFile: null,
  setEndImageFile: () => {},
  prompt: '',
  setPrompt: () => {},
  isNSFW: false,
  setIsNSFW: () => {},
  isLoopEnabled: false,
  setIsLoopEnabled: () => {},
  clearForm: () => {},
});

export function useGenerateFormContext() {
  return useContext(GenerateFormContext);
}

export function GenerateFormProvider({ children }: { children: ReactNode }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [endImageFile, setEndImageFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isNSFW, setIsNSFW] = useState(false);
  const [isLoopEnabled, setIsLoopEnabled] = useState(false);

  const clearForm = () => {
    setSelectedFile(null);
    setEndImageFile(null);
    setPrompt('');
    setIsNSFW(false);
    setIsLoopEnabled(false);
  };

  return (
    <GenerateFormContext.Provider value={{
      selectedFile, setSelectedFile,
      endImageFile, setEndImageFile,
      prompt, setPrompt,
      isNSFW, setIsNSFW,
      isLoopEnabled, setIsLoopEnabled,
      clearForm,
    }}>
      {children}
    </GenerateFormContext.Provider>
  );
}
