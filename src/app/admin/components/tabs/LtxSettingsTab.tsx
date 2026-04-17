'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, Music } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import ModelSettingsTab, { type SettingsField } from './ModelSettingsTab';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import AudioPresetAdminManager from '@/components/audio/AudioPresetAdminManager';

type ModelCategory = 'diffusionModels' | 'textEncoders' | 'vaes';

const LTX_FIELDS: SettingsField[] = [
  { key: 'ltx.unet', label: 'UNet', type: 'model', group: 'LTX — 모델', modelCategory: 'diffusionModels' as ModelCategory },
  { key: 'ltx.weight_dtype', label: 'Weight DType', type: 'nodeOption', group: 'LTX — 모델', nodeQuery: 'weight_dtype:UNETLoader:weight_dtype' },
  { key: 'ltx.audio_vae', label: 'Audio VAE', type: 'model', group: 'LTX — 모델', modelCategory: 'vaes' as ModelCategory },
  { key: 'ltx.video_vae', label: 'Video VAE', type: 'model', group: 'LTX — 모델', modelCategory: 'vaes' as ModelCategory },
  { key: 'ltx.clip_gguf', label: 'CLIP GGUF', type: 'model', group: 'LTX — 모델', modelCategory: 'textEncoders' as ModelCategory },
  { key: 'ltx.clip_embeddings', label: 'CLIP Embeddings', type: 'model', group: 'LTX — 모델', modelCategory: 'textEncoders' as ModelCategory },

  { key: 'ltx.sampler', label: '샘플러', type: 'nodeOption', group: 'LTX — 샘플러', nodeQuery: 'sampler:ClownSampler_Beta:sampler_name' },
  { key: 'ltx.clown_eta', label: 'Eta', type: 'number', step: 0.01, group: 'LTX — 샘플러' },
  { key: 'ltx.clown_bongmath', label: 'Bongmath', type: 'boolean', group: 'LTX — 샘플러' },
  { key: 'ltx.scheduler_steps', label: 'Steps', type: 'number', step: 1, group: 'LTX — 샘플러' },
  { key: 'ltx.scheduler_max_shift', label: 'Max Shift', type: 'number', step: 0.01, group: 'LTX — 샘플러' },
  { key: 'ltx.scheduler_base_shift', label: 'Base Shift', type: 'number', step: 0.01, group: 'LTX — 샘플러' },
  { key: 'ltx.scheduler_stretch', label: 'Stretch', type: 'boolean', group: 'LTX — 샘플러' },
  { key: 'ltx.scheduler_terminal', label: 'Terminal', type: 'number', step: 0.01, group: 'LTX — 샘플러' },

  { key: 'ltx.nag_scale', label: 'NAG Scale', type: 'number', step: 0.1, group: 'LTX — NAG' },
  { key: 'ltx.nag_alpha', label: 'NAG Alpha', type: 'number', step: 0.01, group: 'LTX — NAG' },
  { key: 'ltx.nag_tau', label: 'NAG Tau', type: 'number', step: 0.001, group: 'LTX — NAG' },

  { key: 'ltx.audio_norm_enabled', label: 'Audio Norm', type: 'boolean', group: 'LTX — 오디오' },
  { key: 'ltx.audio_norm', label: 'Audio Norm Factors', type: 'string', group: 'LTX — 오디오', monoFont: true },
  { key: 'ltx.identity_guidance_scale', label: 'ID Guidance Scale', type: 'number', step: 0.1, group: 'LTX — 오디오' },
  { key: 'ltx.identity_start_percent', label: 'ID Start %', type: 'number', step: 0.01, group: 'LTX — 오디오' },
  { key: 'ltx.identity_end_percent', label: 'ID End %', type: 'number', step: 0.01, group: 'LTX — 오디오' },
  { key: 'ltx.id_lora_name', label: 'ID LoRA', type: 'nodeOption', group: 'LTX — 오디오', nodeQuery: 'id_lora_name:LoraLoaderModelOnly:lora_name:LTX/:excludeSubdirs' },
  { key: 'ltx.id_lora_strength', label: 'ID LoRA Strength', type: 'number', step: 0.01, group: 'LTX — 오디오' },

  { key: 'ltx.distilled_lora_enabled', label: 'Enabled', type: 'boolean', group: 'LTX — LoRA' },
  { key: 'ltx.distilled_lora_name', label: 'Distilled LoRA', type: 'nodeOption', group: 'LTX — LoRA', nodeQuery: 'distilled_lora_name:LoraLoaderModelOnly:lora_name:LTX/:excludeSubdirs' },
  { key: 'ltx.distilled_lora_strength', label: 'Strength', type: 'number', step: 0.01, group: 'LTX — LoRA' },

  { key: 'ltx.img_compression', label: 'Image Compression', type: 'number', step: 1, group: 'LTX — 이미지' },
  { key: 'ltx.megapixels', label: '해상도 (MP)', type: 'number', step: 0.01, group: 'LTX — 이미지' },
  { key: 'ltx.resize_multiple_of', label: 'Resize Multiple Of', type: 'number', step: 1, group: 'LTX — 이미지' },
  { key: 'ltx.resize_upscale_method', label: 'Resize 방식', type: 'nodeOption', group: 'LTX — 이미지', nodeQuery: 'resize_upscale_method:ResizeImageToMegapixels:upscale_method' },

  { key: 'ltx.frame_rate', label: 'Frame Rate', type: 'number', step: 1, group: 'LTX — 생성' },
  { key: 'ltx.negative_prompt', label: '네거티브 프롬프트', type: 'textarea', group: 'LTX — 생성', monoFont: true },
  { key: 'ltx.duration_options', label: 'Duration Options (CSV)', type: 'string', group: 'LTX — 생성', monoFont: true },

  { key: 'ltx.rtx_enabled', label: 'RTX Upscale', type: 'boolean', group: 'LTX — RTX 후처리' },
  { key: 'ltx.rtx_resize_type', label: 'Resize Type', type: 'nodeOption', group: 'LTX — RTX 후처리', nodeQuery: 'rtx_resize_type:RTXVideoSuperResolution:resize_type' },
  { key: 'ltx.rtx_scale', label: 'Scale', type: 'number', step: 0.1, group: 'LTX — RTX 후처리' },
  { key: 'ltx.rtx_quality', label: 'Quality', type: 'nodeOption', group: 'LTX — RTX 후처리', nodeQuery: 'rtx_quality:RTXVideoSuperResolution:quality' },

  { key: 'ltx.video_crf', label: 'CRF', type: 'number', step: 1, group: 'LTX — 영상 출력' },
  { key: 'ltx.video_format', label: 'Format', type: 'nodeOption', group: 'LTX — 영상 출력', nodeQuery: 'video_format:VHS_VideoCombine:format' },
  { key: 'ltx.video_pix_fmt', label: 'Pixel Format', type: 'nodeOption', group: 'LTX — 영상 출력', nodeQuery: 'video_pix_fmt:VHS_VideoCombine:pix_fmt' },
];

