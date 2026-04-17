import { prisma } from '@/lib/database/prisma'

type SeedType = 'string' | 'number' | 'boolean'

export const LTX_SEED: Array<{ key: string; value: string; type: SeedType }> = [
  { key: 'ltx.unet', value: 'test-ltx-unet.safetensors', type: 'string' },
  { key: 'ltx.weight_dtype', value: 'default', type: 'string' },
  { key: 'ltx.audio_vae', value: 'test-ltx-audio-vae.safetensors', type: 'string' },
  { key: 'ltx.video_vae', value: 'test-ltx-video-vae.safetensors', type: 'string' },
  { key: 'ltx.clip_gguf', value: 'test-ltx-clip-gguf.safetensors', type: 'string' },
  { key: 'ltx.clip_embeddings', value: 'test-ltx-clip-embeddings.safetensors', type: 'string' },
  { key: 'ltx.sampler', value: 'linear/euler', type: 'string' },
  { key: 'ltx.clown_eta', value: '0.25', type: 'number' },
  { key: 'ltx.clown_bongmath', value: 'true', type: 'boolean' },
  { key: 'ltx.img_compression', value: '5', type: 'number' },
  { key: 'ltx.negative_prompt', value: 'test negative', type: 'string' },
  { key: 'ltx.frame_rate', value: '16', type: 'number' },
  { key: 'ltx.megapixels', value: '0.8', type: 'number' },
  { key: 'ltx.resize_multiple_of', value: '32', type: 'number' },
  { key: 'ltx.resize_upscale_method', value: 'lanczos', type: 'string' },
  { key: 'ltx.scheduler_steps', value: '10', type: 'number' },
  { key: 'ltx.scheduler_max_shift', value: '2.05', type: 'number' },
  { key: 'ltx.scheduler_base_shift', value: '0.95', type: 'number' },
  { key: 'ltx.scheduler_stretch', value: 'true', type: 'boolean' },
  { key: 'ltx.scheduler_terminal', value: '0.1', type: 'number' },
  { key: 'ltx.nag_scale', value: '5', type: 'number' },
  { key: 'ltx.nag_alpha', value: '0.25', type: 'number' },
  { key: 'ltx.nag_tau', value: '2.373', type: 'number' },
  { key: 'ltx.audio_norm_enabled', value: 'true', type: 'boolean' },
  { key: 'ltx.audio_norm', value: '1,1,0.7,1,1,0.7,1,1,1,1', type: 'string' },
  { key: 'ltx.identity_guidance_scale', value: '2.3', type: 'number' },
  { key: 'ltx.identity_start_percent', value: '0', type: 'number' },
  { key: 'ltx.identity_end_percent', value: '1', type: 'number' },
  { key: 'ltx.distilled_lora_enabled', value: 'false', type: 'boolean' },
  { key: 'ltx.distilled_lora_name', value: 'test-distilled.safetensors', type: 'string' },
  { key: 'ltx.distilled_lora_strength', value: '0.5', type: 'number' },
  { key: 'ltx.id_lora_name', value: 'test-id-lora.safetensors', type: 'string' },
  { key: 'ltx.id_lora_strength', value: '0.68', type: 'number' },
  { key: 'ltx.rtx_enabled', value: 'true', type: 'boolean' },
  { key: 'ltx.rtx_resize_type', value: 'scale by multiplier', type: 'string' },
  { key: 'ltx.rtx_scale', value: '1.5', type: 'number' },
  { key: 'ltx.rtx_quality', value: 'ULTRA', type: 'string' },
  { key: 'ltx.video_crf', value: '20', type: 'number' },
  { key: 'ltx.video_format', value: 'video/h264-mp4', type: 'string' },
  { key: 'ltx.video_pix_fmt', value: 'yuv420p', type: 'string' },
  { key: 'ltx.duration_options', value: '5,6,7', type: 'string' },
]

export async function seedLtx(): Promise<void> {
  await prisma.systemSetting.createMany({
    data: LTX_SEED.map((row) => ({
      key: row.key,
      value: row.value,
      type: row.type,
      category: 'ltx',
    })),
  })
}
