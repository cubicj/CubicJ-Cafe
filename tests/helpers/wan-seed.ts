import { prisma } from '@/lib/database/prisma'

type SeedType = 'string' | 'number' | 'boolean'

export const WAN_SEED: Array<{ key: string; value: string; type: SeedType }> = [
  { key: 'wan.wanvideo_model_high', value: 'test-wan-high.safetensors', type: 'string' },
  { key: 'wan.wanvideo_model_low', value: 'test-wan-low.safetensors', type: 'string' },
  { key: 'wan.t5_encoder', value: 'test-t5.safetensors', type: 'string' },
  { key: 'wan.wanvideo_vae', value: 'test-wan-vae.safetensors', type: 'string' },
  { key: 'wan.clip_vision_model', value: 'test-clip-vision.safetensors', type: 'string' },
  { key: 'wan.base_precision', value: 'bf16', type: 'string' },
  { key: 'wan.quantization', value: 'fp8_e4m3fn_fast', type: 'string' },
  { key: 'wan.attention_mode', value: 'sageattn', type: 'string' },
  { key: 'wan.blocks_to_swap', value: '20', type: 'number' },
  { key: 'wan.offload_img_emb', value: 'false', type: 'boolean' },
  { key: 'wan.offload_txt_emb', value: 'false', type: 'boolean' },
  { key: 'wan.vace_blocks_to_swap', value: '0', type: 'number' },
  { key: 'wan.prefetch_blocks', value: '1', type: 'number' },
  { key: 'wan.context_frames', value: '81', type: 'number' },
  { key: 'wan.context_stride', value: '4', type: 'number' },
  { key: 'wan.context_overlap', value: '32', type: 'number' },
  { key: 'wan.fuse_method', value: 'pyramid', type: 'string' },
  { key: 'wan.sampler_steps', value: '2', type: 'number' },
  { key: 'wan.shift', value: '5', type: 'number' },
  { key: 'wan.scheduler', value: 'euler', type: 'string' },
  { key: 'wan.sigmas_high', value: '1.0, 0.9375, 0.875', type: 'string' },
  { key: 'wan.sigmas_low', value: '0.875, 0.4375, 0.0', type: 'string' },
  { key: 'wan.megapixels', value: '0.66', type: 'number' },
  { key: 'wan.resize_multiple_of', value: '16', type: 'number' },
  { key: 'wan.resize_upscale_method', value: 'lanczos', type: 'string' },
  { key: 'wan.nag_scale', value: '5', type: 'number' },
  { key: 'wan.nag_alpha', value: '0.25', type: 'number' },
  { key: 'wan.nag_tau', value: '2.4', type: 'number' },
  { key: 'wan.rtx_enabled', value: 'true', type: 'boolean' },
  { key: 'wan.rtx_resize_type', value: 'scale by multiplier', type: 'string' },
  { key: 'wan.rtx_scale', value: '1.5', type: 'number' },
  { key: 'wan.rtx_quality', value: 'ULTRA', type: 'string' },
  { key: 'wan.frame_rate', value: '16', type: 'number' },
  { key: 'wan.video_crf', value: '20', type: 'number' },
  { key: 'wan.video_format', value: 'video/h264-mp4', type: 'string' },
  { key: 'wan.video_pix_fmt', value: 'yuv420p', type: 'string' },
  { key: 'wan.negative_prompt', value: 'test negative', type: 'string' },
  { key: 'wan.duration_options', value: '5,6,7', type: 'string' },
]

export async function seedWan(): Promise<void> {
  await prisma.systemSetting.createMany({
    data: WAN_SEED.map((row) => ({
      key: row.key,
      value: row.value,
      type: row.type,
      category: 'wan',
    })),
  })
}
