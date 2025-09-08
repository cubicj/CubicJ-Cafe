import { LoRABundle } from './index';
import { NewLoRAForm } from './editor.types';

export interface LoRABundleSelectorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  availableBundles: LoRABundle[];
  isLoadingBundles: boolean;
  newLoRAForm: NewLoRAForm;
  onFormChange: (form: NewLoRAForm) => void;
  onAdd: (e?: React.MouseEvent) => void;
  getUsedBundleIds: () => Set<string>;
}