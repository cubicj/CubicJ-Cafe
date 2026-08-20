import { prisma } from '../prisma';
import {
  buildSettingsMap,
  parseLtxInteger,
  parseLtxNumber,
  parseLtxNumberList,
} from './common';

export interface WanSettings {
  wanvideoModelHigh: string;
  wanvideoModelLow: string;
  t5Encoder: string;
  wanvideoVae: string;
  basePrecision: string;
  quantization: string;
  attentionMode: string;
  blocksToSwap: number;
  offloadImgEmb: boolean;
  offloadTxtEmb: boolean;
  vaceBlocksToSwap: number;
  prefetchBlocks: number;
  samplerSteps: number;
  shift: number;
  scheduler: string;
  sigmasHigh: string;
  sigmasLow: string;
  megapixels: number;
  resizeMultipleOf: number;
  resizeUpscaleMethod: string;
  nagScale: number;
  nagAlpha: number;
  nagTau: number;
  rtxEnabled: boolean;
  rtxResizeType: string;
  rtxScale: number;
  rtxQuality: string;
  frameRate: number;
  videoCrf: number;
  videoFormat: string;
  videoPixFmt: string;
  negativePrompt: string;
  durationOptions: number[];
  propagateX0High: boolean;
  propagateX0StrengthHigh: number;
  propagateX0Low: boolean;
  propagateX0StrengthLow: number;
  disableWindowReinjectHigh: boolean;
  disableWindowReinjectLow: boolean;
}

export const WAN_KEYS = {
  wanvideoModelHigh: 'wan.wanvideo_model_high',
  wanvideoModelLow: 'wan.wanvideo_model_low',
  t5Encoder: 'wan.t5_encoder',
  wanvideoVae: 'wan.wanvideo_vae',
  basePrecision: 'wan.base_precision',
  quantization: 'wan.quantization',
  attentionMode: 'wan.attention_mode',
  blocksToSwap: 'wan.blocks_to_swap',
  offloadImgEmb: 'wan.offload_img_emb',
  offloadTxtEmb: 'wan.offload_txt_emb',
  vaceBlocksToSwap: 'wan.vace_blocks_to_swap',
  prefetchBlocks: 'wan.prefetch_blocks',
  samplerSteps: 'wan.sampler_steps',
  shift: 'wan.shift',
  scheduler: 'wan.scheduler',
  sigmasHigh: 'wan.sigmas_high',
  sigmasLow: 'wan.sigmas_low',
  megapixels: 'wan.megapixels',
  resizeMultipleOf: 'wan.resize_multiple_of',
  resizeUpscaleMethod: 'wan.resize_upscale_method',
  nagScale: 'wan.nag_scale',
  nagAlpha: 'wan.nag_alpha',
  nagTau: 'wan.nag_tau',
  rtxEnabled: 'wan.rtx_enabled',
  rtxResizeType: 'wan.rtx_resize_type',
  rtxScale: 'wan.rtx_scale',
  rtxQuality: 'wan.rtx_quality',
  frameRate: 'wan.frame_rate',
  videoCrf: 'wan.video_crf',
  videoFormat: 'wan.video_format',
  videoPixFmt: 'wan.video_pix_fmt',
  negativePrompt: 'wan.negative_prompt',
  durationOptions: 'wan.duration_options',
  disableWindowReinjectHigh: 'wan.disable_window_reinject_high',
  disableWindowReinjectLow: 'wan.disable_window_reinject_low',
  propagateX0High: 'wan.propagate_x0_high',
  propagateX0StrengthHigh: 'wan.propagate_x0_strength_high',
  propagateX0Low: 'wan.propagate_x0_low',
  propagateX0StrengthLow: 'wan.propagate_x0_strength_low',
} as const;

export async function getWanSettings(): Promise<WanSettings> {
  const keys = Object.values(WAN_KEYS);
  const settings = await prisma.systemSetting.findMany({ where: { key: { in: keys } } });
  const map = buildSettingsMap(settings, WAN_KEYS);
  const k = WAN_KEYS;
  return {
    wanvideoModelHigh: map.get(k.wanvideoModelHigh)!,
    wanvideoModelLow: map.get(k.wanvideoModelLow)!,
    t5Encoder: map.get(k.t5Encoder)!,
    wanvideoVae: map.get(k.wanvideoVae)!,
    basePrecision: map.get(k.basePrecision)!,
    quantization: map.get(k.quantization)!,
    attentionMode: map.get(k.attentionMode)!,
    blocksToSwap: parseLtxInteger(map, k.blocksToSwap),
    offloadImgEmb: map.get(k.offloadImgEmb)! === 'true',
    offloadTxtEmb: map.get(k.offloadTxtEmb)! === 'true',
    vaceBlocksToSwap: parseLtxInteger(map, k.vaceBlocksToSwap),
    prefetchBlocks: parseLtxInteger(map, k.prefetchBlocks),
    samplerSteps: parseLtxInteger(map, k.samplerSteps),
    shift: parseLtxNumber(map, k.shift),
    scheduler: map.get(k.scheduler)!,
    sigmasHigh: map.get(k.sigmasHigh)!,
    sigmasLow: map.get(k.sigmasLow)!,
    megapixels: parseLtxNumber(map, k.megapixels),
    resizeMultipleOf: parseLtxInteger(map, k.resizeMultipleOf),
    resizeUpscaleMethod: map.get(k.resizeUpscaleMethod)!,
    nagScale: parseLtxNumber(map, k.nagScale),
    nagAlpha: parseLtxNumber(map, k.nagAlpha),
    nagTau: parseLtxNumber(map, k.nagTau),
    rtxEnabled: map.get(k.rtxEnabled)! === 'true',
    rtxResizeType: map.get(k.rtxResizeType)!,
    rtxScale: parseLtxNumber(map, k.rtxScale),
    rtxQuality: map.get(k.rtxQuality)!,
    frameRate: parseLtxNumber(map, k.frameRate),
    videoCrf: parseLtxInteger(map, k.videoCrf),
    videoFormat: map.get(k.videoFormat)!,
    videoPixFmt: map.get(k.videoPixFmt)!,
    negativePrompt: map.get(k.negativePrompt)!,
    durationOptions: parseLtxNumberList(map, k.durationOptions),
    disableWindowReinjectHigh: map.get(k.disableWindowReinjectHigh)! === 'true',
    disableWindowReinjectLow: map.get(k.disableWindowReinjectLow)! === 'true',
    propagateX0High: map.get(k.propagateX0High)! === 'true',
    propagateX0StrengthHigh: parseLtxNumber(map, k.propagateX0StrengthHigh),
    propagateX0Low: map.get(k.propagateX0Low)! === 'true',
    propagateX0StrengthLow: parseLtxNumber(map, k.propagateX0StrengthLow),
  };
}
