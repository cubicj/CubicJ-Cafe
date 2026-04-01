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
} from '@/components/ui/dialog'
import AudioPresetAdminManager from '@/components/audio/AudioPresetAdminManager'

type ModelCategory = 'diffusionModels' | 'ggufClips' | 'clipEmbeddings' | 'kjVaes' | 'rifeModels';

const LTX_FIELDS: SettingsField[] = [
  { key: 'ltx.unet', label: 'UNet 모델', type: 'model', group: '모델', modelCategory: 'diffusionModels' as ModelCategory },
  { key: 'ltx.weight_dtype', label: 'Weight Dtype', type: 'string', group: '모델' },
  { key: 'ltx.clip_gguf', label: 'CLIP GGUF 모델', type: 'model', group: '모델', modelCategory: 'ggufClips' as ModelCategory },
  { key: 'ltx.clip_embeddings', label: 'CLIP Embeddings 모델', type: 'model', group: '모델', modelCategory: 'clipEmbeddings' as ModelCategory },
  { key: 'ltx.audio_vae', label: 'Audio VAE 모델', type: 'model', group: '모델', modelCategory: 'kjVaes' as ModelCategory },
  { key: 'ltx.video_vae', label: 'Video VAE 모델', type: 'model', group: '모델', modelCategory: 'kjVaes' as ModelCategory },
  { key: 'ltx.lora_enabled', label: 'LoRA 프리셋 활성화', type: 'boolean', group: '생성' },
  { key: 'ltx.sampler', label: '샘플러', type: 'sampler', group: '생성' },
  { key: 'ltx.nag_scale', label: 'NAG Scale', type: 'number', step: 0.1, group: '생성' },
  { key: 'ltx.nag_alpha', label: 'NAG Alpha', type: 'number', step: 0.01, group: '생성' },
  { key: 'ltx.nag_tau', label: 'NAG Tau', type: 'number', step: 0.1, group: '생성' },
  { key: 'ltx.duration', label: '비디오 길이 (초)', type: 'number', step: 1, group: '생성' },
  { key: 'ltx.frame_rate', label: 'Frame Rate', type: 'number', step: 1, group: '생성' },
  { key: 'ltx.megapixels', label: '이미지 해상도 (MP)', type: 'number', step: 0.01, group: '생성' },
  { key: 'ltx.resize_multiple_of', label: 'Resize Multiple Of', type: 'number', step: 1, group: '생성' },
  { key: 'ltx.resize_upscale_method', label: 'Resize 방식', type: 'nodeOption', group: '생성', nodeQuery: 'resize_upscale_method:ResizeImageToMegapixels:upscale_method' },
  { key: 'ltx.scheduler_steps', label: 'Steps', type: 'number', step: 1, group: '1st Pass' },
  { key: 'ltx.scheduler_max_shift', label: 'Max Shift', type: 'number', step: 0.01, group: '1st Pass' },
  { key: 'ltx.scheduler_base_shift', label: 'Base Shift', type: 'number', step: 0.01, group: '1st Pass' },
  { key: 'ltx.scheduler_stretch', label: 'Stretch', type: 'boolean', group: '1st Pass' },
  { key: 'ltx.scheduler_terminal', label: 'Terminal', type: 'number', step: 0.01, group: '1st Pass' },
  { key: 'ltx.sigmas_2nd', label: 'Sigmas', type: 'string', group: '2nd Pass' },
  { key: 'ltx.distilled_lora_name', label: 'Distilled LoRA', type: 'nodeOption', group: 'Distilled LoRA', nodeQuery: 'distilled_lora_name:LoraLoaderModelOnly:lora_name:LTX/:excludeSubdirs' },
  { key: 'ltx.distilled_lora_strength', label: 'Strength', type: 'number', step: 0.1, group: 'Distilled LoRA' },
  { key: 'ltx.upscale_model', label: 'Upscale Model', type: 'string', group: 'Upscale' },
  { key: 'ltx.color_match_method', label: 'Method', type: 'string', group: 'Color Match' },
  { key: 'ltx.color_match_strength', label: 'Strength', type: 'number', step: 0.01, group: 'Color Match' },
  { key: 'ltx.audio_norm_1st', label: '1st Pass Factors', type: 'string', group: 'Audio Norm' },
  { key: 'ltx.audio_norm_2nd', label: '2nd Pass Factors', type: 'string', group: 'Audio Norm' },
  { key: 'ltx.vfi_enabled', label: 'VFI 활성화', type: 'boolean', group: 'VFI' },
  { key: 'ltx.rife_model', label: 'RIFE Model', type: 'model', group: 'VFI', modelCategory: 'rifeModels' as ModelCategory },
  { key: 'ltx.rife_precision', label: 'RIFE Precision', type: 'nodeOption', group: 'VFI', nodeQuery: 'rife_precision:AutoLoadRifeTensorrtModel:precision' },
  { key: 'ltx.rife_resolution_profile', label: 'RIFE Resolution Profile', type: 'nodeOption', group: 'VFI', nodeQuery: 'rife_resolution_profile:AutoLoadRifeTensorrtModel:resolution_profile' },
  { key: 'ltx.vfi_clear_cache', label: 'VFI Clear Cache (frames)', type: 'number', step: 1, group: 'VFI' },
  { key: 'ltx.vfi_multiplier', label: 'VFI Multiplier', type: 'number', step: 1, group: 'VFI' },
  { key: 'ltx.rtx_resize_type', label: 'RTX Resize Type', type: 'nodeOption', group: 'RTX', nodeQuery: 'rtx_resize_type:RTXVideoSuperResolution:resize_type' },
  { key: 'ltx.rtx_scale', label: 'RTX Scale', type: 'number', step: 0.1, group: 'RTX' },
  { key: 'ltx.rtx_quality', label: 'RTX Quality', type: 'nodeOption', group: 'RTX', nodeQuery: 'rtx_quality:RTXVideoSuperResolution:quality' },
  { key: 'ltx.video_crf', label: 'CRF', type: 'number', step: 1, group: '비디오' },
  { key: 'ltx.video_format', label: 'Format', type: 'nodeOption', group: '비디오', nodeQuery: 'video_format:VHS_VideoCombine:format' },
  { key: 'ltx.video_pix_fmt', label: 'Pixel Format', type: 'nodeOption', group: '비디오', nodeQuery: 'video_pix_fmt:VHS_VideoCombine:pix_fmt' },
  { key: 'ltx.negative_prompt', label: '네거티브 프롬프트', type: 'textarea', group: '프롬프트' },
  { key: 'ltx.id_lora_name', label: 'ID LoRA', type: 'nodeOption', group: 'ID LoRA', nodeQuery: 'id_lora_name:LoraLoaderModelOnly:lora_name:LTX/:excludeSubdirs' },
  { key: 'ltx.id_lora_strength', label: 'ID LoRA Strength', type: 'number', step: 0.1, group: 'ID LoRA' },
  { key: 'ltx.identity_guidance_scale', label: '1st Guidance Scale', type: 'number', step: 0.1, group: 'ID LoRA' },
  { key: 'ltx.identity_start_percent', label: '1st Start %', type: 'number', step: 0.01, group: 'ID LoRA' },
  { key: 'ltx.identity_end_percent', label: '1st End %', type: 'number', step: 0.01, group: 'ID LoRA' },
  { key: 'ltx.identity_guidance_scale_2nd', label: '2nd Guidance Scale', type: 'number', step: 0.1, group: 'ID LoRA' },
  { key: 'ltx.identity_start_percent_2nd', label: '2nd Start %', type: 'number', step: 0.01, group: 'ID LoRA' },
  { key: 'ltx.identity_end_percent_2nd', label: '2nd End %', type: 'number', step: 0.01, group: 'ID LoRA' },
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
  )
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
