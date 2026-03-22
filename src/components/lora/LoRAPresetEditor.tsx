"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Plus, X } from "lucide-react";
import { LoRAPresetEditorProps } from "@/types/lora";
import { LoRAItemEditor } from "./LoRAItemEditor";

export function LoRAPresetEditor({
  isOpen,
  onOpenChange,
  editingPreset,
  editForm,
  onEditFormChange,
  onSave,
  onAddLoRA,
  isLoRAAvailable,
  activeModel,
  availableLoRAs = [],
}: LoRAPresetEditorProps) {
  const [ltxSelectedLoRA, setLtxSelectedLoRA] = useState('');
  const [ltxLoRAStrength, setLtxLoRAStrength] = useState(0.8);

  const removeLoRAItem = (index: number) => {
    const newLoraItems = editForm.loraItems.filter((_, i) => i !== index);
    onEditFormChange({
      ...editForm,
      loraItems: newLoraItems,
    });
  };

  const updateLoRAStrength = (index: number, strength: number) => {
    const newLoraItems = editForm.loraItems.map((item, i) =>
      i === index ? { ...item, strength } : item
    );
    onEditFormChange({
      ...editForm,
      loraItems: newLoraItems,
    });
  };

  const addLtxLoRA = () => {
    if (!ltxSelectedLoRA) return;

    const filename = ltxSelectedLoRA;
    const displayName = filename.split(/[/\\]/).pop()?.replace(/\.\w+$/, '') || filename;

    onEditFormChange({
      ...editForm,
      loraItems: [
        ...editForm.loraItems,
        {
          loraFilename: filename,
          loraName: displayName,
          strength: ltxLoRAStrength,
          group: 'HIGH' as const,
          order: editForm.loraItems.length,
        },
      ],
    });

    setLtxSelectedLoRA('');
    setLtxLoRAStrength(0.8);
  };

  const usedFilenames = new Set(editForm.loraItems.map(item => item.loraFilename));
  const unusedLoRAs = availableLoRAs.filter(lora => !usedFilenames.has(lora));

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[90vw] sm:max-w-2xl max-h-[90vh] mx-auto w-full overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {editingPreset ? '프리셋 편집' : '새 프리셋 만들기'}
          </DialogTitle>
          <DialogDescription>
            LoRA 프리셋의 이름과 포함할 LoRA들을 설정하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 w-full overflow-hidden">
          <div className="space-y-2">
            <Label htmlFor="preset-name">프리셋 이름</Label>
            <Input
              id="preset-name"
              value={editForm.name}
              onChange={(e) => onEditFormChange({
                ...editForm,
                name: e.target.value
              })}
              placeholder="예: 애니메이션 스타일"
              autoComplete="off"
              autoFocus={false}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>포함된 LoRA</Label>
              {activeModel !== 'ltx' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAddLoRA}
                  className="h-7 px-2"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  LoRA 추가
                </Button>
              )}
            </div>

            {activeModel === 'ltx' ? (
              <div className="space-y-3">
                {editForm.loraItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between gap-2 p-2 rounded border">
                    <span className="text-sm truncate flex-1" title={item.loraFilename}>
                      {item.loraName}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1 w-28">
                        <Slider
                          value={[item.strength]}
                          onValueChange={([v]) => updateLoRAStrength(index, v)}
                          min={0}
                          max={1}
                          step={0.05}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-7 text-right">
                          {item.strength.toFixed(2)}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeLoRAItem(index)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}

                {unusedLoRAs.length > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    <Select value={ltxSelectedLoRA} onValueChange={setLtxSelectedLoRA}>
                      <SelectTrigger className="flex-1 h-8 text-xs">
                        <SelectValue placeholder="LoRA 선택..." />
                      </SelectTrigger>
                      <SelectContent>
                        {unusedLoRAs.map(lora => {
                          const displayName = lora.split(/[/\\]/).pop()?.replace(/\.\w+$/, '') || lora;
                          return (
                            <SelectItem key={lora} value={lora} className="text-xs">
                              {displayName}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1 w-20">
                      <Slider
                        value={[ltxLoRAStrength]}
                        onValueChange={([v]) => setLtxLoRAStrength(v)}
                        min={0}
                        max={1}
                        step={0.05}
                      />
                      <span className="text-xs text-muted-foreground w-7 text-right">
                        {ltxLoRAStrength.toFixed(2)}
                      </span>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 px-2" onClick={addLtxLoRA} disabled={!ltxSelectedLoRA}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                {editForm.loraItems.length === 0 && unusedLoRAs.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">사용 가능한 LoRA가 없습니다</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <LoRAItemEditor
                  items={editForm.loraItems}
                  group="HIGH"
                  onRemove={removeLoRAItem}
                  onUpdateStrength={updateLoRAStrength}
                  isLoRAAvailable={isLoRAAvailable}
                />

                <LoRAItemEditor
                  items={editForm.loraItems}
                  group="LOW"
                  onRemove={removeLoRAItem}
                  onUpdateStrength={updateLoRAStrength}
                  isLoRAAvailable={isLoRAAvailable}
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={onSave}>
            {editingPreset ? '수정' : '생성'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}