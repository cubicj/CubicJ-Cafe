"use client";

import { Textarea } from "./textarea";
import { Card } from "./card";
import { TranslationControls } from "./translation-controls";
import { cn } from "@/lib/utils";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

export function PromptInput({
  value,
  onChange,
  placeholder = "이미지가 어떻게 움직일지 설명하세요...",
  maxLength = 3000,
  className,
}: PromptInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);
    }
  };

  return (
    <Card className={cn("p-6", className)}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Textarea
            id="prompt"
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            className="min-h-[120px] resize-none"
            maxLength={maxLength}
          />
        </div>
        
        {/* 번역 컨트롤 */}
        <div className="border-t pt-3">
          <TranslationControls
            text={value}
            onTextChange={onChange}
          />
        </div>
      </div>
    </Card>
  );
}