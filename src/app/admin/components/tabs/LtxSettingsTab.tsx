'use client';

import ModelSettingsTab, { type SettingsField } from './ModelSettingsTab';

type ModelCategory = 'diffusionModels' | 'ggufClips' | 'clipEmbeddings' | 'kjVaes';

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
  { key: 'ltx.sigmas', label: 'Sigmas', type: 'string', group: 'Sigma' },
  { key: 'ltx.audio_norm', label: 'Audio Normalization', type: 'string', group: 'Audio' },
  { key: 'ltx.rtx_resize_type', label: 'RTX Resize Type', type: 'nodeOption', group: 'RTX', nodeQuery: 'rtx_resize_type:RTXVideoSuperResolution:resize_type' },
  { key: 'ltx.rtx_scale', label: 'RTX Scale', type: 'number', step: 0.1, group: 'RTX' },
  { key: 'ltx.rtx_quality', label: 'RTX Quality', type: 'nodeOption', group: 'RTX', nodeQuery: 'rtx_quality:RTXVideoSuperResolution:quality' },
  { key: 'ltx.negative_prompt', label: '네거티브 프롬프트', type: 'textarea', group: '프롬프트' },
];

export default function LtxSettingsTab() {
  return (
    <ModelSettingsTab
      title="LTX 2.3 설정"
      category="ltx"
      fields={LTX_FIELDS}
    />
  );
}
