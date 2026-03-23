export interface LoRAPreset {
  id: string;
  name: string;
  isDefault: boolean;
  isPublic: boolean;
  order: number;
  model: string;
  loraItems: LoRAPresetItem[];
  createdAt: string;
  updatedAt: string;
}

export interface LoRAPresetItem {
  id?: string;
  loraFilename: string;
  loraName: string;
  strength: number;
  group: 'HIGH' | 'LOW';
  order: number;
  bundleId?: string | null;
}

export interface LoRAPresetData {
  presetId: string;
  presetName: string;
  loraItems: LoRAPresetItem[];
}

export interface LoraConfig {
  name: string;
  strength: number;
  enabled: boolean;
}

export interface LoRABundle {
  id: string;
  displayName: string;
  highLoRAFilename: string | null;
  lowLoRAFilename: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export * from './preset.types';
export * from './editor.types';
export * from './bundle.types';