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

const LTX_FIELDS: SettingsField[] = [
  { key: 'ltx.checkpoint', label: 'Checkpoint', type: 'nodeOption', group: 'LTX - Model', nodeQuery: 'checkpoint:CheckpointLoaderSimple:ckpt_name' },
  { key: 'ltx.text_encoder', label: 'Text Encoder', type: 'nodeOption', group: 'LTX - Model', nodeQuery: 'text_encoder:LTXAVTextEncoderLoader:text_encoder' },

  { key: 'ltx.negative_prompt', label: 'Negative Prompt', type: 'textarea', group: 'LTX - Prompts', monoFont: true },
  { key: 'ltx.video_conditioning_prompt', label: 'Video Conditioning Prompt', type: 'textarea', group: 'LTX - Prompts', monoFont: true },
  { key: 'ltx.audio_conditioning_prompt', label: 'Audio Conditioning Prompt', type: 'textarea', group: 'LTX - Prompts', monoFont: true },

  { key: 'ltx.frame_rate', label: 'Frame Rate', type: 'number', step: 1, group: 'LTX - Generation' },
  { key: 'ltx.duration_options', label: 'N Options (CSV)', type: 'string', group: 'LTX - Generation', monoFont: true },
  { key: 'ltx.frame_base', label: 'Frame Base', type: 'number', step: 1, group: 'LTX - Generation' },
  { key: 'ltx.megapixels', label: 'Resolution (MP)', type: 'number', step: 0.01, group: 'LTX - Generation' },
  { key: 'ltx.resize_multiple_of', label: 'Resize Multiple Of', type: 'number', step: 1, group: 'LTX - Generation' },
  { key: 'ltx.resize_upscale_method', label: 'Resize Method', type: 'nodeOption', group: 'LTX - Generation', nodeQuery: 'resize_upscale_method:ResizeImageToMegapixels:upscale_method' },

  { key: 'ltx.sampler', label: 'Sampler', type: 'nodeOption', group: 'LTX - Sampler', nodeQuery: 'sampler:ClownSampler_Beta:sampler_name' },
  { key: 'ltx.clown_eta', label: 'Eta', type: 'number', step: 0.01, group: 'LTX - Sampler' },
  { key: 'ltx.clown_bongmath', label: 'Bongmath', type: 'boolean', group: 'LTX - Sampler' },
  { key: 'ltx.scheduler_steps', label: 'Steps', type: 'number', step: 1, group: 'LTX - Scheduler' },
  { key: 'ltx.scheduler_max_shift', label: 'Max Shift', type: 'number', step: 0.01, group: 'LTX - Scheduler' },
  { key: 'ltx.scheduler_base_shift', label: 'Base Shift', type: 'number', step: 0.01, group: 'LTX - Scheduler' },
  { key: 'ltx.scheduler_stretch', label: 'Stretch', type: 'boolean', group: 'LTX - Scheduler' },
  { key: 'ltx.scheduler_terminal', label: 'Terminal', type: 'number', step: 0.01, group: 'LTX - Scheduler' },

  { key: 'ltx.nag_scale', label: 'NAG Scale', type: 'number', step: 0.1, group: 'LTX - NAG' },
  { key: 'ltx.nag_alpha', label: 'NAG Alpha', type: 'number', step: 0.01, group: 'LTX - NAG' },
  { key: 'ltx.nag_tau', label: 'NAG Tau', type: 'number', step: 0.001, group: 'LTX - NAG' },

  { key: 'ltx.identity_guidance_scale', label: 'ID Guidance Scale', type: 'number', step: 0.1, group: 'LTX - Reference Audio' },
  { key: 'ltx.identity_start_percent', label: 'ID Start Percent', type: 'number', step: 0.01, group: 'LTX - Reference Audio' },
  { key: 'ltx.identity_end_percent', label: 'ID End Percent', type: 'number', step: 0.01, group: 'LTX - Reference Audio' },

  { key: 'ltx.guide_frame_index', label: 'Frame Index', type: 'number', step: 1, group: 'LTX - Guide' },
  { key: 'ltx.guide_strength', label: 'Strength', type: 'number', step: 0.01, group: 'LTX - Guide' },
  { key: 'ltx.guide_crf', label: 'CRF', type: 'number', step: 1, group: 'LTX - Guide' },
  { key: 'ltx.guide_blur_radius', label: 'Blur Radius', type: 'number', step: 1, group: 'LTX - Guide' },
  { key: 'ltx.guide_interpolation', label: 'Interpolation', type: 'nodeOption', group: 'LTX - Guide', nodeQuery: 'guide_interpolation:LTXVAddGuideAdvanced:interpolation' },
  { key: 'ltx.guide_crop', label: 'Crop', type: 'nodeOption', group: 'LTX - Guide', nodeQuery: 'guide_crop:LTXVAddGuideAdvanced:crop' },

  { key: 'ltx.anchor_strength', label: 'Strength', type: 'number', step: 0.01, group: 'LTX - Anchor' },
  { key: 'ltx.anchor_cache_at_step', label: 'Cache At Step', type: 'number', step: 1, group: 'LTX - Anchor' },
  { key: 'ltx.anchor_similarity_threshold', label: 'Similarity Threshold', type: 'number', step: 0.01, group: 'LTX - Anchor' },
  { key: 'ltx.anchor_decay_with_distance', label: 'Decay With Distance', type: 'number', step: 0.01, group: 'LTX - Anchor' },
  { key: 'ltx.anchor_energy_threshold', label: 'Energy Threshold', type: 'number', step: 0.01, group: 'LTX - Anchor' },
  { key: 'ltx.anchor_bypass', label: 'Bypass', type: 'boolean', group: 'LTX - Anchor' },
  { key: 'ltx.anchor_debug', label: 'Debug', type: 'boolean', group: 'LTX - Anchor' },
  { key: 'ltx.anchor_advanced_mode', label: 'Advanced Mode', type: 'boolean', group: 'LTX - Anchor' },
  { key: 'ltx.anchor_cache_mode', label: 'Cache Mode', type: 'nodeOption', group: 'LTX - Anchor', nodeQuery: 'anchor_cache_mode:LTXLatentAnchorAware:cache_mode' },
  { key: 'ltx.anchor_forwards_per_step', label: 'Forwards Per Step', type: 'number', step: 1, group: 'LTX - Anchor' },
  { key: 'ltx.anchor_cache_warmup', label: 'Cache Warmup', type: 'number', step: 1, group: 'LTX - Anchor' },
  { key: 'ltx.anchor_frame', label: 'Anchor Frame', type: 'number', step: 1, group: 'LTX - Anchor' },
  { key: 'ltx.anchor_depth_curve', label: 'Depth Curve', type: 'nodeOption', group: 'LTX - Anchor', nodeQuery: 'anchor_depth_curve:LTXLatentAnchorAware:depth_curve' },
  { key: 'ltx.anchor_block_index_filter', label: 'Block Index Filter', type: 'string', group: 'LTX - Anchor', monoFont: true },

  { key: 'ltx.latent_upscale_model', label: 'Latent Upscale Model', type: 'nodeOption', group: 'LTX - 2-Pass', nodeQuery: 'latent_upscale_model:LatentUpscaleModelLoader:model_name' },
  { key: 'ltx.text_attention_amplification', label: 'Text Attention Amplification', type: 'number', step: 0.01, group: 'LTX - 2-Pass' },
  { key: 'ltx.second_pass_cfg', label: 'Second Pass CFG', type: 'number', step: 0.01, group: 'LTX - 2-Pass' },
  { key: 'ltx.second_pass_sigmas', label: 'Second Pass Sigmas', type: 'string', group: 'LTX - 2-Pass', monoFont: true },
  { key: 'ltx.second_pass_upscale_method', label: 'Second Pass Upscale Method', type: 'nodeOption', group: 'LTX - 2-Pass', nodeQuery: 'second_pass_upscale_method:ImageScaleBy:upscale_method' },
  { key: 'ltx.second_pass_upscale_by', label: 'Second Pass Upscale By', type: 'number', step: 0.01, group: 'LTX - 2-Pass' },
  { key: 'ltx.multimodal_video_cfg', label: 'Video CFG', type: 'number', step: 0.01, group: 'LTX - Multimodal CFG' },
  { key: 'ltx.multimodal_audio_cfg', label: 'Audio CFG', type: 'number', step: 0.01, group: 'LTX - Multimodal CFG' },
  { key: 'ltx.multimodal_inactive_cfg', label: 'Inactive CFG', type: 'number', step: 0.01, group: 'LTX - Multimodal CFG' },
  { key: 'ltx.multimodal_active_steps', label: 'Active Steps', type: 'number', step: 1, group: 'LTX - Multimodal CFG' },

  { key: 'ltx.lora_1_enabled', label: 'Enabled', type: 'boolean', group: 'LTX - LoRA 1' },
  { key: 'ltx.lora_1_name', label: 'Name', type: 'nodeOption', group: 'LTX - LoRA 1', nodeQuery: 'lora_1_name:LTX2LoraLoaderAdvanced:lora_name:LTX/' },
  { key: 'ltx.lora_1_strength', label: 'Strength', type: 'number', step: 0.01, group: 'LTX - LoRA 1' },
  { key: 'ltx.lora_1_video', label: 'Video', type: 'number', step: 0.01, group: 'LTX - LoRA 1' },
  { key: 'ltx.lora_1_video_to_audio', label: 'Video To Audio', type: 'number', step: 0.01, group: 'LTX - LoRA 1' },
  { key: 'ltx.lora_1_audio', label: 'Audio', type: 'number', step: 0.01, group: 'LTX - LoRA 1' },
  { key: 'ltx.lora_1_audio_to_video', label: 'Audio To Video', type: 'number', step: 0.01, group: 'LTX - LoRA 1' },
  { key: 'ltx.lora_1_other', label: 'Other', type: 'number', step: 0.01, group: 'LTX - LoRA 1' },

  { key: 'ltx.lora_2_enabled', label: 'Enabled', type: 'boolean', group: 'LTX - LoRA 2' },
  { key: 'ltx.lora_2_name', label: 'Name', type: 'nodeOption', group: 'LTX - LoRA 2', nodeQuery: 'lora_2_name:LTX2LoraLoaderAdvanced:lora_name:LTX/' },
  { key: 'ltx.lora_2_strength', label: 'Strength', type: 'number', step: 0.01, group: 'LTX - LoRA 2' },
  { key: 'ltx.lora_2_video', label: 'Video', type: 'number', step: 0.01, group: 'LTX - LoRA 2' },
  { key: 'ltx.lora_2_video_to_audio', label: 'Video To Audio', type: 'number', step: 0.01, group: 'LTX - LoRA 2' },
  { key: 'ltx.lora_2_audio', label: 'Audio', type: 'number', step: 0.01, group: 'LTX - LoRA 2' },
  { key: 'ltx.lora_2_audio_to_video', label: 'Audio To Video', type: 'number', step: 0.01, group: 'LTX - LoRA 2' },
  { key: 'ltx.lora_2_other', label: 'Other', type: 'number', step: 0.01, group: 'LTX - LoRA 2' },

  { key: 'ltx.lora_3_enabled', label: 'Enabled', type: 'boolean', group: 'LTX - LoRA 3' },
  { key: 'ltx.lora_3_name', label: 'Name', type: 'nodeOption', group: 'LTX - LoRA 3', nodeQuery: 'lora_3_name:LTX2LoraLoaderAdvanced:lora_name:LTX/' },
  { key: 'ltx.lora_3_strength', label: 'Strength', type: 'number', step: 0.01, group: 'LTX - LoRA 3' },
  { key: 'ltx.lora_3_video', label: 'Video', type: 'number', step: 0.01, group: 'LTX - LoRA 3' },
  { key: 'ltx.lora_3_video_to_audio', label: 'Video To Audio', type: 'number', step: 0.01, group: 'LTX - LoRA 3' },
  { key: 'ltx.lora_3_audio', label: 'Audio', type: 'number', step: 0.01, group: 'LTX - LoRA 3' },
  { key: 'ltx.lora_3_audio_to_video', label: 'Audio To Video', type: 'number', step: 0.01, group: 'LTX - LoRA 3' },
  { key: 'ltx.lora_3_other', label: 'Other', type: 'number', step: 0.01, group: 'LTX - LoRA 3' },

  { key: 'ltx.lora_4_enabled', label: 'Enabled', type: 'boolean', group: 'LTX - LoRA 4' },
  { key: 'ltx.lora_4_name', label: 'Name', type: 'nodeOption', group: 'LTX - LoRA 4', nodeQuery: 'lora_4_name:LTX2LoraLoaderAdvanced:lora_name:LTX/' },
  { key: 'ltx.lora_4_strength', label: 'Strength', type: 'number', step: 0.01, group: 'LTX - LoRA 4' },
  { key: 'ltx.lora_4_video', label: 'Video', type: 'number', step: 0.01, group: 'LTX - LoRA 4' },
  { key: 'ltx.lora_4_video_to_audio', label: 'Video To Audio', type: 'number', step: 0.01, group: 'LTX - LoRA 4' },
  { key: 'ltx.lora_4_audio', label: 'Audio', type: 'number', step: 0.01, group: 'LTX - LoRA 4' },
  { key: 'ltx.lora_4_audio_to_video', label: 'Audio To Video', type: 'number', step: 0.01, group: 'LTX - LoRA 4' },
  { key: 'ltx.lora_4_other', label: 'Other', type: 'number', step: 0.01, group: 'LTX - LoRA 4' },

  { key: 'ltx.id_lora_enabled', label: 'Enabled', type: 'boolean', group: 'LTX - ID LoRA' },
  { key: 'ltx.id_lora_name', label: 'Name', type: 'nodeOption', group: 'LTX - ID LoRA', nodeQuery: 'id_lora_name:LTX2LoraLoaderAdvanced:lora_name:LTX/' },
  { key: 'ltx.id_lora_strength', label: 'Strength', type: 'number', step: 0.01, group: 'LTX - ID LoRA' },
  { key: 'ltx.id_lora_video', label: 'Video', type: 'number', step: 0.01, group: 'LTX - ID LoRA' },
  { key: 'ltx.id_lora_video_to_audio', label: 'Video To Audio', type: 'number', step: 0.01, group: 'LTX - ID LoRA' },
  { key: 'ltx.id_lora_audio', label: 'Audio', type: 'number', step: 0.01, group: 'LTX - ID LoRA' },
  { key: 'ltx.id_lora_audio_to_video', label: 'Audio To Video', type: 'number', step: 0.01, group: 'LTX - ID LoRA' },
  { key: 'ltx.id_lora_other', label: 'Other', type: 'number', step: 0.01, group: 'LTX - ID LoRA' },

  { key: 'ltx.video_crf', label: 'CRF', type: 'number', step: 1, group: 'LTX - Output' },
  { key: 'ltx.video_format', label: 'Format', type: 'nodeOption', group: 'LTX - Output', nodeQuery: 'video_format:VHS_VideoCombine:format' },
  { key: 'ltx.video_pix_fmt', label: 'Pixel Format', type: 'nodeOption', group: 'LTX - Output', nodeQuery: 'video_pix_fmt:VHS_VideoCombine:pix_fmt' },
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
