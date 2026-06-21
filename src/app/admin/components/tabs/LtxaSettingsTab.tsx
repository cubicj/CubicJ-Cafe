'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, ListPlus, Music } from 'lucide-react';
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
import LtxLoraChainDialog from '@/app/admin/components/ltx/LtxLoraChainDialog';

const LTXA_FIELDS: SettingsField[] = [
  { key: 'ltxa.end_image_enabled', label: 'End Image / Loop', type: 'boolean', group: '활성화' },

  { key: 'ltxa.checkpoint', label: 'Checkpoint', type: 'nodeOption', group: 'LTXA - Model', nodeQuery: 'checkpoint:CheckpointLoaderSimple:ckpt_name' },
  { key: 'ltxa.text_encoder', label: 'Text Encoder', type: 'nodeOption', group: 'LTXA - Model', nodeQuery: 'text_encoder:LTXAVTextEncoderLoader:text_encoder' },
  { key: 'ltxa.audio_vae', label: 'Audio VAE', type: 'nodeOption', group: 'LTXA - Model', nodeQuery: 'audio_vae:LTXVAudioVAELoader:ckpt_name' },

  { key: 'ltxa.negative_prompt', label: 'Negative Prompt', type: 'textarea', group: 'LTXA - Prompts', monoFont: true },
  { key: 'ltxa.video_conditioning_prompt', label: 'Video Conditioning Prompt', type: 'textarea', group: 'LTXA - Prompts', monoFont: true },
  { key: 'ltxa.audio_conditioning_prompt', label: 'Audio Conditioning Prompt', type: 'textarea', group: 'LTXA - Prompts', monoFont: true },

  { key: 'ltxa.frame_rate', label: 'Frame Rate', type: 'number', step: 1, group: 'LTXA - Generation' },
  { key: 'ltxa.duration_options', label: 'N Options (CSV)', type: 'string', group: 'LTXA - Generation', monoFont: true },
  { key: 'ltxa.frame_base', label: 'Frame Base', type: 'number', step: 1, group: 'LTXA - Generation' },
  { key: 'ltxa.megapixels', label: 'Resolution (MP)', type: 'number', step: 0.01, group: 'LTXA - Generation' },
  { key: 'ltxa.resize_multiple_of', label: 'Resize Multiple Of', type: 'number', step: 1, group: 'LTXA - Generation' },
  { key: 'ltxa.resize_upscale_method', label: 'Resize Method', type: 'nodeOption', group: 'LTXA - Generation', nodeQuery: 'resize_upscale_method:ResizeImageToMegapixels:upscale_method' },
  { key: 'ltxa.preprocess_img_compression', label: 'Image Compression', type: 'number', step: 1, group: 'LTXA - Generation' },

  { key: 'ltxa.sampler', label: 'Sampler', type: 'nodeOption', group: 'LTXA - Sampler', nodeQuery: 'sampler:KSamplerSelect:sampler_name' },
  { key: 'ltxa.scheduler_steps', label: 'Steps', type: 'number', step: 1, group: 'LTXA - Scheduler' },
  { key: 'ltxa.scheduler_max_shift', label: 'Max Shift', type: 'number', step: 0.01, group: 'LTXA - Scheduler' },
  { key: 'ltxa.scheduler_base_shift', label: 'Base Shift', type: 'number', step: 0.01, group: 'LTXA - Scheduler' },
  { key: 'ltxa.scheduler_stretch', label: 'Stretch', type: 'boolean', group: 'LTXA - Scheduler' },
  { key: 'ltxa.scheduler_terminal', label: 'Terminal', type: 'number', step: 0.01, group: 'LTXA - Scheduler' },

  { key: 'ltxa.nag_scale', label: 'NAG Scale', type: 'number', step: 0.1, group: 'LTXA - NAG' },
  { key: 'ltxa.nag_alpha', label: 'NAG Alpha', type: 'number', step: 0.01, group: 'LTXA - NAG' },
  { key: 'ltxa.nag_tau', label: 'NAG Tau', type: 'number', step: 0.001, group: 'LTXA - NAG' },

  { key: 'ltxa.identity_guidance_scale', label: 'ID Guidance Scale', type: 'number', step: 0.1, group: 'LTXA - Reference Audio' },
  { key: 'ltxa.identity_start_percent', label: 'ID Start Percent', type: 'number', step: 0.01, group: 'LTXA - Reference Audio' },
  { key: 'ltxa.identity_end_percent', label: 'ID End Percent', type: 'number', step: 0.01, group: 'LTXA - Reference Audio' },

  { key: 'ltxa.guide_frame_index', label: 'Frame Index', type: 'number', step: 1, group: 'LTXA - Guide' },
  { key: 'ltxa.guide_strength', label: 'Strength', type: 'number', step: 0.01, group: 'LTXA - Guide' },
  { key: 'ltxa.guide_crf', label: 'CRF', type: 'number', step: 1, group: 'LTXA - Guide' },
  { key: 'ltxa.guide_blur_radius', label: 'Blur Radius', type: 'number', step: 1, group: 'LTXA - Guide' },
  { key: 'ltxa.guide_interpolation', label: 'Interpolation', type: 'nodeOption', group: 'LTXA - Guide', nodeQuery: 'guide_interpolation:LTXVAddGuideAdvanced:interpolation' },
  { key: 'ltxa.guide_crop', label: 'Crop', type: 'nodeOption', group: 'LTXA - Guide', nodeQuery: 'guide_crop:LTXVAddGuideAdvanced:crop' },

  { key: 'ltxa.anchor_strength', label: 'Strength', type: 'number', step: 0.01, group: 'LTXA - Anchor' },
  { key: 'ltxa.anchor_cache_at_step', label: 'Cache At Step', type: 'number', step: 1, group: 'LTXA - Anchor' },
  { key: 'ltxa.anchor_similarity_threshold', label: 'Similarity Threshold', type: 'number', step: 0.01, group: 'LTXA - Anchor' },
  { key: 'ltxa.anchor_decay_with_distance', label: 'Decay With Distance', type: 'number', step: 0.01, group: 'LTXA - Anchor' },
  { key: 'ltxa.anchor_energy_threshold', label: 'Energy Threshold', type: 'number', step: 0.01, group: 'LTXA - Anchor' },
  { key: 'ltxa.anchor_bypass', label: 'Bypass', type: 'boolean', group: 'LTXA - Anchor' },
  { key: 'ltxa.anchor_debug', label: 'Debug', type: 'boolean', group: 'LTXA - Anchor' },
  { key: 'ltxa.anchor_advanced_mode', label: 'Advanced Mode', type: 'boolean', group: 'LTXA - Anchor' },
  { key: 'ltxa.anchor_cache_mode', label: 'Cache Mode', type: 'nodeOption', group: 'LTXA - Anchor', nodeQuery: 'anchor_cache_mode:LTXLatentAnchorAware:cache_mode' },
  { key: 'ltxa.anchor_forwards_per_step', label: 'Forwards Per Step', type: 'number', step: 1, group: 'LTXA - Anchor' },
  { key: 'ltxa.anchor_cache_warmup', label: 'Cache Warmup', type: 'number', step: 1, group: 'LTXA - Anchor' },
  { key: 'ltxa.anchor_frame', label: 'Anchor Frame', type: 'number', step: 1, group: 'LTXA - Anchor' },
  { key: 'ltxa.anchor_depth_curve', label: 'Depth Curve', type: 'nodeOption', group: 'LTXA - Anchor', nodeQuery: 'anchor_depth_curve:LTXLatentAnchorAware:depth_curve' },
  { key: 'ltxa.anchor_block_index_filter', label: 'Block Index Filter', type: 'string', group: 'LTXA - Anchor', monoFont: true },

  { key: 'ltxa.latent_upscale_model', label: 'Latent Upscale Model', type: 'nodeOption', group: 'LTXA - 2-Pass', nodeQuery: 'latent_upscale_model:LatentUpscaleModelLoader:model_name' },
  { key: 'ltxa.text_attention_amplification', label: 'Text Attention Amplification', type: 'number', step: 0.01, group: 'LTXA - 2-Pass' },
  { key: 'ltxa.second_pass_cfg', label: 'Second Pass CFG', type: 'number', step: 0.01, group: 'LTXA - 2-Pass' },
  { key: 'ltxa.second_pass_sigmas', label: 'Second Pass Sigmas', type: 'string', group: 'LTXA - 2-Pass', monoFont: true },
  { key: 'ltxa.second_pass_upscale_method', label: 'Second Pass Upscale Method', type: 'nodeOption', group: 'LTXA - 2-Pass', nodeQuery: 'second_pass_upscale_method:ImageScaleBy:upscale_method' },
  { key: 'ltxa.second_pass_upscale_by', label: 'Second Pass Upscale By', type: 'number', step: 0.01, group: 'LTXA - 2-Pass' },
  { key: 'ltxa.second_pass_anchor_strength', label: 'Strength', type: 'number', step: 0.01, group: 'LTXA - 2-Pass Anchor' },
  { key: 'ltxa.second_pass_anchor_cache_at_step', label: 'Cache At Step', type: 'number', step: 1, group: 'LTXA - 2-Pass Anchor' },
  { key: 'ltxa.second_pass_anchor_similarity_threshold', label: 'Similarity Threshold', type: 'number', step: 0.01, group: 'LTXA - 2-Pass Anchor' },
  { key: 'ltxa.second_pass_anchor_decay_with_distance', label: 'Decay With Distance', type: 'number', step: 0.01, group: 'LTXA - 2-Pass Anchor' },
  { key: 'ltxa.second_pass_anchor_energy_threshold', label: 'Energy Threshold', type: 'number', step: 0.01, group: 'LTXA - 2-Pass Anchor' },
  { key: 'ltxa.second_pass_anchor_bypass', label: 'Bypass', type: 'boolean', group: 'LTXA - 2-Pass Anchor' },
  { key: 'ltxa.second_pass_anchor_debug', label: 'Debug', type: 'boolean', group: 'LTXA - 2-Pass Anchor' },
  { key: 'ltxa.second_pass_anchor_advanced_mode', label: 'Advanced Mode', type: 'boolean', group: 'LTXA - 2-Pass Anchor' },
  { key: 'ltxa.second_pass_anchor_cache_mode', label: 'Cache Mode', type: 'nodeOption', group: 'LTXA - 2-Pass Anchor', nodeQuery: 'second_pass_anchor_cache_mode:LTXLatentAnchorAware:cache_mode' },
  { key: 'ltxa.second_pass_anchor_forwards_per_step', label: 'Forwards Per Step', type: 'number', step: 1, group: 'LTXA - 2-Pass Anchor' },
  { key: 'ltxa.second_pass_anchor_cache_warmup', label: 'Cache Warmup', type: 'number', step: 1, group: 'LTXA - 2-Pass Anchor' },
  { key: 'ltxa.second_pass_anchor_frame', label: 'Anchor Frame', type: 'number', step: 1, group: 'LTXA - 2-Pass Anchor' },
  { key: 'ltxa.second_pass_anchor_depth_curve', label: 'Depth Curve', type: 'nodeOption', group: 'LTXA - 2-Pass Anchor', nodeQuery: 'second_pass_anchor_depth_curve:LTXLatentAnchorAware:depth_curve' },
  { key: 'ltxa.second_pass_anchor_block_index_filter', label: 'Block Index Filter', type: 'string', group: 'LTXA - 2-Pass Anchor', monoFont: true },

  { key: 'ltxa.sage_attention', label: 'Sage Attention', type: 'nodeOption', group: 'LTXA - Sage Attention', nodeQuery: 'sage_attention:PathchSageAttentionKJ:sage_attention' },
  { key: 'ltxa.sage_allow_compile', label: 'Allow Compile', type: 'boolean', group: 'LTXA - Sage Attention' },
  { key: 'ltxa.memory_sage_triton_kernels', label: 'Memory Sage Triton Kernels', type: 'boolean', group: 'LTXA - Model Patch' },
  { key: 'ltxa.torch_fp16_accumulation', label: 'Torch FP16 Accumulation', type: 'boolean', group: 'LTXA - Model Patch' },
  { key: 'ltxa.chunk_feed_forward_dim_threshold', label: 'Chunk Dim Threshold', type: 'number', step: 1, group: 'LTXA - Model Patch' },
  { key: 'ltxa.attention_tuner_video_scale', label: 'Video Scale', type: 'number', step: 0.01, group: 'LTXA - Attention Tuner' },
  { key: 'ltxa.attention_tuner_video_to_audio_scale', label: 'Video To Audio Scale', type: 'number', step: 0.01, group: 'LTXA - Attention Tuner' },
  { key: 'ltxa.attention_tuner_audio_scale', label: 'Audio Scale', type: 'number', step: 0.01, group: 'LTXA - Attention Tuner' },
  { key: 'ltxa.attention_tuner_audio_to_video_scale', label: 'Audio To Video Scale', type: 'number', step: 0.01, group: 'LTXA - Attention Tuner' },
  { key: 'ltxa.attention_tuner_blocks', label: 'Blocks', type: 'string', group: 'LTXA - Attention Tuner', monoFont: true },
  { key: 'ltxa.attention_tuner_triton_kernels', label: 'Triton Kernels', type: 'boolean', group: 'LTXA - Attention Tuner' },

  { key: 'ltxa.rtx_enabled', label: 'RTX Upscale', type: 'boolean', group: 'LTXA - RTX Postprocess' },
  { key: 'ltxa.rtx_resize_type', label: 'Resize Type', type: 'nodeOption', group: 'LTXA - RTX Postprocess', nodeQuery: 'rtx_resize_type:RTXVideoSuperResolution:resize_type' },
  { key: 'ltxa.rtx_scale', label: 'Scale', type: 'number', step: 0.1, group: 'LTXA - RTX Postprocess' },
  { key: 'ltxa.rtx_quality', label: 'Quality', type: 'nodeOption', group: 'LTXA - RTX Postprocess', nodeQuery: 'rtx_quality:RTXVideoSuperResolution:quality' },

  { key: 'ltxa.multimodal_video_cfg', label: 'Video CFG', type: 'number', step: 0.01, group: 'LTXA - Multimodal CFG' },
  { key: 'ltxa.multimodal_audio_cfg', label: 'Audio CFG', type: 'number', step: 0.01, group: 'LTXA - Multimodal CFG' },
  { key: 'ltxa.multimodal_inactive_cfg', label: 'Inactive CFG', type: 'number', step: 0.01, group: 'LTXA - Multimodal CFG' },
  { key: 'ltxa.multimodal_active_steps', label: 'Active Steps', type: 'number', step: 1, group: 'LTXA - Multimodal CFG' },

  { key: 'ltxa.id_lora_enabled', label: 'Enabled', type: 'boolean', group: 'LTXA - ID LoRA' },
  { key: 'ltxa.id_lora_name', label: 'Name', type: 'nodeOption', group: 'LTXA - ID LoRA', nodeQuery: 'id_lora_name:LTX2LoraLoaderAdvanced:lora_name:LTX/' },
  { key: 'ltxa.id_lora_strength', label: 'Strength', type: 'number', step: 0.01, group: 'LTXA - ID LoRA' },
  { key: 'ltxa.id_lora_video', label: 'Video', type: 'number', step: 0.01, group: 'LTXA - ID LoRA' },
  { key: 'ltxa.id_lora_video_to_audio', label: 'Video To Audio', type: 'number', step: 0.01, group: 'LTXA - ID LoRA' },
  { key: 'ltxa.id_lora_audio', label: 'Audio', type: 'number', step: 0.01, group: 'LTXA - ID LoRA' },
  { key: 'ltxa.id_lora_audio_to_video', label: 'Audio To Video', type: 'number', step: 0.01, group: 'LTXA - ID LoRA' },
  { key: 'ltxa.id_lora_other', label: 'Other', type: 'number', step: 0.01, group: 'LTXA - ID LoRA' },

  { key: 'ltxa.video_crf', label: 'CRF', type: 'number', step: 1, group: 'LTXA - Output' },
  { key: 'ltxa.video_format', label: 'Format', type: 'nodeOption', group: 'LTXA - Output', nodeQuery: 'video_format:VHS_VideoCombine:format' },
  { key: 'ltxa.video_pix_fmt', label: 'Pixel Format', type: 'nodeOption', group: 'LTXA - Output', nodeQuery: 'video_pix_fmt:VHS_VideoCombine:pix_fmt' },
];

function LtxaLoRACopyButton() {
  const [loras, setLoras] = useState<string[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    apiClient.get<{ loras: string[] }>('/api/comfyui/loras?model=ltxa')
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

function LtxaHeaderExtra() {
  return (
    <div className="flex items-center gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <ListPlus className="h-4 w-4 mr-1" />
            LoRA 체인
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[80vw] h-[90vh] max-w-[80vw] sm:max-w-[80vw] overflow-y-auto flex flex-col items-stretch justify-start">
          <DialogHeader>
            <DialogTitle>LTXA LoRA 체인 관리</DialogTitle>
          </DialogHeader>
          <LtxLoraChainDialog category="ltxa" settingsPrefix="ltxa" />
        </DialogContent>
      </Dialog>
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
      <LtxaLoRACopyButton />
    </div>
  );
}

export default function LtxaSettingsTab() {
  return (
    <ModelSettingsTab
      title="LTXA 설정"
      category="ltxa"
      fields={LTXA_FIELDS}
      headerExtra={<LtxaHeaderExtra />}
    />
  );
}
