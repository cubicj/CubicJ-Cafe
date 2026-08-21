export const H3_REF2VA = {
  SIGMA_SHIFT: '1',
  FUSED_MODULATION: '3',
  REFERENCE_TO_VIDEO: '4',
  UNET_LOADER: '7',
  TURBO_LORA: '8',
  CHUNK_FEEDFORWARD: '9',
  SOL_ATTN: '11',
  ATTENTION_BACKEND: '12',
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
  SEPARATE_AV: '28',
  UNLOAD_POST_ENCODE: '29',
  UNLOAD_POST_SAMPLER: '30',
  VAE_DECODE: '31',
  VAE_DECODE_AUDIO: '32',
  RTX_SUPER_RES: '33',
  VIDEO_COMBINE: '34',
  UNLOAD_FINAL: '40',
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
