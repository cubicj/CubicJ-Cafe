"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import ReactSelect from "react-select";
import { LoRABundleSelectorProps, SelectOption } from "@/types/lora";

export function LoRABundleSelector({
  isOpen,
  onOpenChange,
  availableBundles,
  isLoadingBundles,
  newLoRAForm,
  onFormChange,
  onAdd,
  getUsedBundleIds,
}: LoRABundleSelectorProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DialogContent 
        className="max-w-[95vw] sm:max-w-lg max-h-[90vh] mx-auto w-full"
        onPointerDownOutside={(e) => {
          const target = e.target as Element;
          if (target.closest('[class*="react-select"]') || target.closest('.react-select__menu')) {
            return;
          }
          e.preventDefault();
        }}
        onInteractOutside={(e) => {
          const target = e.target as Element;
          if (target.closest('[class*="react-select"]') || target.closest('.react-select__menu')) {
            return;
          }
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-lg">LoRA 추가</DialogTitle>
          <DialogDescription className="text-sm">
            프리셋에 추가할 LoRA를 선택하고 설정하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[50vh] overflow-y-visible pr-1 mb-4">
          <div className="space-y-2">
            <Label className="text-sm">LoRA 번들</Label>
            <ReactSelect
              value={availableBundles.find(bundle => bundle.id === newLoRAForm.selectedBundleId) ? {
                value: newLoRAForm.selectedBundleId,
                label: availableBundles.find(bundle => bundle.id === newLoRAForm.selectedBundleId)?.displayName || ''
              } : null}
              onChange={(selectedOption: SelectOption | null) => {
                const bundleId = selectedOption?.value || '';
                const bundle = availableBundles.find(b => b.id === bundleId);
                onFormChange({
                  ...newLoRAForm,
                  selectedBundleId: bundleId,
                  loraName: bundle?.displayName || '',
                });
              }}
              options={availableBundles.map(bundle => ({
                value: bundle.id,
                label: bundle.displayName
              }))}
              placeholder="번들을 검색하거나 선택하세요..."
              isSearchable={!newLoRAForm.selectedBundleId}
              isClearable
              isLoading={isLoadingBundles}
              noOptionsMessage={() => "검색 결과가 없습니다"}
              loadingMessage={() => "번들 목록 로딩 중..."}
              className="w-full"
              classNamePrefix="react-select"
              maxMenuHeight={300}
              menuPlacement="auto"
              styles={{
                control: (provided, state) => ({
                  ...provided,
                  borderColor: state.isFocused ? 'hsl(var(--ring))' : 'hsl(var(--border))',
                  borderWidth: '1px',
                  boxShadow: state.isFocused ? '0 0 0 2px hsl(var(--ring) / 0.2)' : 'none',
                  backgroundColor: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  minHeight: '36px',
                  fontSize: '14px',
                  borderRadius: '6px',
                  '&:hover': {
                    borderColor: 'hsl(var(--border))'
                  }
                }),
                menu: (provided) => ({
                  ...provided,
                  backgroundColor: '#ffffff',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                  zIndex: 50,
                  opacity: 1
                }),
                menuList: (provided) => ({
                  ...provided,
                  backgroundColor: '#ffffff',
                  opacity: 1
                }),
                option: (provided, state) => ({
                  ...provided,
                  backgroundColor: state.isFocused ? '#e2e8f0' : '#ffffff',
                  color: state.isFocused ? '#1e293b' : '#374151',
                  fontSize: '14px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  opacity: 1,
                  '&:active': {
                    backgroundColor: '#cbd5e1'
                  }
                }),
                placeholder: (provided) => ({
                  ...provided,
                  color: 'hsl(var(--muted-foreground))',
                  fontSize: '14px'
                }),
                singleValue: (provided) => ({
                  ...provided,
                  color: 'hsl(var(--foreground))',
                  fontSize: '14px'
                }),
                input: (provided) => ({
                  ...provided,
                  color: 'hsl(var(--foreground))'
                }),
                noOptionsMessage: (provided) => ({
                  ...provided,
                  color: 'hsl(var(--muted-foreground))',
                  fontSize: '14px'
                }),
                loadingMessage: (provided) => ({
                  ...provided,
                  color: 'hsl(var(--muted-foreground))',
                  fontSize: '14px'
                })
              }}
              formatOptionLabel={(option: SelectOption) => {
                const usedBundleIds = getUsedBundleIds();
                const isUsed = usedBundleIds.has(option.value);
                
                return (
                  <div className="flex items-center justify-between w-full">
                    <span className={isUsed ? "text-muted-foreground line-through" : ""}>
                      {option.label}
                    </span>
                    {isUsed && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-2">
                        이미 사용됨
                      </span>
                    )}
                  </div>
                );
              }}
            />
          </div>
        </div>

        <div className="space-y-2 py-3">
          <Label className="text-sm">강도: {newLoRAForm.strength.toFixed(1)}</Label>
          <div className="px-2">
            <Slider
              value={[newLoRAForm.strength]}
              onValueChange={(value) => onFormChange({
                ...newLoRAForm,
                strength: value[0]
              })}
              min={0.1}
              max={1.5}
              step={0.1}
              className="w-full"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2">
          <Button 
            variant="outline" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenChange(false);
            }}
            className="w-full sm:w-auto"
          >
            취소
          </Button>
          <Button 
            onClick={(e) => onAdd(e)}
            className="w-full sm:w-auto"
          >
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}