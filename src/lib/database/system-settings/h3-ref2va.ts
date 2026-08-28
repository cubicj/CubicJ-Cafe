import { prisma } from '../prisma';
import {
  buildSettingsMap,
  parseLtxInteger,
  parseLtxNumber,
  parseLtxNumberList,
} from './common';

export interface H3Ref2vaSettings {
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
  sageAttention: string;
  sageAllowCompile: boolean;
  lowVramHeadChunks: number;
  noVideoUnet: string;
  noVideoClipName: string;
  noVideoVideoVae: string;
  noVideoSteps: number;
  noVideoSampler: string;
  noVideoScheduler: string;
  noVideoMegapixels: number;
  noVideoChunkFeedforwardEnabled: boolean;
  noVideoChunkFeedforwardChunks: number;
  noVideoChunkFeedforwardMinLen: number;
  noVideoSplitStep: number;
  noVideoManualSigmas: string;
  noVideoUpscalerModel: string;
  noVideoSecondPassMegapixels: number;
  noVideoUpscalerAlign: number;
  noVideoUpscalerChunking: boolean;
  noVideoUpscalerDevice: string;
  noVideoUpscalerPrecision: string;
  chunkFeedforwardEnabled: boolean;
  chunkFeedforwardChunks: number;
  chunkFeedforwardMinLen: number;
  megapixels: number;
  megapixelsVideo: number;
  refVideoForceRate: number;
  refVideoFormat: string;
  resizeMultipleOf: number;
  resizeUpscaleMethod: string;
  refImageSize: string;
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

export const H3_REF2VA_KEYS = {
  unet: 'h3-ref2va.unet',
  unetWeightDtype: 'h3-ref2va.unet_weight_dtype',
  clipName: 'h3-ref2va.clip_name',
  clipType: 'h3-ref2va.clip_type',
  clipDevice: 'h3-ref2va.clip_device',
  videoVae: 'h3-ref2va.video_vae',
  audioVae: 'h3-ref2va.audio_vae',
  turboLora: 'h3-ref2va.turbo_lora',
  turboLoraStrength: 'h3-ref2va.turbo_lora_strength',
  steps: 'h3-ref2va.steps',
  sampler: 'h3-ref2va.sampler',
  scheduler: 'h3-ref2va.scheduler',
  shiftVideo: 'h3-ref2va.shift_video',
  shiftAudio: 'h3-ref2va.shift_audio',
  sageAttention: 'h3-ref2va.sage_attention',
  sageAllowCompile: 'h3-ref2va.sage_allow_compile',
  lowVramHeadChunks: 'h3-ref2va.low_vram_head_chunks',
  noVideoUnet: 'h3-ref2va.no_video_unet',
  noVideoClipName: 'h3-ref2va.no_video_clip_name',
  noVideoVideoVae: 'h3-ref2va.no_video_video_vae',
  noVideoSteps: 'h3-ref2va.no_video_steps',
  noVideoSampler: 'h3-ref2va.no_video_sampler',
  noVideoScheduler: 'h3-ref2va.no_video_scheduler',
  noVideoMegapixels: 'h3-ref2va.no_video_megapixels',
  noVideoChunkFeedforwardEnabled: 'h3-ref2va.no_video_chunk_feedforward_enabled',
  noVideoChunkFeedforwardChunks: 'h3-ref2va.no_video_chunk_feedforward_chunks',
  noVideoChunkFeedforwardMinLen: 'h3-ref2va.no_video_chunk_feedforward_min_len',
  noVideoSplitStep: 'h3-ref2va.no_video_split_step',
  noVideoManualSigmas: 'h3-ref2va.no_video_manual_sigmas',
  noVideoUpscalerModel: 'h3-ref2va.no_video_upscaler_model',
  noVideoSecondPassMegapixels: 'h3-ref2va.no_video_second_pass_megapixels',
  noVideoUpscalerAlign: 'h3-ref2va.no_video_upscaler_align',
  noVideoUpscalerChunking: 'h3-ref2va.no_video_upscaler_chunking',
  noVideoUpscalerDevice: 'h3-ref2va.no_video_upscaler_device',
  noVideoUpscalerPrecision: 'h3-ref2va.no_video_upscaler_precision',
  chunkFeedforwardEnabled: 'h3-ref2va.chunk_feedforward_enabled',
  chunkFeedforwardChunks: 'h3-ref2va.chunk_feedforward_chunks',
  chunkFeedforwardMinLen: 'h3-ref2va.chunk_feedforward_min_len',
  megapixels: 'h3-ref2va.megapixels',
  megapixelsVideo: 'h3-ref2va.megapixels_video',
  refVideoForceRate: 'h3-ref2va.ref_video_force_rate',
  refVideoFormat: 'h3-ref2va.ref_video_format',
  resizeMultipleOf: 'h3-ref2va.resize_multiple_of',
  resizeUpscaleMethod: 'h3-ref2va.resize_upscale_method',
  refImageSize: 'h3-ref2va.ref_image_size',
  durationOptions: 'h3-ref2va.duration_options',
  framesPerStep: 'h3-ref2va.frames_per_step',
  frameBase: 'h3-ref2va.frame_base',
  frameRate: 'h3-ref2va.frame_rate',
  videoCrf: 'h3-ref2va.video_crf',
  videoFormat: 'h3-ref2va.video_format',
  videoPixFmt: 'h3-ref2va.video_pix_fmt',
  rtxEnabled: 'h3-ref2va.rtx_enabled',
  rtxResizeType: 'h3-ref2va.rtx_resize_type',
  rtxScale: 'h3-ref2va.rtx_scale',
  rtxQuality: 'h3-ref2va.rtx_quality',
} as const;

export async function getH3Ref2vaSettings(): Promise<H3Ref2vaSettings> {
  const keys = Object.values(H3_REF2VA_KEYS);
  const settings = await prisma.systemSetting.findMany({ where: { key: { in: keys } } });
  const map = buildSettingsMap(settings, H3_REF2VA_KEYS);
  const k = H3_REF2VA_KEYS;
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
    sageAttention: map.get(k.sageAttention)!,
    sageAllowCompile: map.get(k.sageAllowCompile)! === 'true',
    lowVramHeadChunks: parseLtxInteger(map, k.lowVramHeadChunks),
    noVideoUnet: map.get(k.noVideoUnet)!,
    noVideoClipName: map.get(k.noVideoClipName)!,
    noVideoVideoVae: map.get(k.noVideoVideoVae)!,
    noVideoSteps: parseLtxInteger(map, k.noVideoSteps),
    noVideoSampler: map.get(k.noVideoSampler)!,
    noVideoScheduler: map.get(k.noVideoScheduler)!,
    noVideoMegapixels: parseLtxNumber(map, k.noVideoMegapixels),
    noVideoChunkFeedforwardEnabled: map.get(k.noVideoChunkFeedforwardEnabled)! === 'true',
    noVideoChunkFeedforwardChunks: parseLtxInteger(map, k.noVideoChunkFeedforwardChunks),
    noVideoChunkFeedforwardMinLen: parseLtxInteger(map, k.noVideoChunkFeedforwardMinLen),
    noVideoSplitStep: parseLtxInteger(map, k.noVideoSplitStep),
    noVideoManualSigmas: map.get(k.noVideoManualSigmas)!,
    noVideoUpscalerModel: map.get(k.noVideoUpscalerModel)!,
    noVideoSecondPassMegapixels: parseLtxNumber(map, k.noVideoSecondPassMegapixels),
    noVideoUpscalerAlign: parseLtxInteger(map, k.noVideoUpscalerAlign),
    noVideoUpscalerChunking: map.get(k.noVideoUpscalerChunking)! === 'true',
    noVideoUpscalerDevice: map.get(k.noVideoUpscalerDevice)!,
    noVideoUpscalerPrecision: map.get(k.noVideoUpscalerPrecision)!,
    chunkFeedforwardEnabled: map.get(k.chunkFeedforwardEnabled)! === 'true',
    chunkFeedforwardChunks: parseLtxInteger(map, k.chunkFeedforwardChunks),
    chunkFeedforwardMinLen: parseLtxInteger(map, k.chunkFeedforwardMinLen),
    megapixels: parseLtxNumber(map, k.megapixels),
    megapixelsVideo: parseLtxNumber(map, k.megapixelsVideo),
    refVideoForceRate: parseLtxNumber(map, k.refVideoForceRate),
    refVideoFormat: map.get(k.refVideoFormat)!,
    resizeMultipleOf: parseLtxInteger(map, k.resizeMultipleOf),
    resizeUpscaleMethod: map.get(k.resizeUpscaleMethod)!,
    refImageSize: map.get(k.refImageSize)!,
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
