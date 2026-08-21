import { prisma } from '@/lib/database/prisma'

type SeedType = 'string' | 'number' | 'boolean'

export const H3_FL2VA_SEED: Array<{ key: string; value: string; type: SeedType }> = [
  { key: 'h3-fl2va.enabled', value: 'true', type: 'boolean' },
  { key: 'h3-fl2va.unet', value: 'test-h3-unet.safetensors', type: 'string' },
  { key: 'h3-fl2va.unet_weight_dtype', value: 'default', type: 'string' },
  { key: 'h3-fl2va.clip_name', value: 'test-h3-clip.safetensors', type: 'string' },
  { key: 'h3-fl2va.clip_type', value: 'test-clip-type', type: 'string' },
  { key: 'h3-fl2va.clip_device', value: 'default', type: 'string' },
  { key: 'h3-fl2va.video_vae', value: 'test-h3-video-vae.safetensors', type: 'string' },
  { key: 'h3-fl2va.audio_vae', value: 'test-h3-audio-vae.safetensors', type: 'string' },
  { key: 'h3-fl2va.turbo_lora', value: 'test-h3-lora.safetensors', type: 'string' },
  { key: 'h3-fl2va.turbo_lora_strength', value: '0.9', type: 'number' },
  { key: 'h3-fl2va.steps', value: '4', type: 'number' },
  { key: 'h3-fl2va.sampler', value: 'euler', type: 'string' },
  { key: 'h3-fl2va.scheduler', value: 'simple', type: 'string' },
  { key: 'h3-fl2va.shift_video', value: '7', type: 'number' },
  { key: 'h3-fl2va.shift_audio', value: '2', type: 'number' },
  { key: 'h3-fl2va.attention_backend', value: 'test attention', type: 'string' },
  { key: 'h3-fl2va.fused_modulation', value: 'true', type: 'boolean' },
  { key: 'h3-fl2va.chunk_feedforward_enabled', value: 'true', type: 'boolean' },
  { key: 'h3-fl2va.chunk_feedforward_chunks', value: '3', type: 'number' },
  { key: 'h3-fl2va.chunk_feedforward_min_len', value: '1024', type: 'number' },
  { key: 'h3-fl2va.sol_attn_enabled', value: 'false', type: 'boolean' },
  { key: 'h3-fl2va.sol_attn_tau_start', value: '0.7', type: 'number' },
  { key: 'h3-fl2va.sol_attn_tau_end', value: '0.3', type: 'number' },
  { key: 'h3-fl2va.sol_attn_curve', value: 'test-curve', type: 'string' },
  { key: 'h3-fl2va.sol_attn_min_len', value: '111', type: 'number' },
  { key: 'h3-fl2va.sol_attn_strict', value: 'true', type: 'boolean' },
  { key: 'h3-fl2va.sol_attn_dense_percent', value: '37.5', type: 'number' },
  { key: 'h3-fl2va.sol_attn_thresh_type', value: 'test-thresh', type: 'string' },
  { key: 'h3-fl2va.sol_attn_int8_qk', value: 'false', type: 'boolean' },
  { key: 'h3-fl2va.sol_attn_int8_pv', value: 'true', type: 'boolean' },
  { key: 'h3-fl2va.sol_attn_sink_conditioning', value: 'test-sink', type: 'string' },
  { key: 'h3-fl2va.sol_attn_dense_blocks', value: '2,5,9', type: 'string' },
  { key: 'h3-fl2va.megapixels', value: '0.5', type: 'number' },
  { key: 'h3-fl2va.megapixels_last', value: '0.4', type: 'number' },
  { key: 'h3-fl2va.resize_multiple_of', value: '16', type: 'number' },
  { key: 'h3-fl2va.resize_upscale_method', value: 'lanczos', type: 'string' },
  { key: 'h3-fl2va.duration_options', value: '5,7', type: 'string' },
  { key: 'h3-fl2va.frames_per_step', value: '10', type: 'number' },
  { key: 'h3-fl2va.frame_base', value: '3', type: 'number' },
  { key: 'h3-fl2va.frame_rate', value: '10', type: 'number' },
  { key: 'h3-fl2va.video_crf', value: '18', type: 'number' },
  { key: 'h3-fl2va.video_format', value: 'video/h264-mp4', type: 'string' },
  { key: 'h3-fl2va.video_pix_fmt', value: 'yuv420p', type: 'string' },
  { key: 'h3-fl2va.rtx_enabled', value: 'true', type: 'boolean' },
  { key: 'h3-fl2va.rtx_resize_type', value: 'scale by multiplier', type: 'string' },
  { key: 'h3-fl2va.rtx_scale', value: '2', type: 'number' },
  { key: 'h3-fl2va.rtx_quality', value: 'HIGH', type: 'string' },
]

export async function seedH3Fl2va(): Promise<void> {
  await prisma.systemSetting.createMany({
    data: H3_FL2VA_SEED.map((row) => ({
      key: row.key,
      value: row.value,
      type: row.type,
      category: 'h3-fl2va',
    })),
  })
}
