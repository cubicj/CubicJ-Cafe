export const H3_REF2VA = {
  SIGMA_SHIFT: '1',
  REFERENCE_TO_VIDEO: '4',
  UNET_LOADER: '7',
  TURBO_LORA: '8',
  CHUNK_FEEDFORWARD: '52',
  AUDIO_VAE_LOADER: '15',
  VIDEO_VAE_LOADER: '16',
  CLIP_LOADER: '17',
  POSITIVE_PROMPT: '18',
  STEPS: '19',
  FRAME_MATH: '20',
  FRAME_N: '21',
  FPS: '22',
  GUIDER: '23',
  SAMPLER_ADVANCED: '24',
  RANDOM_NOISE: '25',
  SAMPLER_SELECT: '26',
  SCHEDULER: '27',
  SEPARATE_AV: '62',
  UNLOAD_POST_ENCODE: '29',
  UNLOAD_POST_SAMPLER: '30',
  VAE_DECODE: '31',
  VAE_DECODE_AUDIO: '32',
  RTX_SUPER_RES: '33',
  VIDEO_COMBINE: '34',
  UNLOAD_FINAL: '40',
  SAGE_PATCH: '43',
  LOW_VRAM_ATTN: '49',
  MEMEFF_SAGE: '50',
} as const;

export const H3_REF2VA_NO_VIDEO = {
  SIGMA_SHIFT: '1',
  REFERENCE_TO_VIDEO: '4',
  UNET_LOADER: '7',
  AUDIO_VAE_LOADER: '15',
  VIDEO_VAE_LOADER: '16',
  CLIP_LOADER: '17',
  POSITIVE_PROMPT: '18',
  STEPS: '19',
  FRAME_MATH: '20',
  FRAME_N: '21',
  FPS: '22',
  GUIDER: '23',
  SAMPLER_FIRST: '24',
  RANDOM_NOISE: '25',
  SAMPLER_SELECT: '26',
  SCHEDULER: '27',
  SEPARATE_AV_MID: '28',
  UNLOAD_POST_ENCODE: '29',
  UNLOAD_POST_SAMPLER: '30',
  VAE_DECODE: '31',
  VAE_DECODE_AUDIO: '32',
  RTX_SUPER_RES: '33',
  VIDEO_COMBINE: '34',
  UNLOAD_FINAL: '40',
  SAGE_PATCH: '43',
  LOW_VRAM_ATTN: '49',
  MEMEFF_SAGE: '50',
  CHUNK_FEEDFORWARD: '52',
  SPLIT_SIGMAS: '55',
  LATENT_UPSCALER: '57',
  CONCAT_AV: '58',
  SAMPLER_SECOND: '59',
  UNLOAD_MID: '61',
  SEPARATE_AV_FINAL: '62',
  MANUAL_SIGMAS: '66',
  SECOND_PASS_RESIZE: '71',
} as const;

export function refImageLoadId(slot: number): string {
  return String(100 + slot);
}

export function refImageResizeId(slot: number): string {
  return String(110 + slot);
}

export function refVideoLoadId(slot: number): string {
  return String(120 + slot);
}

export function refAudioLoadId(slot: number): string {
  return String(130 + slot);
}

export function refVideoResizeId(slot: number): string {
  return String(140 + slot);
}
