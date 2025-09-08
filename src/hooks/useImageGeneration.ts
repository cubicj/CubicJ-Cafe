import { useState } from 'react';

interface UseImageGenerationReturn {
  isGenerating: boolean;
  error: string | null;
  generateImage: (prompt: string) => Promise<void>;
}

export default function useImageGeneration(): UseImageGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateImage = async (prompt: string) => {
    setIsGenerating(true);
    setError(null);

    try {
      console.log('Image generation started:', prompt);
      // TODO: ComfyUI API 연동 구현
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    error,
    generateImage,
  };
}