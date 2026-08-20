import { prisma } from '../prisma';
import {
  buildSettingsMap,
  parseLtxInteger,
  parseLtxNumber,
  parseLtxNumberList,
} from './common';

export interface LtxWanSettings {
  audioNormEnabled: boolean
  distilledLoraEnabled: boolean
  loraEnabledWan: boolean
  vfiEnabled: boolean
  rtxEnabled: boolean
  durationOptions: number[]

  unet: string
  weightDtype: string
  clipGguf: string
  clipEmbeddings: string
  videoVae: string
  audioVae: string

  frameRate: number
  megapixels: number
  resizeMultipleOf: number
  resizeUpscaleMethod: string
  imgCompression: number
  sampler: string
  clownEta: number
  clownBongmath: boolean

  schedulerSteps: number
  schedulerMaxShift: number
  schedulerBaseShift: number
  schedulerStretch: boolean
  schedulerTerminal: number

  nagScale: number
  nagAlpha: number
  nagTau: number

  audioNorm: string
  identityGuidanceScale: number
  identityStartPercent: number
  identityEndPercent: number
  idLoraName: string
  idLoraStrength: number

  distilledLoraName: string
  distilledLoraStrength: number

  negativePromptLtx: string

  unetWan: string
  clipWan: string
  vaeWan: string
  shift: number

  cfgWan: number

  schedulerWan: string
  stepsWan: number
  denoiseWan: number
  sigmasWan: string

  nagScaleWan: number
  nagAlphaWan: number
  nagTauWan: number

  negativePromptWan: string
  blocksToSwap: number
  prefetchBlocks: number
  propagateX0: boolean
  propagateX0Strength: number
  disableWindowReinject: boolean

  vfiMethod: string
  rifeModel: string
  rifePrecision: string
  rifeResolutionProfile: string
  rifeCustomMinDim: number
  rifeCustomOptDim: number
  rifeCustomMaxDim: number
  gmfssModel: string
  vfiMultiplier: number
  vfiClearCache: number

  rtxResizeType: string
  rtxScale: number
  rtxQuality: string

  videoCrf: number
  videoFormat: string
  videoPixFmt: string
}

