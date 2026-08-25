'use client';

import ModelSettingsTab, { type SettingsField } from './ModelSettingsTab';

const H3_FL2VA_FIELDS: SettingsField[] = [
  { key: 'h3-fl2va.unet', label: 'UNet', type: 'nodeOption', group: 'H3 — 모델', nodeQuery: 'unet:UNETLoader:unet_name' },
  { key: 'h3-fl2va.unet_weight_dtype', label: 'Weight Dtype', type: 'nodeOption', group: 'H3 — 모델', nodeQuery: 'unet_weight_dtype:UNETLoader:weight_dtype' },
  { key: 'h3-fl2va.clip_name', label: 'CLIP', type: 'nodeOption', group: 'H3 — 모델', nodeQuery: 'clip_name:CLIPLoader:clip_name' },
  { key: 'h3-fl2va.clip_type', label: 'CLIP Type', type: 'nodeOption', group: 'H3 — 모델', nodeQuery: 'clip_type:CLIPLoader:type' },
  { key: 'h3-fl2va.clip_device', label: 'CLIP Device', type: 'nodeOption', group: 'H3 — 모델', nodeQuery: 'clip_device:CLIPLoader:device' },
  { key: 'h3-fl2va.video_vae', label: 'Video VAE', type: 'nodeOption', group: 'H3 — 모델', nodeQuery: 'video_vae:VAELoader:vae_name' },
  { key: 'h3-fl2va.audio_vae', label: 'Audio VAE', type: 'nodeOption', group: 'H3 — 모델', nodeQuery: 'audio_vae:VAELoader:vae_name' },
  { key: 'h3-fl2va.turbo_lora', label: 'Turbo LoRA', type: 'nodeOption', group: 'H3 — 모델', nodeQuery: 'turbo_lora:LoraLoaderModelOnly:lora_name' },
  { key: 'h3-fl2va.turbo_lora_strength', label: 'Turbo LoRA Strength', type: 'number', step: 0.01, group: 'H3 — 모델' },

  { key: 'h3-fl2va.steps', label: 'Steps', type: 'number', step: 1, group: 'H3 — 샘플러' },
  { key: 'h3-fl2va.sampler', label: 'Sampler', type: 'nodeOption', group: 'H3 — 샘플러', nodeQuery: 'sampler:KSamplerSelect:sampler_name' },
  { key: 'h3-fl2va.scheduler', label: 'Scheduler', type: 'nodeOption', group: 'H3 — 샘플러', nodeQuery: 'scheduler:BasicScheduler:scheduler' },
  { key: 'h3-fl2va.shift_video', label: 'Shift (Video)', type: 'number', step: 0.1, group: 'H3 — 샘플러' },
  { key: 'h3-fl2va.shift_audio', label: 'Shift (Audio)', type: 'number', step: 0.1, group: 'H3 — 샘플러' },
  { key: 'h3-fl2va.chunk_feedforward_enabled', label: 'Chunk FeedForward', type: 'boolean', group: 'H3 — 샘플러' },
  { key: 'h3-fl2va.chunk_feedforward_chunks', label: 'Chunks', type: 'number', step: 1, group: 'H3 — 샘플러' },
  { key: 'h3-fl2va.chunk_feedforward_min_len', label: 'Min Tokens', type: 'number', step: 1, group: 'H3 — 샘플러' },

  { key: 'h3-fl2va.sage_attention', label: 'Sage Attention', type: 'nodeOption', group: 'H3 — Sage Attention', nodeQuery: 'sage_attention:PathchSageAttentionKJ:sage_attention' },
  { key: 'h3-fl2va.sage_allow_compile', label: 'Allow Compile', type: 'boolean', group: 'H3 — Sage Attention' },
  { key: 'h3-fl2va.low_vram_head_chunks', label: 'Head Chunks', type: 'number', step: 1, group: 'H3 — Sage Attention' },

  { key: 'h3-fl2va.megapixels', label: '해상도 (MP)', type: 'number', step: 0.01, group: 'H3 — 이미지' },
  { key: 'h3-fl2va.megapixels_last', label: '끝 이미지 해상도 (MP)', type: 'number', step: 0.01, group: 'H3 — 이미지' },
  { key: 'h3-fl2va.resize_multiple_of', label: 'Resize Multiple Of', type: 'number', step: 1, group: 'H3 — 이미지' },
  { key: 'h3-fl2va.resize_upscale_method', label: 'Resize 방식', type: 'nodeOption', group: 'H3 — 이미지', nodeQuery: 'resize_upscale_method:ResizeImageToMegapixels:upscale_method' },

  { key: 'h3-fl2va.duration_options', label: 'Duration Options — N값 CSV', type: 'string', group: 'H3 — 생성', monoFont: true },
  { key: 'h3-fl2va.frames_per_step', label: 'Frames per Step', type: 'number', step: 1, group: 'H3 — 생성' },
  { key: 'h3-fl2va.frame_base', label: 'Frame Base', type: 'number', step: 1, group: 'H3 — 생성' },
  { key: 'h3-fl2va.frame_rate', label: 'Frame Rate', type: 'number', step: 1, group: 'H3 — 생성' },

  { key: 'h3-fl2va.rtx_enabled', label: 'RTX Upscale', type: 'boolean', group: 'H3 — RTX 후처리' },
  { key: 'h3-fl2va.rtx_resize_type', label: 'Resize Type', type: 'nodeOption', group: 'H3 — RTX 후처리', nodeQuery: 'rtx_resize_type:RTXVideoSuperResolution:resize_type' },
  { key: 'h3-fl2va.rtx_scale', label: 'Scale', type: 'number', step: 0.1, group: 'H3 — RTX 후처리' },
  { key: 'h3-fl2va.rtx_quality', label: 'Quality', type: 'nodeOption', group: 'H3 — RTX 후처리', nodeQuery: 'rtx_quality:RTXVideoSuperResolution:quality' },

  { key: 'h3-fl2va.video_crf', label: 'CRF', type: 'number', step: 1, group: 'H3 — 영상 출력' },
  { key: 'h3-fl2va.video_format', label: 'Format', type: 'nodeOption', group: 'H3 — 영상 출력', nodeQuery: 'video_format:VHS_VideoCombine:format' },
  { key: 'h3-fl2va.video_pix_fmt', label: 'Pixel Format', type: 'nodeOption', group: 'H3 — 영상 출력', nodeQuery: 'video_pix_fmt:VHS_VideoCombine:pix_fmt' },
];

export default function H3Fl2vaSettingsTab() {
  return (
    <ModelSettingsTab
      title="H3 FL2VA 설정"
      category="h3-fl2va"
      fields={H3_FL2VA_FIELDS}
    />
  );
}
