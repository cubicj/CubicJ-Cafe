import { LoRAPreset } from './index';

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
  onDragEnd: (result: any) => void;
  isLoRAAvailable: (filename: string) => boolean;
}