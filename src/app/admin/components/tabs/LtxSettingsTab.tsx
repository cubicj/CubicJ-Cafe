'use client';

import { useState, useEffect, useMemo } from 'react';
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

const LTX_SHARED_TOP: SettingsField[] = [
  { key: 'ltx.pass_mode', label: 'Pass Mode', type: 'select', group: '모드', options: [{ label: '1 Pass', value: '1pass' }, { label: '2 Pass', value: '2pass' }] },

  { key: 'ltx.lora_enabled', label: 'LoRA 프리셋', type: 'boolean', group: '활성화' },
  { key: 'ltx.color_match_enabled', label: 'Color Match', type: 'boolean', group: '활성화' },
  { key: 'ltx.vfi_enabled', label: 'VFI', type: 'boolean', group: '활성화' },
  { key: 'ltx.rtx_enabled', label: 'RTX Upscale', type: 'boolean', group: '활성화' },

  { key: 'ltx.megapixels', label: '이미지 해상도 (MP)', type: 'number', step: 0.01, group: '입력' },
  { key: 'ltx.resize_multiple_of', label: 'Resize Multiple Of', type: 'number', step: 1, group: '입력' },
  { key: 'ltx.resize_upscale_method', label: 'Resize 방식', type: 'nodeOption', group: '입력', nodeQuery: 'resize_upscale_method:ResizeImageToMegapixels:upscale_method' },
  { key: 'ltx.img_compression', label: 'Image Compression', type: 'number', step: 1, group: '입력' },

  { key: 'ltx.clip_gguf', label: 'CLIP GGUF 모델', type: 'model', group: '모델 & 인코딩', modelCategory: 'ggufClips' as ModelCategory },
  { key: 'ltx.clip_embeddings', label: 'CLIP Embeddings 모델', type: 'model', group: '모델 & 인코딩', modelCategory: 'clipEmbeddings' as ModelCategory },
  { key: 'ltx.audio_vae', label: 'Audio VAE', type: 'model', group: '모델 & 인코딩', modelCategory: 'kjVaes' as ModelCategory },
  { key: 'ltx.video_vae', label: 'Video VAE', type: 'model', group: '모델 & 인코딩', modelCategory: 'kjVaes' as ModelCategory },
  { key: 'ltx.frame_rate', label: 'FPS', type: 'number', step: 1, group: '모델 & 인코딩' },
];

const LTX_SHARED_BOTTOM: SettingsField[] = [
  { key: 'ltx.color_match_method', label: 'Method', type: 'string', group: '후처리 — Color Match' },
  { key: 'ltx.color_match_strength', label: 'Strength', type: 'number', step: 0.01, group: '후처리 — Color Match' },

  { key: 'ltx.vfi_method', label: 'VFI 방식', type: 'select', group: '후처리 — VFI', options: [{ label: 'RIFE (TensorRT)', value: 'rife' }, { label: 'GMFSS Fortuna', value: 'gmfss' }] },
  { key: 'ltx.vfi_multiplier', label: 'Multiplier', type: 'number', step: 1, group: '후처리 — VFI' },
  { key: 'ltx.vfi_clear_cache', label: 'Clear Cache (frames)', type: 'number', step: 1, group: '후처리 — VFI' },
  { key: 'ltx.rife_model', label: 'RIFE Model', type: 'model', group: '후처리 — VFI', modelCategory: 'rifeModels' as ModelCategory },
  { key: 'ltx.rife_precision', label: 'RIFE Precision', type: 'nodeOption', group: '후처리 — VFI', nodeQuery: 'rife_precision:AutoLoadRifeTensorrtModel:precision' },
  { key: 'ltx.rife_resolution_profile', label: 'RIFE Resolution Profile', type: 'nodeOption', group: '후처리 — VFI', nodeQuery: 'rife_resolution_profile:AutoLoadRifeTensorrtModel:resolution_profile' },
  { key: 'ltx.rife_custom_min_dim', label: 'RIFE Custom Min Dim', type: 'number', step: 1, group: '후처리 — VFI' },
  { key: 'ltx.rife_custom_opt_dim', label: 'RIFE Custom Opt Dim', type: 'number', step: 1, group: '후처리 — VFI' },
  { key: 'ltx.rife_custom_max_dim', label: 'RIFE Custom Max Dim', type: 'number', step: 1, group: '후처리 — VFI' },
  { key: 'ltx.gmfss_model', label: 'GMFSS Model', type: 'string', group: '후처리 — VFI' },

  { key: 'ltx.rtx_resize_type', label: 'Resize Type', type: 'nodeOption', group: '후처리 — Upscale', nodeQuery: 'rtx_resize_type:RTXVideoSuperResolution:resize_type' },
  { key: 'ltx.rtx_scale', label: 'Scale', type: 'number', step: 0.1, group: '후처리 — Upscale' },
  { key: 'ltx.rtx_quality', label: 'Quality', type: 'nodeOption', group: '후처리 — Upscale', nodeQuery: 'rtx_quality:RTXVideoSuperResolution:quality' },
  { key: 'ltx.upscale_model', label: 'Latent Upscale Model', type: 'string', group: '후처리 — Upscale' },

  { key: 'ltx.video_crf', label: 'CRF', type: 'number', step: 1, group: '출력' },
  { key: 'ltx.video_format', label: 'Format', type: 'nodeOption', group: '출력', nodeQuery: 'video_format:VHS_VideoCombine:format' },
  { key: 'ltx.video_pix_fmt', label: 'Pixel Format', type: 'nodeOption', group: '출력', nodeQuery: 'video_pix_fmt:VHS_VideoCombine:pix_fmt' },
  { key: 'ltx.negative_prompt', label: '네거티브 프롬프트', type: 'textarea', group: '출력' },
];

