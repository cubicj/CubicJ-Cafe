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
  steps: number;
  sampler: string;
  scheduler: string;
  shiftVideo: number;
  shiftAudio: number;
  sageAttention: string;
  lowVramHeadChunks: number;
  chunkFeedforwardEnabled: boolean;
  chunkFeedforwardChunks: number;
  chunkFeedforwardMinLen: number;
  megapixels: number;
  secondPassMegapixels: number;
  splitStep: number;
  manualSigmas: string;
  upscalerModel: string;
  upscalerAlign: number;
  upscalerChunking: boolean;
  upscalerDevice: string;
  upscalerPrecision: string;
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
  steps: 'h3-fl2va.steps',
  sampler: 'h3-fl2va.sampler',
  scheduler: 'h3-fl2va.scheduler',
  shiftVideo: 'h3-fl2va.shift_video',
  shiftAudio: 'h3-fl2va.shift_audio',
  sageAttention: 'h3-fl2va.sage_attention',
  lowVramHeadChunks: 'h3-fl2va.low_vram_head_chunks',
  chunkFeedforwardEnabled: 'h3-fl2va.chunk_feedforward_enabled',
  chunkFeedforwardChunks: 'h3-fl2va.chunk_feedforward_chunks',
  chunkFeedforwardMinLen: 'h3-fl2va.chunk_feedforward_min_len',
  megapixels: 'h3-fl2va.megapixels',
  secondPassMegapixels: 'h3-fl2va.second_pass_megapixels',
  splitStep: 'h3-fl2va.split_step',
  manualSigmas: 'h3-fl2va.manual_sigmas',
  upscalerModel: 'h3-fl2va.upscaler_model',
  upscalerAlign: 'h3-fl2va.upscaler_align',
  upscalerChunking: 'h3-fl2va.upscaler_chunking',
  upscalerDevice: 'h3-fl2va.upscaler_device',
  upscalerPrecision: 'h3-fl2va.upscaler_precision',
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
  const map = buildSettingsMap(settings, H3_FL2VA_KEYS);
  const k = H3_FL2VA_KEYS;
  return {
    unet: map.get(k.unet)!,
    unetWeightDtype: map.get(k.unetWeightDtype)!,
    clipName: map.get(k.clipName)!,
    clipType: map.get(k.clipType)!,
    clipDevice: map.get(k.clipDevice)!,
    videoVae: map.get(k.videoVae)!,
    audioVae: map.get(k.audioVae)!,
    steps: parseLtxInteger(map, k.steps),
    sampler: map.get(k.sampler)!,
    scheduler: map.get(k.scheduler)!,
    shiftVideo: parseLtxNumber(map, k.shiftVideo),
    shiftAudio: parseLtxNumber(map, k.shiftAudio),
    sageAttention: map.get(k.sageAttention)!,
    lowVramHeadChunks: parseLtxInteger(map, k.lowVramHeadChunks),
    chunkFeedforwardEnabled: map.get(k.chunkFeedforwardEnabled)! === 'true',
    chunkFeedforwardChunks: parseLtxInteger(map, k.chunkFeedforwardChunks),
    chunkFeedforwardMinLen: parseLtxInteger(map, k.chunkFeedforwardMinLen),
    megapixels: parseLtxNumber(map, k.megapixels),
    secondPassMegapixels: parseLtxNumber(map, k.secondPassMegapixels),
    splitStep: parseLtxInteger(map, k.splitStep),
    manualSigmas: map.get(k.manualSigmas)!,
    upscalerModel: map.get(k.upscalerModel)!,
    upscalerAlign: parseLtxInteger(map, k.upscalerAlign),
    upscalerChunking: map.get(k.upscalerChunking)! === 'true',
    upscalerDevice: map.get(k.upscalerDevice)!,
    upscalerPrecision: map.get(k.upscalerPrecision)!,
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
