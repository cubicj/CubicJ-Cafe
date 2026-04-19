'use client';

import ModelSettingsTab, { type SettingsField } from './ModelSettingsTab';

type ModelCategory = 'diffusionModels' | 'textEncoders' | 'vaes' | 'rifeModels';

const LTX_WAN_FIELDS: SettingsField[] = [
  { key: 'ltx-wan.audio_norm_enabled', label: 'Audio Norm', type: 'boolean', group: '활성화' },
  { key: 'ltx-wan.distilled_lora_enabled', label: 'Distilled LoRA', type: 'boolean', group: '활성화' },
  { key: 'ltx-wan.lora_enabled_wan', label: 'WAN LoRA', type: 'boolean', group: '활성화' },
  { key: 'ltx-wan.vfi_enabled', label: 'VFI', type: 'boolean', group: '활성화' },
  { key: 'ltx-wan.rtx_enabled', label: 'RTX Upscale', type: 'boolean', group: '활성화' },

  { key: 'ltx-wan.unet', label: 'LTX UNet', type: 'model', group: 'LTX — 모델', modelCategory: 'diffusionModels' as ModelCategory },
  { key: 'ltx-wan.weight_dtype', label: 'Weight DType', type: 'nodeOption', group: 'LTX — 모델', nodeQuery: 'weight_dtype:UNETLoader:weight_dtype' },
  { key: 'ltx-wan.clip_gguf', label: 'CLIP GGUF', type: 'model', group: 'LTX — 모델', modelCategory: 'textEncoders' as ModelCategory },
  { key: 'ltx-wan.clip_embeddings', label: 'CLIP Embeddings', type: 'model', group: 'LTX — 모델', modelCategory: 'textEncoders' as ModelCategory },
  { key: 'ltx-wan.video_vae', label: 'Video VAE', type: 'model', group: 'LTX — 모델', modelCategory: 'vaes' as ModelCategory },
  { key: 'ltx-wan.audio_vae', label: 'Audio VAE', type: 'model', group: 'LTX — 모델', modelCategory: 'vaes' as ModelCategory },

  { key: 'ltx-wan.sampler', label: '샘플러', type: 'nodeOption', group: 'LTX — 생성', nodeQuery: 'sampler:ClownSampler_Beta:sampler_name' },
  { key: 'ltx-wan.clown_eta', label: 'Eta', type: 'number', step: 0.01, group: 'LTX — 생성' },
  { key: 'ltx-wan.clown_bongmath', label: 'Bongmath', type: 'boolean', group: 'LTX — 생성' },
  { key: 'ltx-wan.megapixels', label: '해상도 (MP)', type: 'number', step: 0.01, group: 'LTX — 생성' },
  { key: 'ltx-wan.resize_multiple_of', label: 'Resize Multiple Of', type: 'number', step: 1, group: 'LTX — 생성' },
  { key: 'ltx-wan.resize_upscale_method', label: 'Resize 방식', type: 'nodeOption', group: 'LTX — 생성', nodeQuery: 'resize_upscale_method:ResizeImageToMegapixels:upscale_method' },
  { key: 'ltx-wan.img_compression', label: 'Image Compression', type: 'number', step: 1, group: 'LTX — 생성' },
  { key: 'ltx-wan.frame_rate', label: 'Frame Rate', type: 'number', step: 1, group: 'LTX — 생성' },
  { key: 'ltx-wan.duration_options', label: 'Duration Options (CSV)', type: 'string', group: 'LTX — 생성', monoFont: true },

  { key: 'ltx-wan.scheduler_steps', label: 'Steps', type: 'number', step: 1, group: 'LTX — 스케줄러' },
  { key: 'ltx-wan.scheduler_max_shift', label: 'Max Shift', type: 'number', step: 0.01, group: 'LTX — 스케줄러' },
  { key: 'ltx-wan.scheduler_base_shift', label: 'Base Shift', type: 'number', step: 0.01, group: 'LTX — 스케줄러' },
  { key: 'ltx-wan.scheduler_stretch', label: 'Stretch', type: 'boolean', group: 'LTX — 스케줄러' },
  { key: 'ltx-wan.scheduler_terminal', label: 'Terminal', type: 'number', step: 0.01, group: 'LTX — 스케줄러' },

  { key: 'ltx-wan.nag_scale', label: 'NAG Scale', type: 'number', step: 0.1, group: 'LTX — NAG' },
  { key: 'ltx-wan.nag_alpha', label: 'NAG Alpha', type: 'number', step: 0.01, group: 'LTX — NAG' },
  { key: 'ltx-wan.nag_tau', label: 'NAG Tau', type: 'number', step: 0.001, group: 'LTX — NAG' },

  { key: 'ltx-wan.audio_norm', label: 'Audio Norm Factors', type: 'string', group: 'LTX — 오디오', monoFont: true },
  { key: 'ltx-wan.identity_guidance_scale', label: 'ID Guidance Scale', type: 'number', step: 0.1, group: 'LTX — 오디오' },
  { key: 'ltx-wan.identity_start_percent', label: 'ID Start %', type: 'number', step: 0.01, group: 'LTX — 오디오' },
  { key: 'ltx-wan.identity_end_percent', label: 'ID End %', type: 'number', step: 0.01, group: 'LTX — 오디오' },
  { key: 'ltx-wan.id_lora_name', label: 'ID LoRA', type: 'nodeOption', group: 'LTX — 오디오', nodeQuery: 'id_lora_name:LoraLoaderModelOnly:lora_name:LTX/:excludeSubdirs' },
  { key: 'ltx-wan.id_lora_strength', label: 'ID LoRA Strength', type: 'number', step: 0.01, group: 'LTX — 오디오' },

  { key: 'ltx-wan.distilled_lora_name', label: 'Distilled LoRA', type: 'nodeOption', group: 'LTX — Distilled LoRA', nodeQuery: 'distilled_lora_name:LoraLoaderModelOnly:lora_name:LTX/:excludeSubdirs' },
  { key: 'ltx-wan.distilled_lora_strength', label: 'Strength', type: 'number', step: 0.01, group: 'LTX — Distilled LoRA' },

  { key: 'ltx-wan.negative_prompt_ltx', label: 'LTX 네거티브', type: 'textarea', group: 'LTX — 프롬프트' },

  { key: 'ltx-wan.unet_wan', label: 'WAN Model', type: 'model', group: 'WAN — 모델', modelCategory: 'diffusionModels' as ModelCategory },
  { key: 'ltx-wan.clip_wan', label: 'WAN T5 Encoder', type: 'model', group: 'WAN — 모델', modelCategory: 'textEncoders' as ModelCategory },
  { key: 'ltx-wan.vae_wan', label: 'WAN VAE', type: 'model', group: 'WAN — 모델', modelCategory: 'vaes' as ModelCategory },
  { key: 'ltx-wan.shift', label: 'Sampling Shift', type: 'number', step: 0.1, group: 'WAN — 모델' },

  { key: 'ltx-wan.cfg_wan', label: 'CFG', type: 'number', step: 0.1, group: 'WAN — 샘플러' },
  { key: 'ltx-wan.scheduler_wan', label: 'Scheduler', type: 'nodeOption', group: 'WAN — 샘플러', nodeQuery: 'scheduler_wan:WanVideoSampler:scheduler' },
  { key: 'ltx-wan.steps_wan', label: 'Steps', type: 'number', step: 1, group: 'WAN — 샘플러' },
  { key: 'ltx-wan.denoise_wan', label: 'Denoise', type: 'number', step: 0.01, group: 'WAN — 샘플러' },
  { key: 'ltx-wan.blocks_to_swap', label: 'Blocks to Swap', type: 'number', step: 1, group: 'WAN — 샘플러' },
  { key: 'ltx-wan.prefetch_blocks', label: 'Prefetch Blocks', type: 'number', step: 1, group: 'WAN — 샘플러' },
  { key: 'ltx-wan.sigmas_wan', label: 'Sigmas (CSV)', type: 'string', group: 'WAN — 샘플러', monoFont: true },

  { key: 'ltx-wan.propagate_x0', label: 'Propagate x0', type: 'boolean', group: 'WAN — Context Refine' },
  { key: 'ltx-wan.propagate_x0_strength', label: 'Propagate x0 Strength', type: 'number', step: 0.01, group: 'WAN — Context Refine' },

  { key: 'ltx-wan.nag_scale_wan', label: 'NAG Scale', type: 'number', step: 0.1, group: 'WAN — NAG' },
  { key: 'ltx-wan.nag_alpha_wan', label: 'NAG Alpha', type: 'number', step: 0.01, group: 'WAN — NAG' },
  { key: 'ltx-wan.nag_tau_wan', label: 'NAG Tau', type: 'number', step: 0.001, group: 'WAN — NAG' },

  { key: 'ltx-wan.negative_prompt_wan', label: 'WAN 네거티브', type: 'textarea', group: 'WAN — 프롬프트' },

  { key: 'ltx-wan.vfi_method', label: 'VFI 방식', type: 'select', group: '후처리 — VFI', options: [{ label: 'RIFE (TensorRT)', value: 'rife' }, { label: 'GMFSS Fortuna', value: 'gmfss' }] },
  { key: 'ltx-wan.vfi_multiplier', label: 'Multiplier', type: 'number', step: 1, group: '후처리 — VFI' },
  { key: 'ltx-wan.vfi_clear_cache', label: 'Clear Cache (frames)', type: 'number', step: 1, group: '후처리 — VFI' },
  { key: 'ltx-wan.rife_model', label: 'RIFE Model', type: 'model', group: '후처리 — VFI', modelCategory: 'rifeModels' as ModelCategory },
  { key: 'ltx-wan.rife_precision', label: 'RIFE Precision', type: 'nodeOption', group: '후처리 — VFI', nodeQuery: 'rife_precision:AutoLoadRifeTensorrtModel:precision' },
  { key: 'ltx-wan.rife_resolution_profile', label: 'RIFE Resolution Profile', type: 'nodeOption', group: '후처리 — VFI', nodeQuery: 'rife_resolution_profile:AutoLoadRifeTensorrtModel:resolution_profile' },
  { key: 'ltx-wan.rife_custom_min_dim', label: 'RIFE Custom Min Dim', type: 'number', step: 1, group: '후처리 — VFI' },
  { key: 'ltx-wan.rife_custom_opt_dim', label: 'RIFE Custom Opt Dim', type: 'number', step: 1, group: '후처리 — VFI' },
  { key: 'ltx-wan.rife_custom_max_dim', label: 'RIFE Custom Max Dim', type: 'number', step: 1, group: '후처리 — VFI' },
  { key: 'ltx-wan.gmfss_model', label: 'GMFSS Model', type: 'string', group: '후처리 — VFI' },

  { key: 'ltx-wan.rtx_resize_type', label: 'Resize Type', type: 'nodeOption', group: '후처리 — Upscale', nodeQuery: 'rtx_resize_type:RTXVideoSuperResolution:resize_type' },
  { key: 'ltx-wan.rtx_scale', label: 'Scale', type: 'number', step: 0.1, group: '후처리 — Upscale' },
  { key: 'ltx-wan.rtx_quality', label: 'Quality', type: 'nodeOption', group: '후처리 — Upscale', nodeQuery: 'rtx_quality:RTXVideoSuperResolution:quality' },

  { key: 'ltx-wan.video_crf', label: 'CRF', type: 'number', step: 1, group: '비디오' },
  { key: 'ltx-wan.video_format', label: 'Format', type: 'nodeOption', group: '비디오', nodeQuery: 'video_format:VHS_VideoCombine:format' },
  { key: 'ltx-wan.video_pix_fmt', label: 'Pixel Format', type: 'nodeOption', group: '비디오', nodeQuery: 'video_pix_fmt:VHS_VideoCombine:pix_fmt' },
];

export default function LtxWanSettingsTab() {
  return (
    <ModelSettingsTab
      title="L+W 설정"
      category="ltx-wan"
      fields={LTX_WAN_FIELDS}
    />
  );
}
