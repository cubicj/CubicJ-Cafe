"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";

interface I2VControlsSectionProps {
  isFormValid: boolean;
  isGenerating: boolean;
  isNSFW: boolean;
  onSubmit: () => Promise<void>;
}

export function I2VControlsSection({
  isFormValid,
  isGenerating,
  isNSFW,
  onSubmit,
}: I2VControlsSectionProps) {
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Wand2 className="h-4 w-4" />
        비디오 생성
      </h2>
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-center">
        <Button
          onClick={onSubmit}
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
      </Card>
    </div>
  );
}
