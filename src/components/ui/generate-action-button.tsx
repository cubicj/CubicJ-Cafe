import React from 'react';
import { Button } from './button';
import { Wand2 } from 'lucide-react';

interface GenerateActionButtonProps {
  isGenerating: boolean;
  isFormValid: boolean;
  isNSFW: boolean;
  onGenerate: () => void;
}

export function GenerateActionButton({ 
  isGenerating, 
  isFormValid, 
  isNSFW, 
  onGenerate 
}: GenerateActionButtonProps) {
  return (
    <div className="flex items-center justify-center">
      <Button
        onClick={onGenerate}
        disabled={!isFormValid || isGenerating}
        className="w-full"
        size="lg"
      >
        {isGenerating ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            비디오 생성 중...
          </>
        ) : (
          <>
            <Wand2 className="h-4 w-4 mr-2" />
            {isNSFW ? 'NSFW 비디오 생성하기' : 'SFW 비디오 생성하기'}
          </>
        )}
      </Button>
    </div>
  );
}