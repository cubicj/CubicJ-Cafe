"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoRAItemEditorProps } from "@/types/lora";

export function LoRAItemEditor({
  items,
  group,
  onRemove,
  onUpdateStrength,
  isLoRAAvailable,
}: LoRAItemEditorProps) {
  const groupItems = items.filter(item => item.group === group);
  const groupColor = group === 'HIGH' ? 'green' : 'blue';
  const groupTitle = group === 'HIGH' ? 'High 모델' : 'Low 모델';

  if (groupItems.length === 0) {
    return (
      <div className="space-y-2">
        <h5 className={`text-sm font-medium text-${groupColor}-700 dark:text-${groupColor}-300`}>
          {groupTitle}
        </h5>
        <div className={`text-center py-2 text-xs text-muted-foreground border border-dashed border-${groupColor}-300 dark:border-${groupColor}-700 rounded`}>
          {groupTitle}에 LoRA가 없습니다
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h5 className={`text-sm font-medium text-${groupColor}-700 dark:text-${groupColor}-300`}>
        {groupTitle}
      </h5>
      <div className="space-y-2">
        {groupItems.map((item, index) => {
          const originalIndex = items.findIndex(originalItem => 
            originalItem.loraFilename === item.loraFilename && 
            originalItem.group === item.group &&
            originalItem.strength === item.strength
          );
          const isAvailable = isLoRAAvailable(item.loraFilename);

          return (
            <div 
              key={`${group.toLowerCase()}-${index}`} 
              className={`p-3 bg-${groupColor}-50 dark:bg-${groupColor}-900/20 rounded border border-${groupColor}-200 dark:border-${groupColor}-800`}
            >
              <div className="flex flex-col space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div 
                      className={cn(
                        "text-sm font-medium break-words cursor-help",
                        !isAvailable && "text-red-700 dark:text-red-300"
                      )}
                      title={`${item.loraName}${!isAvailable ? ' - 서버에서 찾을 수 없음' : ''}`}
                    >
                      {item.loraName}
                    </div>
                    <div 
                      className={cn(
                        "text-xs text-muted-foreground font-mono break-all cursor-help",
                        !isAvailable && "text-red-600 dark:text-red-400"
                      )}
                      title={`${item.loraFilename}${!isAvailable ? ' - 서버에서 찾을 수 없음' : ''}`}
                    >
                      {item.loraFilename}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(originalIndex)}
                    className="h-6 w-6 p-0 text-red-600 flex-shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    강도:
                  </span>
                  <div className="text-xs font-medium flex-shrink-0 w-8">
                    {item.strength.toFixed(1)}
                  </div>
                  <div className="flex-1 min-w-[120px] px-1">
                    <Slider
                      value={[item.strength]}
                      onValueChange={(value) => onUpdateStrength(originalIndex, value[0])}
                      min={0.1}
                      max={1.5}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}