function LtxLoRACopyButton() {
  const [loras, setLoras] = useState<string[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    apiClient.get<{ loras: string[] }>('/api/comfyui/loras?model=ltx')
      .then(data => setLoras(data.loras || []))
      .catch(() => {});
  }, []);

  const handleCopy = async () => {
    const text = loras
      .map(path => path.split(/[/\\]/).pop()?.replace(/\.\w+$/, '') || path)
      .sort()
      .join(', ');
    await navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleCopy} disabled={loras.length === 0}>
      {copySuccess ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
      {copySuccess ? '복사 완료' : `LoRA 이름 복사 (${loras.length})`}
    </Button>
  );
}

function LtxHeaderExtra() {
  return (
    <div className="flex items-center gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Music className="h-4 w-4 mr-1" />
            오디오 프리셋
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[80vw] h-[90vh] max-w-[80vw] sm:max-w-[80vw] overflow-y-auto flex flex-col items-stretch justify-start">
          <DialogHeader>
            <DialogTitle>오디오 프리셋 관리</DialogTitle>
          </DialogHeader>
          <AudioPresetAdminManager />
        </DialogContent>
      </Dialog>
      <LtxLoRACopyButton />
    </div>
  );
}

export default function LtxSettingsTab() {
  return (
    <ModelSettingsTab
      title="LTX 2.3 설정"
      category="ltx"
      fields={LTX_FIELDS}
      headerExtra={<LtxHeaderExtra />}
    />
  );
}
