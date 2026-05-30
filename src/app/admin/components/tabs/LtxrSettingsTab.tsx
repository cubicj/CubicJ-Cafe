'use client';

import { useEffect, useRef, useState } from 'react';
import { ListPlus, Music, Upload } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api-client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ModelSettingsTab, { type SettingsField } from './ModelSettingsTab';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import AudioPresetAdminManager from '@/components/audio/AudioPresetAdminManager';
import LtxrLoraChainDialog from '@/app/admin/components/ltx/LtxrLoraChainDialog';

interface WatermarkAssetMetadata {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
}

interface WatermarkResponse {
  asset: WatermarkAssetMetadata | null;
}

const LTXR_FIELDS: SettingsField[] = [
  { key: 'ltxr.end_image_enabled', label: 'End Image / Loop', type: 'boolean', group: '활성화' },

  { key: 'ltxr.checkpoint', label: 'Checkpoint', type: 'nodeOption', group: 'LTXR - Model', nodeQuery: 'checkpoint:CheckpointLoaderSimple:ckpt_name' },
  { key: 'ltxr.text_encoder', label: 'Text Encoder', type: 'nodeOption', group: 'LTXR - Model', nodeQuery: 'text_encoder:LTXAVTextEncoderLoader:text_encoder' },

  { key: 'ltxr.negative_prompt', label: 'Negative Prompt', type: 'textarea', group: 'LTXR - Prompts', monoFont: true },
  { key: 'ltxr.video_conditioning_prompt', label: 'Video Conditioning Prompt', type: 'textarea', group: 'LTXR - Prompts', monoFont: true },
  { key: 'ltxr.audio_conditioning_prompt', label: 'Audio Conditioning Prompt', type: 'textarea', group: 'LTXR - Prompts', monoFont: true },

  { key: 'ltxr.frame_rate', label: 'Frame Rate', type: 'number', step: 1, group: 'LTXR - Generation' },
  { key: 'ltxr.duration_options', label: 'N Options (CSV)', type: 'string', group: 'LTXR - Generation', monoFont: true },
  { key: 'ltxr.frame_base', label: 'Frame Base', type: 'number', step: 1, group: 'LTXR - Generation' },
  { key: 'ltxr.megapixels', label: 'Resolution (MP)', type: 'number', step: 0.01, group: 'LTXR - Generation' },
  { key: 'ltxr.resize_multiple_of', label: 'Resize Multiple Of', type: 'number', step: 1, group: 'LTXR - Generation' },
  { key: 'ltxr.resize_upscale_method', label: 'Resize Method', type: 'nodeOption', group: 'LTXR - Generation', nodeQuery: 'resize_upscale_method:ResizeImageToMegapixels:upscale_method' },
  { key: 'ltxr.preprocess_img_compression', label: 'Image Compression', type: 'number', step: 1, group: 'LTXR - Generation' },

  { key: 'ltxr.sampler', label: 'Sampler', type: 'nodeOption', group: 'LTXR - Sampler', nodeQuery: 'sampler:KSamplerSelect:sampler_name' },
  { key: 'ltxr.scheduler_steps', label: 'Steps', type: 'number', step: 1, group: 'LTXR - Scheduler' },
  { key: 'ltxr.scheduler_max_shift', label: 'Max Shift', type: 'number', step: 0.01, group: 'LTXR - Scheduler' },
  { key: 'ltxr.scheduler_base_shift', label: 'Base Shift', type: 'number', step: 0.01, group: 'LTXR - Scheduler' },
  { key: 'ltxr.scheduler_stretch', label: 'Stretch', type: 'boolean', group: 'LTXR - Scheduler' },
  { key: 'ltxr.scheduler_terminal', label: 'Terminal', type: 'number', step: 0.01, group: 'LTXR - Scheduler' },

  { key: 'ltxr.nag_scale', label: 'NAG Scale', type: 'number', step: 0.1, group: 'LTXR - NAG' },
  { key: 'ltxr.nag_alpha', label: 'NAG Alpha', type: 'number', step: 0.01, group: 'LTXR - NAG' },
  { key: 'ltxr.nag_tau', label: 'NAG Tau', type: 'number', step: 0.001, group: 'LTXR - NAG' },

  { key: 'ltxr.identity_guidance_scale', label: 'ID Guidance Scale', type: 'number', step: 0.1, group: 'LTXR - Reference Audio' },
  { key: 'ltxr.identity_start_percent', label: 'ID Start Percent', type: 'number', step: 0.01, group: 'LTXR - Reference Audio' },
  { key: 'ltxr.identity_end_percent', label: 'ID End Percent', type: 'number', step: 0.01, group: 'LTXR - Reference Audio' },

  { key: 'ltxr.guide_frame_index', label: 'Frame Index', type: 'number', step: 1, group: 'LTXR - Guide' },
  { key: 'ltxr.guide_strength', label: 'Strength', type: 'number', step: 0.01, group: 'LTXR - Guide' },
  { key: 'ltxr.guide_crf', label: 'CRF', type: 'number', step: 1, group: 'LTXR - Guide' },
  { key: 'ltxr.guide_blur_radius', label: 'Blur Radius', type: 'number', step: 1, group: 'LTXR - Guide' },
  { key: 'ltxr.guide_interpolation', label: 'Interpolation', type: 'nodeOption', group: 'LTXR - Guide', nodeQuery: 'guide_interpolation:LTXVAddGuideAdvanced:interpolation' },
  { key: 'ltxr.guide_crop', label: 'Crop', type: 'nodeOption', group: 'LTXR - Guide', nodeQuery: 'guide_crop:LTXVAddGuideAdvanced:crop' },

  { key: 'ltxr.anchor_strength', label: 'Strength', type: 'number', step: 0.01, group: 'LTXR - Anchor' },
  { key: 'ltxr.anchor_cache_at_step', label: 'Cache At Step', type: 'number', step: 1, group: 'LTXR - Anchor' },
  { key: 'ltxr.anchor_similarity_threshold', label: 'Similarity Threshold', type: 'number', step: 0.01, group: 'LTXR - Anchor' },
  { key: 'ltxr.anchor_decay_with_distance', label: 'Decay With Distance', type: 'number', step: 0.01, group: 'LTXR - Anchor' },
  { key: 'ltxr.anchor_energy_threshold', label: 'Energy Threshold', type: 'number', step: 0.01, group: 'LTXR - Anchor' },
  { key: 'ltxr.anchor_bypass', label: 'Bypass', type: 'boolean', group: 'LTXR - Anchor' },
  { key: 'ltxr.anchor_debug', label: 'Debug', type: 'boolean', group: 'LTXR - Anchor' },
  { key: 'ltxr.anchor_advanced_mode', label: 'Advanced Mode', type: 'boolean', group: 'LTXR - Anchor' },
  { key: 'ltxr.anchor_cache_mode', label: 'Cache Mode', type: 'nodeOption', group: 'LTXR - Anchor', nodeQuery: 'anchor_cache_mode:LTXLatentAnchorAware:cache_mode' },
  { key: 'ltxr.anchor_forwards_per_step', label: 'Forwards Per Step', type: 'number', step: 1, group: 'LTXR - Anchor' },
  { key: 'ltxr.anchor_cache_warmup', label: 'Cache Warmup', type: 'number', step: 1, group: 'LTXR - Anchor' },
  { key: 'ltxr.anchor_frame', label: 'Anchor Frame', type: 'number', step: 1, group: 'LTXR - Anchor' },
  { key: 'ltxr.anchor_depth_curve', label: 'Depth Curve', type: 'nodeOption', group: 'LTXR - Anchor', nodeQuery: 'anchor_depth_curve:LTXLatentAnchorAware:depth_curve' },
  { key: 'ltxr.anchor_block_index_filter', label: 'Block Index Filter', type: 'string', group: 'LTXR - Anchor', monoFont: true },

  { key: 'ltxr.latent_upscale_model', label: 'Latent Upscale Model', type: 'nodeOption', group: 'LTXR - 2-Pass', nodeQuery: 'latent_upscale_model:LatentUpscaleModelLoader:model_name' },
  { key: 'ltxr.text_attention_amplification', label: 'Text Attention Amplification', type: 'number', step: 0.01, group: 'LTXR - 2-Pass' },
  { key: 'ltxr.second_pass_cfg', label: 'Second Pass CFG', type: 'number', step: 0.01, group: 'LTXR - 2-Pass' },
  { key: 'ltxr.second_pass_sigmas', label: 'Second Pass Sigmas', type: 'string', group: 'LTXR - 2-Pass', monoFont: true },
  { key: 'ltxr.second_pass_upscale_method', label: 'Second Pass Upscale Method', type: 'nodeOption', group: 'LTXR - 2-Pass', nodeQuery: 'second_pass_upscale_method:ImageScaleBy:upscale_method' },
  { key: 'ltxr.second_pass_upscale_by', label: 'Second Pass Upscale By', type: 'number', step: 0.01, group: 'LTXR - 2-Pass' },
  { key: 'ltxr.second_pass_anchor_strength', label: 'Strength', type: 'number', step: 0.01, group: 'LTXR - 2-Pass Anchor' },
  { key: 'ltxr.second_pass_anchor_cache_at_step', label: 'Cache At Step', type: 'number', step: 1, group: 'LTXR - 2-Pass Anchor' },
  { key: 'ltxr.second_pass_anchor_similarity_threshold', label: 'Similarity Threshold', type: 'number', step: 0.01, group: 'LTXR - 2-Pass Anchor' },
  { key: 'ltxr.second_pass_anchor_decay_with_distance', label: 'Decay With Distance', type: 'number', step: 0.01, group: 'LTXR - 2-Pass Anchor' },
  { key: 'ltxr.second_pass_anchor_energy_threshold', label: 'Energy Threshold', type: 'number', step: 0.01, group: 'LTXR - 2-Pass Anchor' },
  { key: 'ltxr.second_pass_anchor_bypass', label: 'Bypass', type: 'boolean', group: 'LTXR - 2-Pass Anchor' },
  { key: 'ltxr.second_pass_anchor_debug', label: 'Debug', type: 'boolean', group: 'LTXR - 2-Pass Anchor' },
  { key: 'ltxr.second_pass_anchor_advanced_mode', label: 'Advanced Mode', type: 'boolean', group: 'LTXR - 2-Pass Anchor' },
  { key: 'ltxr.second_pass_anchor_cache_mode', label: 'Cache Mode', type: 'nodeOption', group: 'LTXR - 2-Pass Anchor', nodeQuery: 'second_pass_anchor_cache_mode:LTXLatentAnchorAware:cache_mode' },
  { key: 'ltxr.second_pass_anchor_forwards_per_step', label: 'Forwards Per Step', type: 'number', step: 1, group: 'LTXR - 2-Pass Anchor' },
  { key: 'ltxr.second_pass_anchor_cache_warmup', label: 'Cache Warmup', type: 'number', step: 1, group: 'LTXR - 2-Pass Anchor' },
  { key: 'ltxr.second_pass_anchor_frame', label: 'Anchor Frame', type: 'number', step: 1, group: 'LTXR - 2-Pass Anchor' },
  { key: 'ltxr.second_pass_anchor_depth_curve', label: 'Depth Curve', type: 'nodeOption', group: 'LTXR - 2-Pass Anchor', nodeQuery: 'second_pass_anchor_depth_curve:LTXLatentAnchorAware:depth_curve' },
  { key: 'ltxr.second_pass_anchor_block_index_filter', label: 'Block Index Filter', type: 'string', group: 'LTXR - 2-Pass Anchor', monoFont: true },

  { key: 'ltxr.sage_attention', label: 'Sage Attention', type: 'nodeOption', group: 'LTXR - Sage Attention', nodeQuery: 'sage_attention:PathchSageAttentionKJ:sage_attention' },
  { key: 'ltxr.sage_allow_compile', label: 'Allow Compile', type: 'boolean', group: 'LTXR - Sage Attention' },

  { key: 'ltxr.rtx_enabled', label: 'RTX Upscale', type: 'boolean', group: 'LTXR - RTX Postprocess' },
  { key: 'ltxr.rtx_resize_type', label: 'Resize Type', type: 'nodeOption', group: 'LTXR - RTX Postprocess', nodeQuery: 'rtx_resize_type:RTXVideoSuperResolution:resize_type' },
  { key: 'ltxr.rtx_scale', label: 'Scale', type: 'number', step: 0.1, group: 'LTXR - RTX Postprocess' },
  { key: 'ltxr.rtx_quality', label: 'Quality', type: 'nodeOption', group: 'LTXR - RTX Postprocess', nodeQuery: 'rtx_quality:RTXVideoSuperResolution:quality' },

  { key: 'ltxr.multimodal_video_cfg', label: 'Video CFG', type: 'number', step: 0.01, group: 'LTXR - Multimodal CFG' },
  { key: 'ltxr.multimodal_audio_cfg', label: 'Audio CFG', type: 'number', step: 0.01, group: 'LTXR - Multimodal CFG' },
  { key: 'ltxr.multimodal_inactive_cfg', label: 'Inactive CFG', type: 'number', step: 0.01, group: 'LTXR - Multimodal CFG' },
  { key: 'ltxr.multimodal_active_steps', label: 'Active Steps', type: 'number', step: 1, group: 'LTXR - Multimodal CFG' },

  { key: 'ltxr.id_lora_enabled', label: 'Enabled', type: 'boolean', group: 'LTXR - ID LoRA' },
  { key: 'ltxr.id_lora_name', label: 'Name', type: 'nodeOption', group: 'LTXR - ID LoRA', nodeQuery: 'id_lora_name:LTX2LoraLoaderAdvanced:lora_name:LTX/' },
  { key: 'ltxr.id_lora_strength', label: 'Strength', type: 'number', step: 0.01, group: 'LTXR - ID LoRA' },
  { key: 'ltxr.id_lora_video', label: 'Video', type: 'number', step: 0.01, group: 'LTXR - ID LoRA' },
  { key: 'ltxr.id_lora_video_to_audio', label: 'Video To Audio', type: 'number', step: 0.01, group: 'LTXR - ID LoRA' },
  { key: 'ltxr.id_lora_audio', label: 'Audio', type: 'number', step: 0.01, group: 'LTXR - ID LoRA' },
  { key: 'ltxr.id_lora_audio_to_video', label: 'Audio To Video', type: 'number', step: 0.01, group: 'LTXR - ID LoRA' },
  { key: 'ltxr.id_lora_other', label: 'Other', type: 'number', step: 0.01, group: 'LTXR - ID LoRA' },

  { key: 'ltxr.video_crf', label: 'CRF', type: 'number', step: 1, group: 'LTXR - Output' },
  { key: 'ltxr.video_format', label: 'Format', type: 'nodeOption', group: 'LTXR - Output', nodeQuery: 'video_format:VHS_VideoCombine:format' },
  { key: 'ltxr.video_pix_fmt', label: 'Pixel Format', type: 'nodeOption', group: 'LTXR - Output', nodeQuery: 'video_pix_fmt:VHS_VideoCombine:pix_fmt' },

  { key: 'ltxr.watermark_enabled', label: 'Enabled', type: 'boolean', group: 'LTXR - Watermark' },
  { key: 'ltxr.watermark_position', label: 'Position', type: 'nodeOption', group: 'LTXR - Watermark', nodeQuery: 'watermark_position:ImageCompositeWatermark:position' },
  { key: 'ltxr.watermark_scale', label: 'Scale', type: 'number', step: 1, group: 'LTXR - Watermark' },
  { key: 'ltxr.watermark_transparency', label: 'Transparency', type: 'number', step: 1, group: 'LTXR - Watermark' },
];

