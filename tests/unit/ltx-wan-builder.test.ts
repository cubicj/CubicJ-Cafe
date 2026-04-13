import { vi } from 'vitest'

vi.mock('@/lib/database/system-settings', () => ({
  getLtxWanSettings: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

import { buildLtxWanWorkflow } from '@/lib/comfyui/workflows/ltx-wan/builder'
import { getLtxWanSettings } from '@/lib/database/system-settings'
import { LTX_WAN } from '@/lib/comfyui/workflows/ltx-wan/nodes'
import type { LtxWanGenerationParams } from '@/lib/comfyui/workflows/types'

const mockSettings = vi.mocked(getLtxWanSettings)

const BASE_SETTINGS = {
  audioNormEnabled: true,
  distilledLoraEnabled: true,
  loraEnabledWan: false,
  vfiEnabled: true,
  rtxEnabled: true,

  unet: 'fake-lw-unet-q8r.safetensors',
  weightDtype: 'default',
  clipGguf: 'fake-lw-clip-g3m.safetensors',
  clipEmbeddings: 'fake-lw-embed-t2p.safetensors',
  videoVae: 'fake-lw-vvae-b7k.safetensors',
  audioVae: 'fake-lw-avae-n4f.safetensors',

  frameRate: 16,
  megapixels: 0.85,
  resizeMultipleOf: 32,
  resizeUpscaleMethod: 'lanczos',
  imgCompression: 5,
  sampler: 'linear/euler',
  clownEta: 0.25,
  clownBongmath: true,

  schedulerSteps: 12,
  schedulerMaxShift: 2.05,
  schedulerBaseShift: 0.95,
  schedulerStretch: true,
  schedulerTerminal: 0.1,

  nagScale: 5,
  nagAlpha: 0.25,
  nagTau: 2.373,

  audioNorm: '1,1,0.7,1,1,0.7,1,1,1,1,1,1',
  identityGuidanceScale: 3,
  identityStartPercent: 0,
  identityEndPercent: 1,
  idLoraName: 'fake-lw-idlora-j5d.safetensors',
  idLoraStrength: 0.68,

  distilledLoraName: 'fake-lw-distilled-v3r.safetensors',
  distilledLoraStrength: 0.5,

  negativePromptLtx: 'fake ltx negative',

  unetWan: 'fake-lw-wan-unet-x2w.safetensors',
  clipWan: 'fake-lw-wan-clip-k9p.safetensors',
  vaeWan: 'fake-lw-wan-vae-m3v.safetensors',
  shift: 5,

  samplerWan: 'linear/euler',
  clownEtaWan: 0.25,
  clownBongmathWan: true,

  schedulerWan: 'beta57',
  stepsWan: 4,
  denoiseWan: 1,
  sigmasRescaleStart: 0.55,
  sigmasRescaleEnd: 0,

  nagScaleWan: 5,
  nagAlphaWan: 0.25,
  nagTauWan: 2.373,

  negativePromptWan: 'fake wan negative',

  vfiMethod: 'rife',
  rifeModel: 'fake_rife_model_sim',
  rifePrecision: 'fp32',
  rifeResolutionProfile: 'custom',
  rifeCustomMinDim: 704,
  rifeCustomOptDim: 960,
  rifeCustomMaxDim: 1280,
  gmfssModel: 'fake_gmfss_union',
  vfiMultiplier: 1,
  vfiClearCache: 300,

  rtxResizeType: 'scale by multiplier',
  rtxScale: 1.5,
  rtxQuality: 'ULTRA',

  videoCrf: 20,
  videoFormat: 'video/h264-mp4',
  videoPixFmt: 'yuv420p',
}

function makeSettings(overrides = {}) {
  return { ...BASE_SETTINGS, ...overrides }
}

const DEFAULT_PARAMS: LtxWanGenerationParams = {
  model: 'ltx-wan',
  prompt: 'fake test prompt for ltx-wan workflow',
  inputImage: 'fake-test-image.png',
  videoDuration: 5,
}

describe('buildLtxWanWorkflow', () => {
  beforeEach(() => {
    mockSettings.mockResolvedValue(makeSettings())
  })

  it('builds default workflow with all nodes', async () => {
    const workflow = await buildLtxWanWorkflow(DEFAULT_PARAMS)

    expect(workflow[LTX_WAN.UNET]!.inputs!.unet_name).toBe('fake-lw-unet-q8r.safetensors')
    expect(workflow[LTX_WAN.CLIP]!.inputs!.clip_name1).toBe('fake-lw-clip-g3m.safetensors')
    expect(workflow[LTX_WAN.VIDEO_VAE]!.inputs!.vae_name).toBe('fake-lw-vvae-b7k.safetensors')
    expect(workflow[LTX_WAN.AUDIO_VAE]!.inputs!.vae_name).toBe('fake-lw-avae-n4f.safetensors')
    expect(workflow[LTX_WAN.POSITIVE_PROMPT]!.inputs!.text).toBe('fake test prompt for ltx-wan workflow')
    expect(workflow[LTX_WAN.NEGATIVE_PROMPT_LTX]!.inputs!.text).toBe('fake ltx negative')
    expect(workflow[LTX_WAN.UNET_WAN]!.inputs!.unet_name).toBe('fake-lw-wan-unet-x2w.safetensors')
    expect(workflow[LTX_WAN.NEGATIVE_PROMPT_WAN]!.inputs!.text).toBe('fake wan negative')
    expect(workflow[LTX_WAN.VIDEO_OUTPUT]!.inputs!.save_output).toBe(false)
  })

  it('sets 4 independent seeds', async () => {
    const workflow = await buildLtxWanWorkflow(DEFAULT_PARAMS)

    const noiseLtx = workflow[LTX_WAN.NOISE_SEED_LTX]!.inputs!.noise_seed as number
    const samplerLtx = workflow[LTX_WAN.CLOWN_SAMPLER_LTX]!.inputs!.seed as number
    const noiseWan = workflow[LTX_WAN.NOISE_SEED_WAN]!.inputs!.noise_seed as number
    const samplerWan = workflow[LTX_WAN.CLOWN_SAMPLER_WAN]!.inputs!.seed as number

    expect(noiseLtx).toBeGreaterThan(0)
    expect(samplerLtx).toBeGreaterThan(0)
    expect(noiseWan).toBeGreaterThan(0)
    expect(samplerWan).toBeGreaterThan(0)
  })

  it('bypasses end image when not provided', async () => {
    const workflow = await buildLtxWanWorkflow(DEFAULT_PARAMS)

    expect(workflow[LTX_WAN.IMG_TO_VIDEO]!.inputs!['num_images']).toBe('1')
    expect(workflow[LTX_WAN.IMG_TO_VIDEO]!.inputs!['num_images.image_2']).toBeUndefined()
    expect(workflow[LTX_WAN.LOAD_IMAGE_END]).toBeUndefined()
    expect(workflow[LTX_WAN.END_FRAME_MATH]).toBeDefined()
  })

  it('includes end image when provided', async () => {
    const params = { ...DEFAULT_PARAMS, endImage: 'fake-end.png' }
    const workflow = await buildLtxWanWorkflow(params)

    expect(workflow[LTX_WAN.LOAD_IMAGE_END]!.inputs!.image).toBe('fake-end.png')
    expect(workflow[LTX_WAN.IMG_TO_VIDEO]!.inputs!['num_images']).toBe('2')
  })

  it('creates reference audio nodes when audio provided', async () => {
    const params = { ...DEFAULT_PARAMS, referenceAudio: 'fake-audio.flac' }
    const workflow = await buildLtxWanWorkflow(params)

    expect(workflow[LTX_WAN.LOAD_AUDIO]!.inputs!.audio).toBe('fake-audio.flac')
    expect(workflow[LTX_WAN.REFERENCE_AUDIO]).toBeDefined()
    expect(workflow[LTX_WAN.REFERENCE_AUDIO]!.inputs!.identity_guidance_scale).toBe(3)
  })

  it('wires NAG cond_video and cond_audio to reference audio when audio provided', async () => {
    const params = { ...DEFAULT_PARAMS, referenceAudio: 'fake-audio.flac' }
    const workflow = await buildLtxWanWorkflow(params)

    expect(workflow[LTX_WAN.NAG_LTX]!.inputs!.nag_cond_video).toEqual([LTX_WAN.REFERENCE_AUDIO, 2])
    expect(workflow[LTX_WAN.NAG_LTX]!.inputs!.nag_cond_audio).toEqual([LTX_WAN.REFERENCE_AUDIO, 2])
  })

  it('does not create reference audio nodes when no audio', async () => {
    const workflow = await buildLtxWanWorkflow(DEFAULT_PARAMS)

    expect(workflow[LTX_WAN.LOAD_AUDIO]).toBeUndefined()
    expect(workflow[LTX_WAN.REFERENCE_AUDIO]).toBeUndefined()
  })

  it('removes audio norm when disabled', async () => {
    mockSettings.mockResolvedValueOnce(makeSettings({ audioNormEnabled: false }))
    const workflow = await buildLtxWanWorkflow(DEFAULT_PARAMS)

    expect(workflow[LTX_WAN.AUDIO_NORM]).toBeUndefined()
    expect(workflow[LTX_WAN.CFG_GUIDER]!.inputs!.model).toEqual([LTX_WAN.NAG_LTX, 0])
  })

  it('removes VFI nodes when disabled', async () => {
    mockSettings.mockResolvedValueOnce(makeSettings({ vfiEnabled: false }))
    const workflow = await buildLtxWanWorkflow(DEFAULT_PARAMS)

    expect(workflow[LTX_WAN.VFI]).toBeUndefined()
    expect(workflow[LTX_WAN.RIFE_MODEL_LOADER]).toBeUndefined()
    expect(workflow[LTX_WAN.RIFE_CUSTOM_CONFIG]).toBeUndefined()
    expect(workflow[LTX_WAN.VFI_MULTIPLIER]).toBeUndefined()
  })

  it('removes RTX when disabled', async () => {
    mockSettings.mockResolvedValueOnce(makeSettings({ rtxEnabled: false }))
    const workflow = await buildLtxWanWorkflow(DEFAULT_PARAMS)

    expect(workflow[LTX_WAN.RTX_SUPER_RES]).toBeUndefined()
    expect(workflow[LTX_WAN.VIDEO_OUTPUT]!.inputs!.images).toEqual([LTX_WAN.VFI, 0])
  })

  it('wires output to VAE_DECODE_WAN when both VFI and RTX disabled', async () => {
    mockSettings.mockResolvedValueOnce(makeSettings({ vfiEnabled: false, rtxEnabled: false }))
    const workflow = await buildLtxWanWorkflow(DEFAULT_PARAMS)

    expect(workflow[LTX_WAN.VIDEO_OUTPUT]!.inputs!.images).toEqual([LTX_WAN.VAE_DECODE_WAN, 0])
  })

  it('uses VFI frame rate when VFI enabled', async () => {
    const workflow = await buildLtxWanWorkflow(DEFAULT_PARAMS)

    expect(workflow[LTX_WAN.VIDEO_OUTPUT]!.inputs!.frame_rate).toEqual([LTX_WAN.VFI_FRAME_RATE, 1])
  })

  it('uses base frame rate when VFI disabled', async () => {
    mockSettings.mockResolvedValueOnce(makeSettings({ vfiEnabled: false }))
    const workflow = await buildLtxWanWorkflow(DEFAULT_PARAMS)

    expect(workflow[LTX_WAN.VIDEO_OUTPUT]!.inputs!.frame_rate).toEqual([LTX_WAN.FRAME_RATE, 2])
  })

  it('removes RIFE custom config when profile is not custom', async () => {
    mockSettings.mockResolvedValueOnce(makeSettings({ rifeResolutionProfile: '720p' }))
    const workflow = await buildLtxWanWorkflow(DEFAULT_PARAMS)

    expect(workflow[LTX_WAN.RIFE_CUSTOM_CONFIG]).toBeUndefined()
  })
})
