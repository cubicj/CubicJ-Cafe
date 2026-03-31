"use client";

import { useState, useEffect } from "react";
import { apiClient } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';

const log = createLogger('ui');
import { Card } from "./card";
import { Label } from "./label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Slider } from "./slider";
import { Button } from "./button";
import { RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoRAModel {
  id: string;
  name: string;
  filename?: string;
  description: string;
  type: string;
  defaultStrength: number;
}

interface LoRASelectorProps {
  selectedLoRA: string;
  strength: number;
  onLoRAChange: (loraId: string) => void;
  onStrengthChange: (strength: number) => void;
  className?: string;
}

export function LoRASelector({
  selectedLoRA,
  strength,
  onLoRAChange,
  onStrengthChange,
  className,
}: LoRASelectorProps) {
  const [availableLoRAs, setAvailableLoRAs] = useState<LoRAModel[]>([
    {
      id: "none",
      name: "없음",
      description: "LoRA 모델을 사용하지 않습니다",
      type: "기본",
      defaultStrength: 0,
    },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLoRAs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      log.debug('Fetching LoRA list');
      const data = await apiClient.get<{ loras: string[]; count: number }>('/api/comfyui/loras');

      log.debug('LoRA list fetched', { count: data.count });
      
      const loraModels: LoRAModel[] = [
        {
          id: "none",
          name: "없음",
          description: "LoRA 모델을 사용하지 않습니다",
          type: "기본",
          defaultStrength: 0,
        },
        ...data.loras.map((filename: string) => ({
          id: filename,
          name: filename.replace(/\.(safetensors|ckpt|pt)$/i, ''),
          filename: filename,
          description: `ComfyUI LoRA 모델: ${filename}`,
          type: "서버",
          defaultStrength: 0.8,
        }))
      ];
      
      setAvailableLoRAs(loraModels);
      
    } catch (err) {
      if (err instanceof Error && !err.message.includes('503') && !err.message.includes('Service Unavailable')) {
        log.error('Failed to fetch LoRA list', { error: err instanceof Error ? err.message : String(err) });
      }
      setError(err instanceof Error ? err.message : 'LoRA 목록 조회 실패');
      
      setAvailableLoRAs([{
        id: "none",
        name: "없음",
        description: "LoRA 모델을 사용하지 않습니다",
        type: "기본",
        defaultStrength: 0,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLoRAs();
  }, []);

  const selectedModel = availableLoRAs.find((model) => model.id === selectedLoRA);
  const isLoRASelected = selectedLoRA && selectedLoRA !== "none";

  const handleLoRAChange = (value: string) => {
    onLoRAChange(value);
    const model = availableLoRAs.find((m) => m.id === value);
    if (model && model.defaultStrength > 0) {
      onStrengthChange(model.defaultStrength);
    }
  };

  return (
    <Card className={cn("p-6", className)}>
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="lora-select" className="text-sm font-medium">
              LoRA 모델
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLoRAs}
              disabled={isLoading}
              className="flex items-center gap-1 h-7 px-2"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            ComfyUI 서버에서 사용 가능한 LoRA 모델을 선택하세요.
          </p>
          {error && (
            <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-md text-red-700 dark:text-red-400 text-xs">
              <AlertCircle className="h-3 w-3" />
              {error}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Select value={selectedLoRA} onValueChange={handleLoRAChange} disabled={isLoading}>
            <SelectTrigger id="lora-select">
              <SelectValue placeholder={isLoading ? "LoRA 목록 로딩 중..." : "LoRA 모델 선택"} />
            </SelectTrigger>
            <SelectContent>
              {availableLoRAs.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="font-medium">{model.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {model.type}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
              {isLoading && (
                <SelectItem value="_loading" disabled>
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                    <span className="text-muted-foreground">로딩 중...</span>
                  </div>
                </SelectItem>
              )}
            </SelectContent>
          </Select>

          {selectedModel && selectedModel.id !== "none" && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-1">
                <h4 className="font-medium text-sm">{selectedModel.name}</h4>
                {selectedModel.filename && (
                  <p className="text-xs font-mono text-muted-foreground bg-background px-2 py-1 rounded">
                    {selectedModel.filename}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {selectedModel.description}
                </p>
              </div>
            </div>
          )}
        </div>

        {isLoRASelected && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="strength-slider" className="text-sm font-medium">
                강도 설정
              </Label>
              <p className="text-xs text-muted-foreground">
                LoRA 효과의 강도를 조절합니다. (0.1 - 1.0)
              </p>
            </div>
            
            <div className="space-y-3">
              <Slider
                id="strength-slider"
                min={0.1}
                max={1.0}
                step={0.1}
                value={[strength]}
                onValueChange={(value) => onStrengthChange(value[0])}
                className="w-full"
              />
              
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>약함 (0.1)</span>
                <span className="font-mono font-medium text-foreground">
                  {strength.toFixed(1)}
                </span>
                <span>강함 (1.0)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}