const LTX_1PASS_FIELDS: SettingsField[] = [
  { key: 'ltx.1pass.audio_norm_enabled', label: 'Audio Norm', type: 'boolean', group: '활성화' },
  { key: 'ltx.1pass.distilled_lora_enabled', label: 'Distilled LoRA', type: 'boolean', group: '활성화' },

  { key: 'ltx.1pass.unet', label: 'UNet 모델', type: 'model', group: '1 Pass', modelCategory: 'diffusionModels' as ModelCategory },
  { key: 'ltx.1pass.weight_dtype', label: 'Weight Dtype', type: 'string', group: '1 Pass' },
  { key: 'ltx.id_lora_name', label: 'ID LoRA', type: 'nodeOption', group: '1 Pass', nodeQuery: 'id_lora_name:LoraLoaderModelOnly:lora_name:LTX/:excludeSubdirs' },
  { key: 'ltx.1pass.id_lora_strength', label: 'ID LoRA Strength', type: 'number', step: 0.1, group: '1 Pass' },
  { key: 'ltx.1pass.identity_guidance_scale', label: 'RefAudio Guidance Scale', type: 'number', step: 0.1, group: '1 Pass' },
  { key: 'ltx.1pass.identity_start_percent', label: 'RefAudio Start %', type: 'number', step: 0.01, group: '1 Pass' },
  { key: 'ltx.1pass.identity_end_percent', label: 'RefAudio End %', type: 'number', step: 0.01, group: '1 Pass' },
  { key: 'ltx.1pass.nag_scale', label: 'NAG Scale', type: 'number', step: 0.1, group: '1 Pass' },
  { key: 'ltx.1pass.nag_alpha', label: 'NAG Alpha', type: 'number', step: 0.01, group: '1 Pass' },
  { key: 'ltx.1pass.nag_tau', label: 'NAG Tau', type: 'number', step: 0.1, group: '1 Pass' },
  { key: 'ltx.1pass.audio_norm', label: 'Audio Norm Factors', type: 'string', group: '1 Pass' },
  { key: 'ltx.1pass.scheduler_steps', label: 'Steps', type: 'number', step: 1, group: '1 Pass' },
  { key: 'ltx.1pass.scheduler_max_shift', label: 'Max Shift', type: 'number', step: 0.01, group: '1 Pass' },
  { key: 'ltx.1pass.scheduler_base_shift', label: 'Base Shift', type: 'number', step: 0.01, group: '1 Pass' },
  { key: 'ltx.1pass.scheduler_stretch', label: 'Stretch', type: 'boolean', group: '1 Pass' },
  { key: 'ltx.1pass.scheduler_terminal', label: 'Terminal', type: 'number', step: 0.01, group: '1 Pass' },
  { key: 'ltx.1pass.distilled_lora_name', label: 'Distilled LoRA', type: 'nodeOption', group: '1 Pass', nodeQuery: 'distilled_lora_name:LoraLoaderModelOnly:lora_name:LTX/:excludeSubdirs' },
  { key: 'ltx.1pass.distilled_lora_strength', label: 'Distilled LoRA Strength', type: 'number', step: 0.1, group: '1 Pass' },
  { key: 'ltx.sampler', label: '샘플러', type: 'nodeOption', group: '1 Pass', nodeQuery: 'clown_sampler:ClownSampler_Beta:sampler_name' },
  { key: 'ltx.clown_eta', label: 'Eta', type: 'number', step: 0.01, group: '1 Pass' },
  { key: 'ltx.clown_bongmath', label: 'Bongmath', type: 'boolean', group: '1 Pass' },
];

