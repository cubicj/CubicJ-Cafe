import { LoRAPreset } from './index';
import type { DropResult } from '@hello-pangea/dnd';

export interface LoRAPresetManagerProps {
  selectedPresetIds: string[];
  onPresetChange: (presetIds: string[]) => void;
  onPresetApply: (presets: LoRAPreset[]) => void;
  className?: string;
}

export interface LoRAPresetListProps {
  presets: LoRAPreset[];
  selectedPresetIds: string[];
  expandedPresets: Set<string>;
  isLoading: boolean;
  isRefreshingLoRAs: boolean;
  error: string | null;
  onPresetSelect: (presetId: string) => void;
  onPresetExpand: (presetId: string) => void;
  onPresetEdit: (preset: LoRAPreset) => void;
  onPresetDelete: (preset: LoRAPreset) => void;
  onNewPreset: () => void;
  onRefresh: () => void;
  onCopyBundleNames: () => void;
  copySuccess: boolean;
  onDragEnd: (result: DropResult) => void;
  isLoRAAvailable: (filename: string) => boolean;
}