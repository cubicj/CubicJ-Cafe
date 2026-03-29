"use client";

import { FileUpload } from "@/components/ui/file-upload";
import { AudioUpload } from "@/components/ui/audio-upload";
import { PromptInput } from "@/components/ui/prompt-input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bot, MessageSquare, Music } from "lucide-react";

interface ImageUploadSectionProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  endImageFile: File | null;
  onEndImageSelect: (file: File | null) => void;
  isLoopEnabled: boolean;
  onLoopToggle: (enabled: boolean) => void;
  prompt: string;
  onPromptChange: (prompt: string) => void;
  showEndImage?: boolean;
  audioFile: File | null;
  onAudioSelect: (file: File | null) => void;
  showAudio?: boolean;
}

export function ImageUploadSection({
  selectedFile,
  onFileSelect,
  endImageFile,
  onEndImageSelect,
  isLoopEnabled,
  onLoopToggle,
  prompt,
  onPromptChange,
  showEndImage = true,
  audioFile,
  onAudioSelect,
  showAudio = false,
}: ImageUploadSectionProps) {
  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Bot className="h-4 w-4" />
          시작 이미지 <span className="text-sm text-red-500 font-normal">(필수)</span>
        </h2>
        <FileUpload
          onFileSelect={onFileSelect}
          selectedFile={selectedFile}
          maxSize={10 * 1024 * 1024}
        />
      </div>

      {showEndImage && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Switch
              id="loop-mode"
              checked={isLoopEnabled}
              onCheckedChange={onLoopToggle}
            />
            <Label htmlFor="loop-mode" className="text-sm font-medium">
              루프 모드
            </Label>
          </div>
        </div>
      )}

      {showEndImage && !isLoopEnabled && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bot className="h-4 w-4" />
            끝 이미지 <span className="text-sm text-gray-500 font-normal">(선택사항)</span>
          </h2>
          <FileUpload
            onFileSelect={onEndImageSelect}
            selectedFile={endImageFile}
            maxSize={10 * 1024 * 1024}
          />
        </div>
      )}

      {showAudio && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Music className="h-4 w-4" />
            레퍼런스 오디오 <span className="text-sm text-gray-500 font-normal">(선택사항)</span>
          </h2>
          <AudioUpload
            onFileSelect={onAudioSelect}
            selectedFile={audioFile}
            maxSize={20 * 1024 * 1024}
          />
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          동작 프롬프트
        </h2>
        <PromptInput
          value={prompt}
          onChange={onPromptChange}
          maxLength={5000}
        />
      </div>
    </div>
  );
}