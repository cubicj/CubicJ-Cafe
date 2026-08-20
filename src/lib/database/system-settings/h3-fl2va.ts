import { prisma } from '../prisma';
import {
  buildSettingsMap,
  parseLtxInteger,
  parseLtxNumber,
  parseLtxNumberList,
} from './common';

export interface H3Fl2vaSettings {
  unet: string;
  unetWeightDtype: string;
  clipName: string;
  clipType: string;
  clipDevice: string;
  videoVae: string;
  audioVae: string;
  turboLora: string;
  turboLoraStrength: number;
  steps: number;
  sampler: string;
  scheduler: string;
  shiftVideo: number;
  shiftAudio: number;
  attentionBackend: string;
  fusedModulation: boolean;
  chunkFeedforwardEnabled: boolean;
  chunkFeedforwardChunks: number;
  chunkFeedforwardMinTokens: number;
  solAttnEnabled: boolean;
  solAttnTauStart: number;
  solAttnTauEnd: number;
  solAttnCurve: string;
  solAttnMinTokens: number;
  solAttnStrict: boolean;
  solAttnDensePercent: number;
  solAttnThreshType: string;
  solAttnInt8Qk: boolean;
  solAttnInt8Pv: boolean;
  solAttnSinkConditioning: string;
  solAttnDenseBlocks: string;
  megapixels: number;
  megapixelsLast: number;
  resizeMultipleOf: number;
  resizeUpscaleMethod: string;
  durationOptions: number[];
  framesPerStep: number;
  frameBase: number;
  frameRate: number;
  videoCrf: number;
  videoFormat: string;
  videoPixFmt: string;
  rtxEnabled: boolean;
  rtxResizeType: string;
  rtxScale: number;
  rtxQuality: string;
}

export const H3_FL2VA_KEYS = {
  unet: 'h3-fl2va.unet',
  unetWeightDtype: 'h3-fl2va.unet_weight_dtype',
  clipName: 'h3-fl2va.clip_name',
  clipType: 'h3-fl2va.clip_type',
  clipDevice: 'h3-fl2va.clip_device',
  videoVae: 'h3-fl2va.video_vae',
  audioVae: 'h3-fl2va.audio_vae',
  turboLora: 'h3-fl2va.turbo_lora',
  turboLoraStrength: 'h3-fl2va.turbo_lora_strength',
  steps: 'h3-fl2va.steps',
  sampler: 'h3-fl2va.sampler',
  scheduler: 'h3-fl2va.scheduler',
  shiftVideo: 'h3-fl2va.shift_video',
  shiftAudio: 'h3-fl2va.shift_audio',
  attentionBackend: 'h3-fl2va.attention_backend',
  fusedModulation: 'h3-fl2va.fused_modulation',
  chunkFeedforwardEnabled: 'h3-fl2va.chunk_feedforward_enabled',
  chunkFeedforwardChunks: 'h3-fl2va.chunk_feedforward_chunks',
  chunkFeedforwardMinTokens: 'h3-fl2va.chunk_feedforward_min_tokens',
  solAttnEnabled: 'h3-fl2va.sol_attn_enabled',
  solAttnTauStart: 'h3-fl2va.sol_attn_tau_start',
  solAttnTauEnd: 'h3-fl2va.sol_attn_tau_end',
  solAttnCurve: 'h3-fl2va.sol_attn_curve',
  solAttnMinTokens: 'h3-fl2va.sol_attn_min_tokens',
  solAttnStrict: 'h3-fl2va.sol_attn_strict',
  solAttnDensePercent: 'h3-fl2va.sol_attn_dense_percent',
  solAttnThreshType: 'h3-fl2va.sol_attn_thresh_type',
  solAttnInt8Qk: 'h3-fl2va.sol_attn_int8_qk',
  solAttnInt8Pv: 'h3-fl2va.sol_attn_int8_pv',
  solAttnSinkConditioning: 'h3-fl2va.sol_attn_sink_conditioning',
  solAttnDenseBlocks: 'h3-fl2va.sol_attn_dense_blocks',
  megapixels: 'h3-fl2va.megapixels',
  megapixelsLast: 'h3-fl2va.megapixels_last',
  resizeMultipleOf: 'h3-fl2va.resize_multiple_of',
  resizeUpscaleMethod: 'h3-fl2va.resize_upscale_method',
  durationOptions: 'h3-fl2va.duration_options',
  framesPerStep: 'h3-fl2va.frames_per_step',
  frameBase: 'h3-fl2va.frame_base',
  frameRate: 'h3-fl2va.frame_rate',
  videoCrf: 'h3-fl2va.video_crf',
  videoFormat: 'h3-fl2va.video_format',
  videoPixFmt: 'h3-fl2va.video_pix_fmt',
  rtxEnabled: 'h3-fl2va.rtx_enabled',
  rtxResizeType: 'h3-fl2va.rtx_resize_type',
  rtxScale: 'h3-fl2va.rtx_scale',
  rtxQuality: 'h3-fl2va.rtx_quality',
} as const;

