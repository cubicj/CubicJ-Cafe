'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Layers } from 'lucide-react';
import { LoRABundleManager } from '@/components/ui/lora-bundle-manager';
import ModelSettingsTab, { type SettingsField } from './ModelSettingsTab';

type ModelCategory = 'diffusionModels' | 'textEncoders' | 'vaes' | 'rifeModels';

const WAN_FIELDS: SettingsField[] = [
  { key: 'wan.unet_high', label: 'UNet HIGH 모델', type: 'model', group: '모델', modelCategory: 'diffusionModels' as ModelCategory },
  { key: 'wan.unet_low', label: 'UNet LOW 모델', type: 'model', group: '모델', modelCategory: 'diffusionModels' as ModelCategory },
  { key: 'wan.clip', label: 'CLIP 모델', type: 'model', group: '모델', modelCategory: 'textEncoders' as ModelCategory },
  { key: 'wan.vae', label: 'VAE 모델', type: 'model', group: '모델', modelCategory: 'vaes' as ModelCategory },
  { key: 'wan.lora_enabled', label: 'LoRA 프리셋 활성화', type: 'boolean', group: '생성' },
  { key: 'wan.sampler', label: '샘플러', type: 'sampler', group: '생성' },
  { key: 'wan.megapixels', label: '이미지 해상도 (MP)', type: 'number', step: 0.01, group: '생성' },
  { key: 'wan.resize_multiple_of', label: 'Resize Multiple Of', type: 'number', step: 1, group: '생성' },
  { key: 'wan.resize_upscale_method', label: 'Resize 방식', type: 'nodeOption', group: '생성', nodeQuery: 'resize_upscale_method:ResizeImageToMegapixels:upscale_method' },
  { key: 'wan.shift', label: 'Sampling Shift', type: 'number', step: 0.1, group: '생성' },
  { key: 'wan.length', label: '프레임 수', type: 'number', step: 1, group: '생성' },
  { key: 'wan.nag_scale', label: 'NAG Scale', type: 'number', step: 0.1, group: 'NAG' },
  { key: 'wan.nag_alpha', label: 'NAG Alpha', type: 'number', step: 0.01, group: 'NAG' },
  { key: 'wan.nag_tau', label: 'NAG Tau', type: 'number', step: 0.001, group: 'NAG' },
  { key: 'wan.moe_scheduler', label: 'Scheduler', type: 'nodeOption', group: 'MoE Scheduler', nodeQuery: 'moe_scheduler:WanMoEScheduler:scheduler' },
  { key: 'wan.steps_high', label: 'Steps HIGH', type: 'number', step: 1, group: 'MoE Scheduler' },
  { key: 'wan.steps_low', label: 'Steps LOW', type: 'number', step: 1, group: 'MoE Scheduler' },
  { key: 'wan.moe_boundary', label: 'Boundary', type: 'number', step: 0.01, group: 'MoE Scheduler' },
  { key: 'wan.moe_interval', label: 'Interval', type: 'number', step: 0.001, group: 'MoE Scheduler' },
  { key: 'wan.moe_denoise', label: 'Denoise', type: 'number', step: 0.01, group: 'MoE Scheduler' },
  { key: 'wan.vfi_enabled', label: 'VFI 활성화', type: 'boolean', group: 'VFI' },
  { key: 'wan.rife_model', label: 'RIFE Model', type: 'model', group: 'VFI', modelCategory: 'rifeModels' as ModelCategory },
  { key: 'wan.rife_precision', label: 'RIFE Precision', type: 'nodeOption', group: 'VFI', nodeQuery: 'rife_precision:AutoLoadRifeTensorrtModel:precision' },
  { key: 'wan.rife_resolution_profile', label: 'RIFE Resolution Profile', type: 'nodeOption', group: 'VFI', nodeQuery: 'rife_resolution_profile:AutoLoadRifeTensorrtModel:resolution_profile' },
  { key: 'wan.vfi_clear_cache', label: 'VFI Clear Cache (frames)', type: 'number', step: 1, group: 'VFI' },
  { key: 'wan.vfi_multiplier', label: 'VFI Multiplier', type: 'number', step: 1, group: 'VFI' },
  { key: 'wan.rtx_resize_type', label: 'RTX Resize Type', type: 'nodeOption', group: 'RTX', nodeQuery: 'rtx_resize_type:RTXVideoSuperResolution:resize_type' },
  { key: 'wan.rtx_scale', label: 'RTX Scale', type: 'number', step: 0.1, group: 'RTX' },
  { key: 'wan.rtx_quality', label: 'RTX Quality', type: 'nodeOption', group: 'RTX', nodeQuery: 'rtx_quality:RTXVideoSuperResolution:quality' },
  { key: 'wan.frame_rate', label: 'Frame Rate', type: 'number', step: 1, group: '비디오' },
  { key: 'wan.video_crf', label: 'CRF', type: 'number', step: 1, group: '비디오' },
  { key: 'wan.video_format', label: 'Format', type: 'nodeOption', group: '비디오', nodeQuery: 'video_format:VHS_VideoCombine:format' },
  { key: 'wan.video_pix_fmt', label: 'Pixel Format', type: 'nodeOption', group: '비디오', nodeQuery: 'video_pix_fmt:VHS_VideoCombine:pix_fmt' },
  { key: 'wan.negative_prompt', label: '네거티브 프롬프트', type: 'textarea', group: '프롬프트' },
];

const loraBundleButton = (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="outline" size="sm" className="ml-auto">
        <Layers className="h-4 w-4 mr-1" />
        LoRA 번들
      </Button>
    </DialogTrigger>
    <DialogContent className="w-[80vw] h-[90vh] max-w-[80vw] sm:max-w-[80vw] overflow-y-auto flex flex-col items-stretch justify-start">
      <DialogHeader>
        <DialogTitle>LoRA 번들 관리</DialogTitle>
      </DialogHeader>
      <LoRABundleManager />
    </DialogContent>
  </Dialog>
);

export default function WanSettingsTab() {
  return (
    <ModelSettingsTab
      title="WAN 2.2 설정"
      category="wan"
      fields={WAN_FIELDS}
      headerExtra={loraBundleButton}
    />
  );
}