function formatBytes(size: number): string {
  if (!Number.isFinite(size)) return '0 B';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function WatermarkUploadSection() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [asset, setAsset] = useState<WatermarkAssetMetadata | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiClient.get<WatermarkResponse>('/api/admin/ltxr/watermark');
        setAsset(data.asset);
      } catch {
        setMessage({ type: 'error', text: '워터마크 정보를 불러오지 못했습니다.' });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setMessage(null);
    try {
      const form = new FormData();
      form.set('file', file);
      const data = await apiClient.postFormData<WatermarkResponse>('/api/admin/ltxr/watermark', form);
      setAsset(data.asset);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      setMessage({ type: 'success', text: '워터마크가 업로드되었습니다.' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      const text = error instanceof ApiError ? error.errorMessage : '워터마크 업로드에 실패했습니다.';
      setMessage({ type: 'error', text });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold">LTXR 워터마크 이미지</h3>
        <p className="text-sm text-muted-foreground">
          PNG, JPG, WEBP 파일을 업로드하면 현재 LTXR 워터마크 자산으로 저장됩니다.
        </p>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-md border p-3 text-sm">
        {loading ? (
          <span className="text-muted-foreground">워터마크 정보 불러오는 중...</span>
        ) : asset ? (
          <div className="grid gap-1 md:grid-cols-3">
            <div>
              <span className="text-muted-foreground">파일명</span>
              <div className="font-mono text-xs break-all">{asset.filename}</div>
            </div>
            <div>
              <span className="text-muted-foreground">MIME</span>
              <div className="font-mono text-xs">{asset.mimeType}</div>
            </div>
            <div>
              <span className="text-muted-foreground">크기</span>
              <div className="font-mono text-xs">{formatBytes(asset.size)}</div>
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">업로드된 워터마크가 없습니다.</span>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <div className="space-y-1">
          <Label htmlFor="ltxr-watermark-file">워터마크 파일</Label>
          <Input
            id="ltxr-watermark-file"
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            disabled={uploading}
          />
        </div>
        <Button onClick={handleUpload} disabled={!file || uploading}>
          <Upload className="h-4 w-4 mr-1" />
          {uploading ? '업로드 중...' : '업로드'}
        </Button>
      </div>
    </Card>
  );
}

function LtxrHeaderExtra() {
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
            <DialogTitle>LTXR LoRA 체인 관리</DialogTitle>
          </DialogHeader>
          <LtxrLoraChainDialog />
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
    </div>
  );
}

export default function LtxrSettingsTab() {
  return (
    <div className="space-y-4">
      <WatermarkUploadSection />
      <ModelSettingsTab
        title="LTXR 설정"
        category="ltxr"
        fields={LTXR_FIELDS}
        headerExtra={<LtxrHeaderExtra />}
      />
    </div>
  );
}
