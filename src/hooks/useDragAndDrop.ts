import { DropResult } from '@hello-pangea/dnd';
import { LoRAPresetItem } from '@/types';

interface LoRAPreset {
  id: string;
  name: string;
  isDefault: boolean;
  isPublic: boolean;
  order: number;
  loraItems: LoRAPresetItem[];
  createdAt: string;
  updatedAt: string;
}

interface UseDragAndDropProps {
  presets: LoRAPreset[];
  setPresets: (presets: LoRAPreset[]) => void;
  reorderPresets: (presetIds: string[]) => void;
}

export function useDragAndDrop({ presets, setPresets, reorderPresets }: UseDragAndDropProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(presets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    const userPresets = items.filter(preset => !preset.isDefault && !preset.isPublic);
    
    if (userPresets.length > 0) {
      setPresets(items);
      reorderPresets(userPresets.map(preset => preset.id));
    }
  };

  return {
    handleDragEnd,
  };
}