export async function getH3Fl2vaSettings(): Promise<H3Fl2vaSettings> {
  const keys = Object.values(H3_FL2VA_KEYS);
  const settings = await prisma.systemSetting.findMany({ where: { key: { in: keys } } });
  const map = buildSettingsMap(settings, H3_FL2VA_KEYS, [], [H3_FL2VA_KEYS.solAttnDenseBlocks]);
  const k = H3_FL2VA_KEYS;
  return {
    unet: map.get(k.unet)!,
    unetWeightDtype: map.get(k.unetWeightDtype)!,
    clipName: map.get(k.clipName)!,
    clipType: map.get(k.clipType)!,
    clipDevice: map.get(k.clipDevice)!,
    videoVae: map.get(k.videoVae)!,
    audioVae: map.get(k.audioVae)!,
    turboLora: map.get(k.turboLora)!,
    turboLoraStrength: parseLtxNumber(map, k.turboLoraStrength),
    steps: parseLtxInteger(map, k.steps),
    sampler: map.get(k.sampler)!,
    scheduler: map.get(k.scheduler)!,
    shiftVideo: parseLtxNumber(map, k.shiftVideo),
    shiftAudio: parseLtxNumber(map, k.shiftAudio),
    attentionBackend: map.get(k.attentionBackend)!,
    fusedModulation: map.get(k.fusedModulation)! === 'true',
    chunkFeedforwardEnabled: map.get(k.chunkFeedforwardEnabled)! === 'true',
    chunkFeedforwardChunks: parseLtxInteger(map, k.chunkFeedforwardChunks),
    chunkFeedforwardMinTokens: parseLtxInteger(map, k.chunkFeedforwardMinTokens),
    solAttnEnabled: map.get(k.solAttnEnabled)! === 'true',
    solAttnTauStart: parseLtxNumber(map, k.solAttnTauStart),
    solAttnTauEnd: parseLtxNumber(map, k.solAttnTauEnd),
    solAttnCurve: map.get(k.solAttnCurve)!,
    solAttnMinTokens: parseLtxInteger(map, k.solAttnMinTokens),
    solAttnStrict: map.get(k.solAttnStrict)! === 'true',
    solAttnDensePercent: parseLtxNumber(map, k.solAttnDensePercent),
    solAttnThreshType: map.get(k.solAttnThreshType)!,
    solAttnInt8Qk: map.get(k.solAttnInt8Qk)! === 'true',
    solAttnInt8Pv: map.get(k.solAttnInt8Pv)! === 'true',
    solAttnSinkConditioning: map.get(k.solAttnSinkConditioning)!,
    solAttnDenseBlocks: map.get(k.solAttnDenseBlocks)!,
    megapixels: parseLtxNumber(map, k.megapixels),
    megapixelsLast: parseLtxNumber(map, k.megapixelsLast),
    resizeMultipleOf: parseLtxInteger(map, k.resizeMultipleOf),
    resizeUpscaleMethod: map.get(k.resizeUpscaleMethod)!,
    durationOptions: parseLtxNumberList(map, k.durationOptions),
    framesPerStep: parseLtxInteger(map, k.framesPerStep),
    frameBase: parseLtxInteger(map, k.frameBase),
    frameRate: parseLtxNumber(map, k.frameRate),
    videoCrf: parseLtxInteger(map, k.videoCrf),
    videoFormat: map.get(k.videoFormat)!,
    videoPixFmt: map.get(k.videoPixFmt)!,
    rtxEnabled: map.get(k.rtxEnabled)! === 'true',
    rtxResizeType: map.get(k.rtxResizeType)!,
    rtxScale: parseLtxNumber(map, k.rtxScale),
    rtxQuality: map.get(k.rtxQuality)!,
  };
}
