// 메인 인터페이스들
export interface LoRAPreset {
  id: string;
  name: string;
  isDefault: boolean;
  isPublic: boolean;
  order: number;
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
  bundleId?: string;
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

// 컴포넌트 Props 타입들
export * from './preset.types';
export * from './editor.types';
export * from './bundle.types';