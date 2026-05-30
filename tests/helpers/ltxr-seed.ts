import type { PrismaClient } from '@prisma/client'

type SeedValue = string | number | boolean | Array<unknown>
type SeedType = 'string' | 'number' | 'boolean' | 'json'

type SeedRow = {
  key: string
  value: SeedValue
  type: SeedType
}

export const LTXR_SEED: SeedRow[] = [
  { key: 'ltxr.enabled', value: false, type: 'boolean' },
  { key: 'ltxr.lora_enabled', value: false, type: 'boolean' },
  { key: 'ltxr.end_image_enabled', value: true, type: 'boolean' },
  { key: 'ltxr.checkpoint', value: 'fake-ltxr-checkpoint-v4n.safetensors', type: 'string' },
  { key: 'ltxr.text_encoder', value: 'fake-ltxr-text-encoder-b8q.safetensors', type: 'string' },
  { key: 'ltxr.negative_prompt', value: 'fake negative prompt r2x', type: 'string' },
  { key: 'ltxr.video_conditioning_prompt', value: 'fake video conditioning prompt k6p', type: 'string' },
  { key: 'ltxr.audio_conditioning_prompt', value: 'fake audio conditioning prompt c9w', type: 'string' },
  { key: 'ltxr.frame_rate', value: 19, type: 'number' },
  { key: 'ltxr.duration_options', value: '5,6,7', type: 'string' },
  { key: 'ltxr.frame_base', value: 11, type: 'number' },
  { key: 'ltxr.megapixels', value: 0.64, type: 'number' },
  { key: 'ltxr.resize_multiple_of', value: 32, type: 'number' },
  { key: 'ltxr.resize_upscale_method', value: 'fake-ltxr-resize-method', type: 'string' },
  { key: 'ltxr.preprocess_img_compression', value: '19', type: 'number' },
  { key: 'ltxr.sampler', value: 'fake-ltxr-sampler-p3d', type: 'string' },
  { key: 'ltxr.clown_eta', value: 0.21, type: 'number' },
  { key: 'ltxr.clown_bongmath', value: false, type: 'boolean' },
  { key: 'ltxr.scheduler_steps', value: 14, type: 'number' },
  { key: 'ltxr.scheduler_max_shift', value: 1.42, type: 'number' },
  { key: 'ltxr.scheduler_base_shift', value: 0.37, type: 'number' },
  { key: 'ltxr.scheduler_stretch', value: false, type: 'boolean' },
  { key: 'ltxr.scheduler_terminal', value: 0.29, type: 'number' },
  { key: 'ltxr.nag_scale', value: 3.2, type: 'number' },
  { key: 'ltxr.nag_alpha', value: 0.18, type: 'number' },
  { key: 'ltxr.nag_tau', value: 1.54, type: 'number' },
  { key: 'ltxr.identity_guidance_scale', value: 2.8, type: 'number' },
  { key: 'ltxr.identity_start_percent', value: 0.13, type: 'number' },
  { key: 'ltxr.identity_end_percent', value: 0.84, type: 'number' },
  { key: 'ltxr.guide_frame_index', value: 2, type: 'number' },
  { key: 'ltxr.guide_strength', value: 0.43, type: 'number' },
  { key: 'ltxr.guide_crf', value: 28, type: 'number' },
  { key: 'ltxr.guide_blur_radius', value: 4, type: 'number' },
  { key: 'ltxr.guide_interpolation', value: 'fake-ltxr-guide-interpolation', type: 'string' },
  { key: 'ltxr.guide_crop', value: 'fake-ltxr-guide-crop', type: 'string' },
  { key: 'ltxr.anchor_strength', value: 0.34, type: 'number' },
  { key: 'ltxr.anchor_cache_at_step', value: 5, type: 'number' },
  { key: 'ltxr.anchor_similarity_threshold', value: 0.61, type: 'number' },
  { key: 'ltxr.anchor_decay_with_distance', value: 0.23, type: 'number' },
  { key: 'ltxr.anchor_energy_threshold', value: 0.16, type: 'number' },
  { key: 'ltxr.anchor_bypass', value: true, type: 'boolean' },
  { key: 'ltxr.anchor_debug', value: false, type: 'boolean' },
  { key: 'ltxr.anchor_advanced_mode', value: true, type: 'boolean' },
  { key: 'ltxr.anchor_cache_mode', value: 'fake-ltxr-anchor-cache-mode', type: 'string' },
  { key: 'ltxr.anchor_forwards_per_step', value: 2, type: 'number' },
  { key: 'ltxr.anchor_cache_warmup', value: 7, type: 'number' },
  { key: 'ltxr.anchor_frame', value: 1, type: 'number' },
  { key: 'ltxr.anchor_depth_curve', value: 'fake-ltxr-anchor-depth-curve', type: 'string' },
  { key: 'ltxr.anchor_block_index_filter', value: 'fake-ltxr-block-filter-2,5,7', type: 'string' },
  { key: 'ltxr.latent_upscale_model', value: 'fake-ltxr-latent-upscaler-d6r.safetensors', type: 'string' },
  { key: 'ltxr.text_attention_amplification', value: 1.31, type: 'number' },
  { key: 'ltxr.multimodal_video_cfg', value: 2.36, type: 'number' },
  { key: 'ltxr.multimodal_audio_cfg', value: 4.68, type: 'number' },
  { key: 'ltxr.multimodal_inactive_cfg', value: 0.79, type: 'number' },
  { key: 'ltxr.multimodal_active_steps', value: 4, type: 'number' },
  { key: 'ltxr.second_pass_cfg', value: 1.24, type: 'number' },
  { key: 'ltxr.second_pass_sigmas', value: 'fake-ltxr-second-pass-sigmas-t5m', type: 'string' },
  { key: 'ltxr.second_pass_upscale_method', value: 'fake-ltxr-second-pass-upscale-method', type: 'string' },
  { key: 'ltxr.second_pass_upscale_by', value: 1.64, type: 'number' },
  { key: 'ltxr.second_pass_anchor_strength', value: 0.26, type: 'number' },
  { key: 'ltxr.second_pass_anchor_cache_at_step', value: 8, type: 'number' },
  { key: 'ltxr.second_pass_anchor_similarity_threshold', value: 0.57, type: 'number' },
  { key: 'ltxr.second_pass_anchor_decay_with_distance', value: 0.17, type: 'number' },
  { key: 'ltxr.second_pass_anchor_energy_threshold', value: 0.24, type: 'number' },
  { key: 'ltxr.second_pass_anchor_bypass', value: false, type: 'boolean' },
  { key: 'ltxr.second_pass_anchor_debug', value: true, type: 'boolean' },
  { key: 'ltxr.second_pass_anchor_advanced_mode', value: true, type: 'boolean' },
  { key: 'ltxr.second_pass_anchor_cache_mode', value: 'fake-ltxr-second-pass-anchor-cache-mode', type: 'string' },
  { key: 'ltxr.second_pass_anchor_forwards_per_step', value: 3, type: 'number' },
  { key: 'ltxr.second_pass_anchor_cache_warmup', value: 10, type: 'number' },
  { key: 'ltxr.second_pass_anchor_frame', value: 2, type: 'number' },
  { key: 'ltxr.second_pass_anchor_depth_curve', value: 'fake-ltxr-second-pass-anchor-depth-curve', type: 'string' },
  { key: 'ltxr.second_pass_anchor_block_index_filter', value: 'fake-ltxr-second-pass-block-filter-1,4,6', type: 'string' },
  { key: 'ltxr.sage_attention', value: 'auto', type: 'string' },
  { key: 'ltxr.sage_allow_compile', value: false, type: 'boolean' },
  { key: 'ltxr.rtx_enabled', value: false, type: 'boolean' },
  { key: 'ltxr.rtx_resize_type', value: 'fake-ltxr-rtx-resize-type', type: 'string' },
  { key: 'ltxr.rtx_scale', value: 1.42, type: 'number' },
  { key: 'ltxr.rtx_quality', value: 'fake-ltxr-rtx-quality', type: 'string' },
  { key: 'ltxr.sfw_lora_chain', value: [], type: 'json' },
  { key: 'ltxr.id_lora_enabled', value: false, type: 'boolean' },
  { key: 'ltxr.id_lora_name', value: 'fake-ltxr-id-lora-n8v.safetensors', type: 'string' },
  { key: 'ltxr.id_lora_strength', value: 0.89, type: 'number' },
  { key: 'ltxr.id_lora_video', value: 0.49, type: 'number' },
  { key: 'ltxr.id_lora_video_to_audio', value: 0.5, type: 'number' },
  { key: 'ltxr.id_lora_audio', value: 0.51, type: 'number' },
  { key: 'ltxr.id_lora_audio_to_video', value: 0.52, type: 'number' },
  { key: 'ltxr.id_lora_other', value: 0.53, type: 'number' },
  { key: 'ltxr.video_crf', value: 30, type: 'number' },
  { key: 'ltxr.video_format', value: 'fake-ltxr-video-format', type: 'string' },
  { key: 'ltxr.video_pix_fmt', value: 'fake-ltxr-pix-fmt', type: 'string' },
  { key: 'ltxr.watermark_enabled', value: false, type: 'boolean' },
  { key: 'ltxr.watermark_image', value: '', type: 'string' },
  { key: 'ltxr.watermark_position', value: 'center', type: 'string' },
  { key: 'ltxr.watermark_scale', value: 80, type: 'number' },
  { key: 'ltxr.watermark_transparency', value: 50, type: 'number' },
]

function serializeValue(value: SeedValue): string {
  return typeof value === 'string' ? value : JSON.stringify(value)
}

export async function seedLtxrSettings(
  prisma: PrismaClient,
  overrides: Record<string, SeedValue> = {}
): Promise<void> {
  for (const row of LTXR_SEED) {
    const value = overrides[row.key] ?? row.value

    await prisma.systemSetting.upsert({
      where: { key: row.key },
      create: {
        key: row.key,
        value: serializeValue(value),
        type: row.type,
        category: 'ltxr',
      },
      update: {
        value: serializeValue(value),
        type: row.type,
      },
    })
  }
}