const LTX_2PASS_FIELDS: SettingsField[] = [
  { key: 'ltx.2pass.distilled_lora_enabled', label: 'Distilled LoRA', type: 'boolean', group: '활성화' },

  { key: 'ltx.2pass.unet', label: 'UNet 모델', type: 'model', group: '1st Pass', modelCategory: 'diffusionModels' as ModelCategory },
  { key: 'ltx.2pass.weight_dtype', label: 'Weight Dtype', type: 'string', group: '1st Pass' },
  { key: 'ltx.id_lora_name', label: 'ID LoRA', type: 'nodeOption', group: '1st Pass', nodeQuery: 'id_lora_name:LoraLoaderModelOnly:lora_name:LTX/:excludeSubdirs' },
  { key: 'ltx.2pass.id_lora_strength', label: 'ID LoRA Strength', type: 'number', step: 0.1, group: '1st Pass' },
  { key: 'ltx.2pass.identity_guidance_scale', label: 'RefAudio Guidance Scale', type: 'number', step: 0.1, group: '1st Pass' },
  { key: 'ltx.2pass.identity_start_percent', label: 'RefAudio Start %', type: 'number', step: 0.01, group: '1st Pass' },
  { key: 'ltx.2pass.identity_end_percent', label: 'RefAudio End %', type: 'number', step: 0.01, group: '1st Pass' },
  { key: 'ltx.2pass.distilled_lora_name', label: 'Distilled LoRA', type: 'nodeOption', group: '1st Pass', nodeQuery: 'distilled_lora_name:LoraLoaderModelOnly:lora_name:LTX/:excludeSubdirs' },
  { key: 'ltx.2pass.distilled_lora_strength', label: 'Distilled LoRA Strength', type: 'number', step: 0.1, group: '1st Pass' },
  { key: 'ltx.2pass.nag_scale', label: 'NAG Scale', type: 'number', step: 0.1, group: '1st Pass' },
  { key: 'ltx.2pass.nag_alpha', label: 'NAG Alpha', type: 'number', step: 0.01, group: '1st Pass' },
  { key: 'ltx.2pass.nag_tau', label: 'NAG Tau', type: 'number', step: 0.1, group: '1st Pass' },
  { key: 'ltx.2pass.audio_norm_1st', label: 'Audio Norm Factors', type: 'string', group: '1st Pass' },
  { key: 'ltx.2pass.scheduler_steps', label: 'Steps', type: 'number', step: 1, group: '1st Pass' },
  { key: 'ltx.2pass.scheduler_max_shift', label: 'Max Shift', type: 'number', step: 0.01, group: '1st Pass' },
  { key: 'ltx.2pass.scheduler_base_shift', label: 'Base Shift', type: 'number', step: 0.01, group: '1st Pass' },
  { key: 'ltx.2pass.scheduler_stretch', label: 'Stretch', type: 'boolean', group: '1st Pass' },
  { key: 'ltx.2pass.scheduler_terminal', label: 'Terminal', type: 'number', step: 0.01, group: '1st Pass' },
  { key: 'ltx.sampler', label: '샘플러', type: 'nodeOption', group: '1st Pass', nodeQuery: 'clown_sampler:ClownSampler_Beta:sampler_name' },
  { key: 'ltx.clown_eta', label: 'Eta', type: 'number', step: 0.01, group: '1st Pass' },
  { key: 'ltx.clown_bongmath', label: 'Bongmath', type: 'boolean', group: '1st Pass' },

  { key: 'ltx.2pass.unet_2nd', label: 'UNet 모델', type: 'model', group: '2nd Pass', modelCategory: 'diffusionModels' as ModelCategory },
  { key: 'ltx.2pass.weight_dtype_2nd', label: 'Weight Dtype', type: 'string', group: '2nd Pass' },
  { key: 'ltx.2pass.id_lora_strength_2nd', label: 'ID LoRA Strength', type: 'number', step: 0.1, group: '2nd Pass' },
  { key: 'ltx.2pass.identity_guidance_scale_2nd', label: 'RefAudio Guidance Scale', type: 'number', step: 0.1, group: '2nd Pass' },
  { key: 'ltx.2pass.identity_start_percent_2nd', label: 'RefAudio Start %', type: 'number', step: 0.01, group: '2nd Pass' },
  { key: 'ltx.2pass.identity_end_percent_2nd', label: 'RefAudio End %', type: 'number', step: 0.01, group: '2nd Pass' },
  { key: 'ltx.2pass.nag_scale_2nd', label: 'NAG Scale', type: 'number', step: 0.1, group: '2nd Pass' },
  { key: 'ltx.2pass.nag_alpha_2nd', label: 'NAG Alpha', type: 'number', step: 0.01, group: '2nd Pass' },
  { key: 'ltx.2pass.nag_tau_2nd', label: 'NAG Tau', type: 'number', step: 0.1, group: '2nd Pass' },
  { key: 'ltx.2pass.audio_norm_2nd', label: 'Audio Norm Factors', type: 'string', group: '2nd Pass' },
  { key: 'ltx.2pass.sigmas_2nd', label: 'Sigmas', type: 'string', group: '2nd Pass' },
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
  const [passMode, setPassMode] = useState<string>('2pass');

  const fields = useMemo(() => [
    ...LTX_SHARED_TOP,
    ...(passMode === '1pass' ? LTX_1PASS_FIELDS : LTX_2PASS_FIELDS),
    ...LTX_SHARED_BOTTOM,
  ], [passMode]);

  return (
    <ModelSettingsTab
      title="LTX 2.3 설정"
      category="ltx"
      fields={fields}
      headerExtra={<LtxHeaderExtra />}
      onValuesLoaded={(values) => setPassMode(values['ltx.pass_mode'] || '2pass')}
      onValueChange={(key, value) => {
        if (key === 'ltx.pass_mode') setPassMode(value);
      }}
    />
  );
}
