import { LoRAPreset, LoRAPresetItem } from './index';

export interface LoRAPresetEditorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingPreset: LoRAPreset | null;
  editForm: EditForm;
  onEditFormChange: (form: EditForm) => void;
  onSave: () => Promise<void>;
  onAddLoRA: () => void;
  isLoRAAvailable: (filename: string) => boolean;
}

export interface EditForm {
  name: string;
  isPublic: boolean;
  loraItems: LoRAPresetItem[];
}

export interface LoRAItemEditorProps {
  items: LoRAPresetItem[];
  group: 'HIGH' | 'LOW';
  onRemove: (index: number) => void;
  onUpdateStrength: (index: number, strength: number) => void;
  isLoRAAvailable: (filename: string) => boolean;
}

export interface NewLoRAForm {
  loraFilename: string;
  loraName: string;
  strength: number;
  group: 'HIGH' | 'LOW' | 'BOTH';
  useBundle: boolean;
  selectedBundleId: string;
}