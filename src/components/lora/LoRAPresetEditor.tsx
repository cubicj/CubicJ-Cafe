"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
}: LoRAPresetEditorProps) {
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
              <Button
                variant="outline"
                size="sm"
                onClick={onAddLoRA}
                className="h-7 px-2"
              >
                <Plus className="h-3 w-3 mr-1" />
                LoRA 추가
              </Button>
            </div>

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