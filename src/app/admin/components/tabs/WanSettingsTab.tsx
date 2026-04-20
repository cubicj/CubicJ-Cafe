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

type ModelCategory = 'diffusionModels' | 'textEncoders' | 'vaes';

const WAN_FIELDS: SettingsField[] = [
  { key: 'wan.wanvideo_model_high', label: 'WanVideo Model (High)', type: 'model', group: 'WAN — 모델', modelCategory: 'diffusionModels' as ModelCategory },
  { key: 'wan.wanvideo_model_low', label: 'WanVideo Model (Low)', type: 'model', group: 'WAN — 모델', modelCategory: 'diffusionModels' as ModelCategory },
  { key: 'wan.t5_encoder', label: 'T5 Encoder', type: 'model', group: 'WAN — 모델', modelCategory: 'textEncoders' as ModelCategory },
  { key: 'wan.wanvideo_vae', label: 'WanVideo VAE', type: 'model', group: 'WAN — 모델', modelCategory: 'vaes' as ModelCategory },
  { key: 'wan.base_precision', label: 'Base Precision', type: 'nodeOption', group: 'WAN — 모델', nodeQuery: 'base_precision:WanVideoModelLoader:base_precision' },
  { key: 'wan.quantization', label: 'Quantization', type: 'nodeOption', group: 'WAN — 모델', nodeQuery: 'quantization:WanVideoModelLoader:quantization' },
  { key: 'wan.attention_mode', label: 'Attention Mode', type: 'nodeOption', group: 'WAN — 모델', nodeQuery: 'attention_mode:WanVideoModelLoader:attention_mode' },

  { key: 'wan.blocks_to_swap', label: 'Blocks to Swap', type: 'number', step: 1, group: 'WAN — Block Swap' },
  { key: 'wan.offload_img_emb', label: 'Offload Img Embed', type: 'boolean', group: 'WAN — Block Swap' },
  { key: 'wan.offload_txt_emb', label: 'Offload Txt Embed', type: 'boolean', group: 'WAN — Block Swap' },
  { key: 'wan.vace_blocks_to_swap', label: 'VACE Blocks to Swap', type: 'number', step: 1, group: 'WAN — Block Swap' },
  { key: 'wan.prefetch_blocks', label: 'Prefetch Blocks', type: 'number', step: 1, group: 'WAN — Block Swap' },

  { key: 'wan.sampler_steps', label: 'Steps', type: 'number', step: 1, group: 'WAN — 샘플러' },
  { key: 'wan.shift', label: 'Shift', type: 'number', step: 0.1, group: 'WAN — 샘플러' },
  { key: 'wan.scheduler', label: 'Scheduler', type: 'nodeOption', group: 'WAN — 샘플러', nodeQuery: 'scheduler:WanVideoSampler:scheduler' },
  { key: 'wan.sigmas_high', label: 'Sigmas (High)', type: 'string', group: 'WAN — 샘플러', monoFont: true },
  { key: 'wan.sigmas_low', label: 'Sigmas (Low)', type: 'string', group: 'WAN — 샘플러', monoFont: true },

  { key: 'wan.disable_window_reinject_high', label: 'Disable Window Reinject (High)', type: 'boolean', group: 'WAN — Context Refine' },
  { key: 'wan.disable_window_reinject_low', label: 'Disable Window Reinject (Low)', type: 'boolean', group: 'WAN — Context Refine' },
  { key: 'wan.propagate_x0_high', label: 'Propagate x0 (High)', type: 'boolean', group: 'WAN — Context Refine' },
  { key: 'wan.propagate_x0_strength_high', label: 'Propagate x0 Strength (High)', type: 'number', step: 0.01, group: 'WAN — Context Refine' },
  { key: 'wan.propagate_x0_low', label: 'Propagate x0 (Low)', type: 'boolean', group: 'WAN — Context Refine' },
  { key: 'wan.propagate_x0_strength_low', label: 'Propagate x0 Strength (Low)', type: 'number', step: 0.01, group: 'WAN — Context Refine' },

  { key: 'wan.nag_scale', label: 'NAG Scale', type: 'number', step: 0.1, group: 'WAN — NAG' },
  { key: 'wan.nag_alpha', label: 'NAG Alpha', type: 'number', step: 0.01, group: 'WAN — NAG' },
  { key: 'wan.nag_tau', label: 'NAG Tau', type: 'number', step: 0.001, group: 'WAN — NAG' },

  { key: 'wan.megapixels', label: '해상도 (MP)', type: 'number', step: 0.01, group: 'WAN — 이미지' },
  { key: 'wan.resize_multiple_of', label: 'Resize Multiple Of', type: 'number', step: 1, group: 'WAN — 이미지' },
  { key: 'wan.resize_upscale_method', label: 'Resize 방식', type: 'nodeOption', group: 'WAN — 이미지', nodeQuery: 'resize_upscale_method:ResizeImageToMegapixels:upscale_method' },

  { key: 'wan.frame_rate', label: 'Frame Rate', type: 'number', step: 1, group: 'WAN — 생성' },
  { key: 'wan.negative_prompt', label: '네거티브 프롬프트', type: 'textarea', group: 'WAN — 생성', monoFont: true },
  { key: 'wan.duration_options', label: 'Duration Options (CSV)', type: 'string', group: 'WAN — 생성', monoFont: true },

  { key: 'wan.rtx_enabled', label: 'RTX Upscale', type: 'boolean', group: 'WAN — RTX 후처리' },
  { key: 'wan.rtx_resize_type', label: 'Resize Type', type: 'nodeOption', group: 'WAN — RTX 후처리', nodeQuery: 'rtx_resize_type:RTXVideoSuperResolution:resize_type' },
  { key: 'wan.rtx_scale', label: 'Scale', type: 'number', step: 0.1, group: 'WAN — RTX 후처리' },
  { key: 'wan.rtx_quality', label: 'Quality', type: 'nodeOption', group: 'WAN — RTX 후처리', nodeQuery: 'rtx_quality:RTXVideoSuperResolution:quality' },

  { key: 'wan.video_crf', label: 'CRF', type: 'number', step: 1, group: 'WAN — 영상 출력' },
  { key: 'wan.video_format', label: 'Format', type: 'nodeOption', group: 'WAN — 영상 출력', nodeQuery: 'video_format:VHS_VideoCombine:format' },
  { key: 'wan.video_pix_fmt', label: 'Pixel Format', type: 'nodeOption', group: 'WAN — 영상 출력', nodeQuery: 'video_pix_fmt:VHS_VideoCombine:pix_fmt' },
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