export const LTX_WAN_KEYS = {
  audioNormEnabled: 'ltx-wan.audio_norm_enabled',
  distilledLoraEnabled: 'ltx-wan.distilled_lora_enabled',
  loraEnabledWan: 'ltx-wan.lora_enabled_wan',
  vfiEnabled: 'ltx-wan.vfi_enabled',
  rtxEnabled: 'ltx-wan.rtx_enabled',
  durationOptions: 'ltx-wan.duration_options',

  unet: 'ltx-wan.unet',
  weightDtype: 'ltx-wan.weight_dtype',
  clipGguf: 'ltx-wan.clip_gguf',
  clipEmbeddings: 'ltx-wan.clip_embeddings',
  videoVae: 'ltx-wan.video_vae',
  audioVae: 'ltx-wan.audio_vae',

  frameRate: 'ltx-wan.frame_rate',
  megapixels: 'ltx-wan.megapixels',
  resizeMultipleOf: 'ltx-wan.resize_multiple_of',
  resizeUpscaleMethod: 'ltx-wan.resize_upscale_method',
  imgCompression: 'ltx-wan.img_compression',
  sampler: 'ltx-wan.sampler',
  clownEta: 'ltx-wan.clown_eta',
  clownBongmath: 'ltx-wan.clown_bongmath',

  schedulerSteps: 'ltx-wan.scheduler_steps',
  schedulerMaxShift: 'ltx-wan.scheduler_max_shift',
  schedulerBaseShift: 'ltx-wan.scheduler_base_shift',
  schedulerStretch: 'ltx-wan.scheduler_stretch',
  schedulerTerminal: 'ltx-wan.scheduler_terminal',

  nagScale: 'ltx-wan.nag_scale',
  nagAlpha: 'ltx-wan.nag_alpha',
  nagTau: 'ltx-wan.nag_tau',

  audioNorm: 'ltx-wan.audio_norm',
  identityGuidanceScale: 'ltx-wan.identity_guidance_scale',
  identityStartPercent: 'ltx-wan.identity_start_percent',
  identityEndPercent: 'ltx-wan.identity_end_percent',
  idLoraName: 'ltx-wan.id_lora_name',
  idLoraStrength: 'ltx-wan.id_lora_strength',

  distilledLoraName: 'ltx-wan.distilled_lora_name',
  distilledLoraStrength: 'ltx-wan.distilled_lora_strength',

  negativePromptLtx: 'ltx-wan.negative_prompt_ltx',

  unetWan: 'ltx-wan.unet_wan',
  clipWan: 'ltx-wan.clip_wan',
  vaeWan: 'ltx-wan.vae_wan',
  shift: 'ltx-wan.shift',

  cfgWan: 'ltx-wan.cfg_wan',

  schedulerWan: 'ltx-wan.scheduler_wan',
  stepsWan: 'ltx-wan.steps_wan',
  denoiseWan: 'ltx-wan.denoise_wan',
  sigmasWan: 'ltx-wan.sigmas_wan',

  nagScaleWan: 'ltx-wan.nag_scale_wan',
  nagAlphaWan: 'ltx-wan.nag_alpha_wan',
  nagTauWan: 'ltx-wan.nag_tau_wan',

  negativePromptWan: 'ltx-wan.negative_prompt_wan',
  blocksToSwap: 'ltx-wan.blocks_to_swap',
  prefetchBlocks: 'ltx-wan.prefetch_blocks',
  disableWindowReinject: 'ltx-wan.disable_window_reinject',
  propagateX0: 'ltx-wan.propagate_x0',
  propagateX0Strength: 'ltx-wan.propagate_x0_strength',

  vfiMethod: 'ltx-wan.vfi_method',
  rifeModel: 'ltx-wan.rife_model',
  rifePrecision: 'ltx-wan.rife_precision',
  rifeResolutionProfile: 'ltx-wan.rife_resolution_profile',
  rifeCustomMinDim: 'ltx-wan.rife_custom_min_dim',
  rifeCustomOptDim: 'ltx-wan.rife_custom_opt_dim',
  rifeCustomMaxDim: 'ltx-wan.rife_custom_max_dim',
  gmfssModel: 'ltx-wan.gmfss_model',
  vfiMultiplier: 'ltx-wan.vfi_multiplier',
  vfiClearCache: 'ltx-wan.vfi_clear_cache',

  rtxResizeType: 'ltx-wan.rtx_resize_type',
  rtxScale: 'ltx-wan.rtx_scale',
  rtxQuality: 'ltx-wan.rtx_quality',

  videoCrf: 'ltx-wan.video_crf',
  videoFormat: 'ltx-wan.video_format',
  videoPixFmt: 'ltx-wan.video_pix_fmt',
} as const

