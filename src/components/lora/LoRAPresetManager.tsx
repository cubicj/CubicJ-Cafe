"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLoRAPresets, useLoRABundles, useAvailableLoRAs, useDragAndDrop } from "@/hooks";
import { LoRAPresetManagerProps, LoRAPreset, EditForm, NewLoRAForm } from "@/types/lora";
import { LoRAPresetList } from "./LoRAPresetList";
import { LoRAPresetEditor } from "./LoRAPresetEditor";
import { LoRABundleSelector } from "./LoRABundleSelector";

export function LoRAPresetManager({
  selectedPresetIds,
  onPresetChange,
  onPresetApply,
  className,
}: LoRAPresetManagerProps) {
  const {
    presets,
    setPresets,
    isLoading,
    error,
    reorderPresets,
    savePreset: hookSavePreset,
    deletePreset: hookDeletePreset,
  } = useLoRAPresets();

  const {
    availableBundles,
    isLoadingBundles,
  } = useLoRABundles();

  const {
    isRefreshingLoRAs,
    fetchAvailableLoRAs,
    isLoRAAvailable,
  } = useAvailableLoRAs();

  const { handleDragEnd } = useDragAndDrop({
    presets,
    setPresets,
    reorderPresets,
  });

  const [expandedPresets, setExpandedPresets] = useState<Set<string>>(new Set());
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<LoRAPreset | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: '',
    isPublic: false,
    loraItems: [],
  });
  const [isAddLoRADialogOpen, setIsAddLoRADialogOpen] = useState(false);
  const [newLoRAForm, setNewLoRAForm] = useState<NewLoRAForm>({
    loraFilename: '',
    loraName: '',
    strength: 0.8,
    group: 'BOTH',
    useBundle: true,
    selectedBundleId: '',
  });
  const [copySuccess, setCopySuccess] = useState(false);

  const togglePresetSelection = (presetId: string) => {
    const newSelectedIds = selectedPresetIds.includes(presetId)
      ? selectedPresetIds.filter(id => id !== presetId)
      : [...selectedPresetIds, presetId];
    
    onPresetChange(newSelectedIds);
    
    const selectedPresets = presets.filter(p => newSelectedIds.includes(p.id));
    onPresetApply(selectedPresets);
  };

  const togglePresetExpansion = (presetId: string) => {
    setExpandedPresets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(presetId)) {
        newSet.delete(presetId);
      } else {
        newSet.add(presetId);
      }
      return newSet;
    });
  };

  const startEditPreset = (preset: LoRAPreset) => {
    setEditingPreset(preset);
    setEditForm({
      name: preset.name,
      isPublic: preset.isPublic,
      loraItems: [...preset.loraItems],
    });
    setIsEditDialogOpen(true);
  };

  const startNewPreset = () => {
    setEditingPreset(null);
    setEditForm({
      name: '',
      isPublic: false,
      loraItems: [],
    });
    setIsEditDialogOpen(true);
  };

  const savePreset = async () => {
    try {
      let presetName = editForm.name.trim();
      
      if (!presetName) {
        const existingNumbers = presets
          .map(p => p.name.match(/^프리셋 (\d+)$/))
          .filter(match => match)
          .map(match => parseInt(match![1], 10));
        
        const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
        presetName = `프리셋 ${nextNumber}`;
      }

      const presetData = {
        ...(editingPreset && { id: editingPreset.id }),
        name: presetName,
        loraItems: editForm.loraItems,
      };

      await hookSavePreset(presetData);
      setIsEditDialogOpen(false);
    } catch (err) {
      console.error('❌ 프리셋 저장 실패:', err);
      alert(err instanceof Error ? err.message : '프리셋 저장에 실패했습니다');
    }
  };

  const deletePreset = async (preset: LoRAPreset) => {
    await hookDeletePreset(preset);
  };

  const copyBundleNames = async () => {
    try {
      const bundleNames = availableBundles
        .map(bundle => bundle.displayName)
        .sort()
        .join(', ');

      await navigator.clipboard.writeText(bundleNames);
      setCopySuccess(true);
      console.log('✅ 번들명 목록이 클립보드에 복사되었습니다:', bundleNames);

      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (error) {
      console.error('❌ 번들명 복사 실패:', error);
      alert('번들명 복사에 실패했습니다.');
    }
  };

  const addLoRAItem = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!newLoRAForm.selectedBundleId) {
      alert('LoRA 번들을 선택해주세요.');
      return;
    }

    const newItems: any[] = [];
    const selectedBundle = availableBundles.find(bundle => bundle.id === newLoRAForm.selectedBundleId);
    
    if (selectedBundle) {
      let orderOffset = 0;
      
      if (selectedBundle.highLoRAFilename && selectedBundle.highLoRAFilename !== null) {
        newItems.push({
          loraFilename: selectedBundle.highLoRAFilename,
          loraName: `${selectedBundle.displayName} (High)`,
          strength: newLoRAForm.strength,
          group: 'HIGH',
          order: editForm.loraItems.length + orderOffset,
          bundleId: selectedBundle.id,
        });
        orderOffset++;
      }
      
      if (selectedBundle.lowLoRAFilename && selectedBundle.lowLoRAFilename !== null) {
        newItems.push({
          loraFilename: selectedBundle.lowLoRAFilename,
          loraName: `${selectedBundle.displayName} (Low)`,
          strength: newLoRAForm.strength,
          group: 'LOW',
          order: editForm.loraItems.length + orderOffset,
          bundleId: selectedBundle.id,
        });
      }
    }

    setEditForm(prev => ({
      ...prev,
      loraItems: [...prev.loraItems, ...newItems],
    }));

    setNewLoRAForm({
      loraFilename: '',
      loraName: '',
      strength: 0.8,
      group: 'BOTH',
      useBundle: true,
      selectedBundleId: '',
    });
    
    setTimeout(() => {
      setIsAddLoRADialogOpen(false);
    }, 50);
  };

  const getUsedBundleIds = () => {
    const usedBundleIds = new Set<string>();
    editForm.loraItems.forEach(item => {
      const matchingBundle = availableBundles.find(bundle => 
        (bundle.highLoRAFilename && bundle.highLoRAFilename === item.loraFilename) || 
        (bundle.lowLoRAFilename && bundle.lowLoRAFilename === item.loraFilename)
      );
      if (matchingBundle) {
        usedBundleIds.add(matchingBundle.id);
      }
    });
    return usedBundleIds;
  };

  return (
    <Card className={cn("p-3 sm:p-6", className)}>
      <div className="space-y-4 sm:space-y-6">
        <LoRAPresetList
          presets={presets}
          selectedPresetIds={selectedPresetIds}
          expandedPresets={expandedPresets}
          isLoading={isLoading}
          isRefreshingLoRAs={isRefreshingLoRAs}
          error={error}
          onPresetSelect={togglePresetSelection}
          onPresetExpand={togglePresetExpansion}
          onPresetEdit={startEditPreset}
          onPresetDelete={deletePreset}
          onNewPreset={startNewPreset}
          onRefresh={() => fetchAvailableLoRAs(true)}
          onCopyBundleNames={copyBundleNames}
          copySuccess={copySuccess}
          onDragEnd={handleDragEnd}
          isLoRAAvailable={isLoRAAvailable}
        />

        <LoRAPresetEditor
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          editingPreset={editingPreset}
          editForm={editForm}
          onEditFormChange={setEditForm}
          onSave={savePreset}
          onAddLoRA={() => setIsAddLoRADialogOpen(true)}
          isLoRAAvailable={isLoRAAvailable}
        />

        <LoRABundleSelector
          isOpen={isAddLoRADialogOpen}
          onOpenChange={setIsAddLoRADialogOpen}
          availableBundles={availableBundles}
          isLoadingBundles={isLoadingBundles}
          newLoRAForm={newLoRAForm}
          onFormChange={setNewLoRAForm}
          onAdd={addLoRAItem}
          getUsedBundleIds={getUsedBundleIds}
        />
      </div>
    </Card>
  );
}