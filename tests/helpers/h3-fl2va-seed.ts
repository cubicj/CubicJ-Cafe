import { prisma } from '@/lib/database/prisma'

type SeedType = 'string' | 'number' | 'boolean'

export const H3_FL2VA_SEED: Array<{ key: string; value: string; type: SeedType }> = [
  { key: 'h3-fl2va.enabled', value: 'true', type: 'boolean' },
  { key: 'h3-fl2va.unet', value: 'test-h3-unet.safetensors', type: 'string' },
  { key: 'h3-fl2va.unet_weight_dtype', value: 'fake-weight-dtype', type: 'string' },
  { key: 'h3-fl2va.clip_name', value: 'test-h3-clip.safetensors', type: 'string' },
  { key: 'h3-fl2va.clip_type', value: 'test-clip-type', type: 'string' },
  { key: 'h3-fl2va.clip_device', value: 'fake-clip-device', type: 'string' },
  { key: 'h3-fl2va.video_vae', value: 'test-h3-video-vae.safetensors', type: 'string' },
  { key: 'h3-fl2va.audio_vae', value: 'test-h3-audio-vae.safetensors', type: 'string' },
  { key: 'h3-fl2va.steps', value: '4', type: 'number' },
  { key: 'h3-fl2va.sampler', value: 'fake-sampler', type: 'string' },
  { key: 'h3-fl2va.scheduler', value: 'fake-scheduler', type: 'string' },
  { key: 'h3-fl2va.shift_video', value: '7', type: 'number' },
  { key: 'h3-fl2va.shift_audio', value: '2', type: 'number' },
  { key: 'h3-fl2va.sage_attention', value: 'test-sage-mode', type: 'string' },
  { key: 'h3-fl2va.sage_allow_compile', value: 'false', type: 'boolean' },
  { key: 'h3-fl2va.low_vram_head_chunks', value: '5', type: 'number' },
  { key: 'h3-fl2va.chunk_feedforward_enabled', value: 'true', type: 'boolean' },
  { key: 'h3-fl2va.chunk_feedforward_chunks', value: '3', type: 'number' },
  { key: 'h3-fl2va.chunk_feedforward_min_len', value: '1024', type: 'number' },
  { key: 'h3-fl2va.megapixels', value: '0.61', type: 'number' },
  { key: 'h3-fl2va.second_pass_megapixels', value: '0.83', type: 'number' },
  { key: 'h3-fl2va.split_step', value: '6', type: 'number' },
  { key: 'h3-fl2va.manual_sigmas', value: '0.93, 0.47, 0.02', type: 'string' },
  { key: 'h3-fl2va.upscaler_model', value: 'fake-h3-upscaler-z9.pth', type: 'string' },
  { key: 'h3-fl2va.upscaler_align', value: '48', type: 'number' },
  { key: 'h3-fl2va.upscaler_chunking', value: 'true', type: 'boolean' },
  { key: 'h3-fl2va.upscaler_device', value: 'fake-device-x', type: 'string' },
  { key: 'h3-fl2va.upscaler_precision', value: 'fake-precision-y', type: 'string' },
  { key: 'h3-fl2va.resize_multiple_of', value: '16', type: 'number' },
  { key: 'h3-fl2va.resize_upscale_method', value: 'fake-resize-method', type: 'string' },
  { key: 'h3-fl2va.duration_options', value: '5,7', type: 'string' },
  { key: 'h3-fl2va.frames_per_step', value: '10', type: 'number' },
  { key: 'h3-fl2va.frame_base', value: '3', type: 'number' },
  { key: 'h3-fl2va.frame_rate', value: '10', type: 'number' },
  { key: 'h3-fl2va.video_crf', value: '18', type: 'number' },
  { key: 'h3-fl2va.video_format', value: 'fake-video-format', type: 'string' },
  { key: 'h3-fl2va.video_pix_fmt', value: 'fake-pix-format', type: 'string' },
  { key: 'h3-fl2va.rtx_enabled', value: 'true', type: 'boolean' },
  { key: 'h3-fl2va.rtx_resize_type', value: 'fake-resize-type', type: 'string' },
  { key: 'h3-fl2va.rtx_scale', value: '1.7', type: 'number' },
  { key: 'h3-fl2va.rtx_quality', value: 'fake-quality', type: 'string' },
]

export async function seedH3Fl2va(): Promise<void> {
  await prisma.systemSetting.createMany({ data: H3_FL2VA_SEED.map((row) => ({ key: row.key, value: row.value, type: row.type, category: 'h3-fl2va' })) })
}