export async function getLtxWanSettings(): Promise<LtxWanSettings> {
  const keys = Object.values(LTX_WAN_KEYS)
  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: keys } },
  })
  const map = buildSettingsMap(settings, LTX_WAN_KEYS)
  const k = LTX_WAN_KEYS

  return {
    audioNormEnabled: map.get(k.audioNormEnabled)! === 'true',
    distilledLoraEnabled: map.get(k.distilledLoraEnabled)! === 'true',
    loraEnabledWan: map.get(k.loraEnabledWan)! === 'true',
    vfiEnabled: map.get(k.vfiEnabled)! === 'true',
    rtxEnabled: map.get(k.rtxEnabled)! === 'true',
    durationOptions: parseLtxNumberList(map, k.durationOptions),

    unet: map.get(k.unet)!,
    weightDtype: map.get(k.weightDtype)!,
    clipGguf: map.get(k.clipGguf)!,
    clipEmbeddings: map.get(k.clipEmbeddings)!,
    videoVae: map.get(k.videoVae)!,
    audioVae: map.get(k.audioVae)!,

    frameRate: parseLtxNumber(map, k.frameRate),
    megapixels: parseLtxNumber(map, k.megapixels),
    resizeMultipleOf: parseLtxInteger(map, k.resizeMultipleOf),
    resizeUpscaleMethod: map.get(k.resizeUpscaleMethod)!,
    imgCompression: parseLtxInteger(map, k.imgCompression),
    sampler: map.get(k.sampler)!,
    clownEta: parseLtxNumber(map, k.clownEta),
    clownBongmath: map.get(k.clownBongmath)! === 'true',

    schedulerSteps: parseLtxInteger(map, k.schedulerSteps),
    schedulerMaxShift: parseLtxNumber(map, k.schedulerMaxShift),
    schedulerBaseShift: parseLtxNumber(map, k.schedulerBaseShift),
    schedulerStretch: map.get(k.schedulerStretch)! === 'true',
    schedulerTerminal: parseLtxNumber(map, k.schedulerTerminal),

    nagScale: parseLtxNumber(map, k.nagScale),
    nagAlpha: parseLtxNumber(map, k.nagAlpha),
    nagTau: parseLtxNumber(map, k.nagTau),

    audioNorm: map.get(k.audioNorm)!,
    identityGuidanceScale: parseLtxNumber(map, k.identityGuidanceScale),
    identityStartPercent: parseLtxNumber(map, k.identityStartPercent),
    identityEndPercent: parseLtxNumber(map, k.identityEndPercent),
    idLoraName: map.get(k.idLoraName)!,
    idLoraStrength: parseLtxNumber(map, k.idLoraStrength),

    distilledLoraName: map.get(k.distilledLoraName)!,
    distilledLoraStrength: parseLtxNumber(map, k.distilledLoraStrength),

    negativePromptLtx: map.get(k.negativePromptLtx)!,

    unetWan: map.get(k.unetWan)!,
    clipWan: map.get(k.clipWan)!,
    vaeWan: map.get(k.vaeWan)!,
    shift: parseLtxNumber(map, k.shift),

    cfgWan: parseLtxNumber(map, k.cfgWan),

    schedulerWan: map.get(k.schedulerWan)!,
    stepsWan: parseLtxInteger(map, k.stepsWan),
    denoiseWan: parseLtxNumber(map, k.denoiseWan),
    sigmasWan: map.get(k.sigmasWan)!,

    nagScaleWan: parseLtxNumber(map, k.nagScaleWan),
    nagAlphaWan: parseLtxNumber(map, k.nagAlphaWan),
    nagTauWan: parseLtxNumber(map, k.nagTauWan),

    negativePromptWan: map.get(k.negativePromptWan)!,
    blocksToSwap: parseLtxInteger(map, k.blocksToSwap),
    prefetchBlocks: parseLtxInteger(map, k.prefetchBlocks),
    disableWindowReinject: map.get(k.disableWindowReinject)! === 'true',
    propagateX0: map.get(k.propagateX0)! === 'true',
    propagateX0Strength: parseLtxNumber(map, k.propagateX0Strength),

    vfiMethod: map.get(k.vfiMethod)!,
    rifeModel: map.get(k.rifeModel)!,
    rifePrecision: map.get(k.rifePrecision)!,
    rifeResolutionProfile: map.get(k.rifeResolutionProfile)!,
    rifeCustomMinDim: parseLtxInteger(map, k.rifeCustomMinDim),
    rifeCustomOptDim: parseLtxInteger(map, k.rifeCustomOptDim),
    rifeCustomMaxDim: parseLtxInteger(map, k.rifeCustomMaxDim),
    gmfssModel: map.get(k.gmfssModel)!,
    vfiMultiplier: parseLtxInteger(map, k.vfiMultiplier),
    vfiClearCache: parseLtxInteger(map, k.vfiClearCache),

    rtxResizeType: map.get(k.rtxResizeType)!,
    rtxScale: parseLtxNumber(map, k.rtxScale),
    rtxQuality: map.get(k.rtxQuality)!,

    videoCrf: parseLtxInteger(map, k.videoCrf),
    videoFormat: map.get(k.videoFormat)!,
    videoPixFmt: map.get(k.videoPixFmt)!,
  }
}
