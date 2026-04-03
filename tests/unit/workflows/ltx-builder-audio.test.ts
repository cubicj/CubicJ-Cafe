import { vi } from 'vitest'

vi.mock('@/lib/database/system-settings', () => ({
  getLtxSettings: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

import type { LtxGenerationParams } from '@/lib/comfyui/workflows/types'
import { buildLtxWorkflow } from '@/lib/comfyui/workflows/ltx/builder'
import { getLtxSettings } from '@/lib/database/system-settings'

const mockGetLtxSettings = vi.mocked(getLtxSettings)

const SHARED_SETTINGS = {
  clipGguf: 'fake-clip-r2d.gguf',
  clipEmbeddings: 'fake-embed-z4p.safetensors',
  audioVae: 'fake-audio-vae-w8.safetensors',
  videoVae: 'fake-video-vae-j3.safetensors',
  loraEnabled: false,
  sampler: 'fake_sampler_v2',
  clownEta: 1.0,
  clownBongmath: false,
  imgCompression: 6,
  duration: 6,
  frameRate: 12,
  megapixels: 0.35,
  resizeMultipleOf: 48,
  resizeUpscaleMethod: 'nearest',
  colorMatchEnabled: true,
  colorMatchMethod: 'wavelet',
  colorMatchStrength: 0.45,
  rtxEnabled: true,
  rtxResizeType: 'stretch fit',
  rtxScale: 2.0,
  rtxQuality: 'LOW',
  vfiEnabled: true,
  vfiMethod: 'rife',
  rifeModel: 'fake_rife_model_sim',
  rifePrecision: 'fp16',
  rifeResolutionProfile: 'medium',
  rifeCustomMinDim: 480,
  rifeCustomOptDim: 720,
  rifeCustomMaxDim: 960,
  gmfssModel: 'fake_gmfss_union',
  vfiClearCache: 200,
  vfiMultiplier: 3,
  videoCrf: 18,
  videoFormat: 'video/h265-mp4',
  videoPixFmt: 'yuv444p',
  negativePrompt: 'fake test negative',
  idLoraName: 'fake-id-lora-q5.safetensors',
  upscaleModel: 'fake-upscale-q8.safetensors',
  distilledLoraEnabled: false,
  distilledLoraName: 'fake-distilled-p3.safetensors',
  distilledLoraStrength: 0.45,
}

function make2PassSettings(overrides = {}) {
  return {
    passMode: '2pass' as const,
    ...SHARED_SETTINGS,
    unet: 'fake-unet-x7q.safetensors',
    weightDtype: 'fp4',
    nagScale: 3.5,
    nagAlpha: 0.15,
    nagTau: 1.8,
    audioNorm1st: '1,0.8,0.6,1,0.8',
    schedulerSteps: 6,
    schedulerMaxShift: 1.85,
    schedulerBaseShift: 0.75,
    schedulerStretch: false,
    schedulerTerminal: 0.15,
    idLoraStrength: 0.55,
    identityGuidanceScale: 2.5,
    identityStartPercent: 0.05,
    identityEndPercent: 0.75,
    unet2nd: 'fake-unet-2nd-k9m.safetensors',
    weightDtype2nd: 'bf8',
    nagScale2nd: 4.2,
    nagAlpha2nd: 0.18,
    nagTau2nd: 2.1,
    audioNorm2nd: '1,0.9,0.3,1,0.9',
    sigmas2nd: '0.92, 0.68, 0.35, 0.0',
    idLoraStrength2nd: 0.65,
    identityGuidanceScale2nd: 1.8,
    identityStartPercent2nd: 0.1,
    identityEndPercent2nd: 0.6,
    ...overrides,
  }
}

function make1PassSettings(overrides = {}) {
  return {
    passMode: '1pass' as const,
    ...SHARED_SETTINGS,
    unet: 'fake-unet-1p-m3n.safetensors',
    weightDtype: 'fp8',
    nagScale: 2.8,
    nagAlpha: 0.22,
    nagTau: 1.5,
    audioNormEnabled: false,
    audioNorm: '1,0.7,0.5,1,0.7',
    schedulerSteps: 10,
    schedulerMaxShift: 1.95,
    schedulerBaseShift: 0.85,
    schedulerStretch: false,
    schedulerTerminal: 0.12,
    idLoraStrength: 0.6,
    identityGuidanceScale: 2.2,
    identityStartPercent: 0.0,
    identityEndPercent: 0.9,
    ...overrides,
  }
}

const baseParams: LtxGenerationParams = {
  model: 'ltx',
  prompt: 'a cat dancing on the moon',
  inputImage: 'test-image.png',
}

describe('LTX builder — reference audio handling', () => {
  describe('2pass mode', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockGetLtxSettings.mockResolvedValue(make2PassSettings())
    })

    describe('when referenceAudio is provided', () => {
      const paramsWithAudio: LtxGenerationParams = {
        ...baseParams,
        referenceAudio: 'voice-sample.wav',
      }

      it('creates LoadAudio node 350', async () => {
        const workflow = await buildLtxWorkflow(paramsWithAudio)
        expect(workflow['350']).toBeDefined()
        expect(workflow['350']!.class_type).toBe('LoadAudio')
        expect(workflow['350']!.inputs!.audio).toBe('voice-sample.wav')
      })

      it('creates ReferenceAudio node 348 with settings', async () => {
        const workflow = await buildLtxWorkflow(paramsWithAudio)
        expect(workflow['348']).toBeDefined()
        expect(workflow['348']!.class_type).toBe('LTXVReferenceAudio')
        expect(workflow['348']!.inputs!.identity_guidance_scale).toBe(2.5)
        expect(workflow['348']!.inputs!.start_percent).toBe(0.05)
        expect(workflow['348']!.inputs!.end_percent).toBe(0.75)
      })

      it('connects ReferenceAudio(348).model from Power LoRA 1st', async () => {
        const workflow = await buildLtxWorkflow(paramsWithAudio)
        expect(workflow['348']!.inputs!.model).toEqual(['448', 0])
      })

      it('activates Power LoRA 448 lora_2 with ID LoRA', async () => {
        const workflow = await buildLtxWorkflow(paramsWithAudio)
        expect(workflow['448']!.inputs!['lora_2']).toEqual({
          on: true,
          lora: 'fake-id-lora-q5.safetensors',
          strength: 0.55,
        })
      })

      it('activates Power LoRA 452 lora_2 with ID LoRA 2nd strength', async () => {
        const workflow = await buildLtxWorkflow(paramsWithAudio)
        expect(workflow['452']!.inputs!['lora_2']).toEqual({
          on: true,
          lora: 'fake-id-lora-q5.safetensors',
          strength: 0.65,
        })
      })

      it('rewires NAG(72).model through ReferenceAudio', async () => {
        const workflow = await buildLtxWorkflow(paramsWithAudio)
        expect(workflow['72']!.inputs!.model).toEqual(['348', 0])
      })

      it('rewires CFGGuider(355) positive/negative through ReferenceAudio', async () => {
        const workflow = await buildLtxWorkflow(paramsWithAudio)
        expect(workflow['355']!.inputs!.positive).toEqual(['348', 1])
        expect(workflow['355']!.inputs!.negative).toEqual(['348', 2])
      })

      it('creates ReferenceAudio2nd node 441 with 2nd pass settings', async () => {
        const workflow = await buildLtxWorkflow(paramsWithAudio)
        expect(workflow['441']).toBeDefined()
        expect(workflow['441']!.class_type).toBe('LTXVReferenceAudio')
        expect(workflow['441']!.inputs!.identity_guidance_scale).toBe(1.8)
        expect(workflow['441']!.inputs!.start_percent).toBe(0.1)
        expect(workflow['441']!.inputs!.end_percent).toBe(0.6)
      })

      it('connects ReferenceAudio2nd(441).model from Power LoRA 2nd', async () => {
        const workflow = await buildLtxWorkflow(paramsWithAudio)
        expect(workflow['441']!.inputs!.model).toEqual(['452', 0])
      })

      it('rewires NAG_2ND(453).model through ReferenceAudio2nd', async () => {
        const workflow = await buildLtxWorkflow(paramsWithAudio)
        expect(workflow['453']!.inputs!.model).toEqual(['441', 0])
      })

      it('rewires CFGGuider_2ND(407) positive/negative through ReferenceAudio2nd', async () => {
        const workflow = await buildLtxWorkflow(paramsWithAudio)
        expect(workflow['407']!.inputs!.positive).toEqual(['441', 1])
        expect(workflow['407']!.inputs!.negative).toEqual(['441', 2])
      })

      it('connects ReferenceAudio conditioning from LTXVConditioning', async () => {
        const workflow = await buildLtxWorkflow(paramsWithAudio)
        expect(workflow['348']!.inputs!.positive).toEqual(['23', 0])
        expect(workflow['348']!.inputs!.negative).toEqual(['23', 1])
        expect(workflow['348']!.inputs!.reference_audio).toEqual(['350', 0])
        expect(workflow['348']!.inputs!.audio_vae).toEqual(['1', 0])
      })
    })

    describe('when referenceAudio is not provided', () => {
      it('does not create audio nodes', async () => {
        const workflow = await buildLtxWorkflow(baseParams)
        expect(workflow['348']).toBeUndefined()
        expect(workflow['350']).toBeUndefined()
        expect(workflow['441']).toBeUndefined()
      })

      it('NAG(72) connects to PowerLoRA(448) directly', async () => {
        const workflow = await buildLtxWorkflow(baseParams)
        expect(workflow['72']!.inputs!.model).toEqual(['448', 0])
      })

      it('NAG_2ND(453) connects to PowerLoRA(452) directly', async () => {
        const workflow = await buildLtxWorkflow(baseParams)
        expect(workflow['453']!.inputs!.model).toEqual(['452', 0])
      })

      it('CFGGuider(355) connects to LTXVConditioning directly', async () => {
        const workflow = await buildLtxWorkflow(baseParams)
        expect(workflow['355']!.inputs!.positive).toEqual(['23', 0])
        expect(workflow['355']!.inputs!.negative).toEqual(['23', 1])
      })

      it('CFGGuider_2ND(407) connects to LTXVConditioning directly', async () => {
        const workflow = await buildLtxWorkflow(baseParams)
        expect(workflow['407']!.inputs!.positive).toEqual(['23', 0])
        expect(workflow['407']!.inputs!.negative).toEqual(['23', 1])
      })

      it('Power LoRA lora_2 remains off (template default)', async () => {
        const workflow = await buildLtxWorkflow(baseParams)
        expect(workflow['448']!.inputs!['lora_2']).toEqual({ on: false, lora: 'PLACEHOLDER', strength: 0 })
        expect(workflow['452']!.inputs!['lora_2']).toEqual({ on: false, lora: 'PLACEHOLDER', strength: 0 })
      })
    })
  })

  describe('1pass mode — reference audio', () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mockGetLtxSettings.mockResolvedValue(make1PassSettings())
    })

    const paramsWithAudio: LtxGenerationParams = {
      ...baseParams,
      referenceAudio: 'voice-sample.wav',
    }

    it('creates LoadAudio and RefAudio for 1st pass only', async () => {
      const workflow = await buildLtxWorkflow(paramsWithAudio)
      expect(workflow['350']).toBeDefined()
      expect(workflow['350']!.class_type).toBe('LoadAudio')
      expect(workflow['348']).toBeDefined()
      expect(workflow['348']!.class_type).toBe('LTXVReferenceAudio')
      expect(workflow['441']).toBeUndefined()
    })

    it('activates PowerLoRA 448 lora_2, not 452', async () => {
      const workflow = await buildLtxWorkflow(paramsWithAudio)
      expect(workflow['448']!.inputs!['lora_2']).toEqual({
        on: true,
        lora: 'fake-id-lora-q5.safetensors',
        strength: 0.6,
      })
      expect(workflow['452']).toBeUndefined()
    })

    it('connects RefAudio(348).model from PowerLoRA 448', async () => {
      const workflow = await buildLtxWorkflow(paramsWithAudio)
      expect(workflow['348']!.inputs!.model).toEqual(['448', 0])
    })

    it('rewires NAG(72) and CFG(355) through RefAudio', async () => {
      const workflow = await buildLtxWorkflow(paramsWithAudio)
      expect(workflow['72']!.inputs!.model).toEqual(['348', 0])
      expect(workflow['355']!.inputs!.positive).toEqual(['348', 1])
      expect(workflow['355']!.inputs!.negative).toEqual(['348', 2])
    })

    it('does not create 2nd pass RefAudio nodes', async () => {
      const workflow = await buildLtxWorkflow(paramsWithAudio)
      expect(workflow['441']).toBeUndefined()
      expect(workflow['453']).toBeUndefined()
      expect(workflow['407']).toBeUndefined()
    })

    it('AudioNorm enabled — keeps node 457 in audio chain', async () => {
      mockGetLtxSettings.mockResolvedValue(make1PassSettings({ audioNormEnabled: true }))
      const workflow = await buildLtxWorkflow(paramsWithAudio)
      expect(workflow['457']).toBeDefined()
      expect(workflow['457']!.inputs!.audio_normalization_factors).toBe('1,0.7,0.5,1,0.7')
    })
  })
})
