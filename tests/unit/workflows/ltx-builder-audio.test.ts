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

vi.mock('@/lib/comfyui/workflows/ltx/lora-manager', () => ({
  applyLtxLoraChain: vi.fn(),
}))

import type { LtxGenerationParams } from '@/lib/comfyui/workflows/types'
import { buildLtxWorkflow } from '@/lib/comfyui/workflows/ltx/builder'
import { getLtxSettings } from '@/lib/database/system-settings'
import { applyLtxLoraChain } from '@/lib/comfyui/workflows/ltx/lora-manager'

const mockGetLtxSettings = vi.mocked(getLtxSettings)
const mockApplyLtxLoraChain = vi.mocked(applyLtxLoraChain)

function makeSettings(overrides = {}) {
  return {
    unet: 'test-unet.safetensors',
    weightDtype: 'fp8',
    clipGguf: 'test-clip.gguf',
    clipEmbeddings: 'test-embeddings.safetensors',
    audioVae: 'test-audio-vae.safetensors',
    videoVae: 'test-video-vae.safetensors',
    loraEnabled: false,
    sampler: 'test_sampler',
    nagScale: 5,
    nagAlpha: 0.3,
    nagTau: 1.5,
    duration: 4,
    frameRate: 16,
    megapixels: 0.5,
    resizeMultipleOf: 64,
    resizeUpscaleMethod: 'bilinear',
    rtxResizeType: 'fixed resolution',
    rtxScale: 1.5,
    rtxQuality: 'HIGH',
    vfiEnabled: true,
    vfiCheckpoint: 'test-vfi-checkpoint',
    vfiClearCache: 100,
    vfiMultiplier: 2,
    videoCrf: 20,
    videoFormat: 'video/h264-mp4',
    videoPixFmt: 'yuv420p',
    negativePrompt: 'test negative prompt',
    idLoraName: 'test-id-lora.safetensors',
    idLoraStrength: 0.8,
    identityGuidanceScale: 3.0,
    identityStartPercent: 0.0,
    identityEndPercent: 1.0,
    schedulerSteps: 4,
    schedulerMaxShift: 2.05,
    schedulerBaseShift: 0.95,
    schedulerStretch: true,
    schedulerTerminal: 0.1,
    sigmas2nd: '0.85, 0.725, 0.42, 0.18, 0.0',
    distilledLoraName: 'test-distilled-lora.safetensors',
    distilledLoraStrength: 0.6,
    upscaleModel: 'test-upscale-model.safetensors',
    colorMatchMethod: 'mkl',
    colorMatchStrength: 0.3,
    audioNorm1st: '1,1,0.7,1,1',
    audioNorm2nd: '1,1,0.5,1,1',
    ...overrides,
  }
}

const baseParams: LtxGenerationParams = {
  model: 'ltx',
  prompt: 'a cat dancing on the moon',
  inputImage: 'test-image.png',
}

describe('LTX builder — reference audio handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetLtxSettings.mockResolvedValue(makeSettings())
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

    it('creates ID LoRA node 296 with settings', async () => {
      const workflow = await buildLtxWorkflow(paramsWithAudio)
      expect(workflow['296']).toBeDefined()
      expect(workflow['296']!.class_type).toBe('LoraLoaderModelOnly')
      expect(workflow['296']!.inputs!.lora_name).toBe('test-id-lora.safetensors')
      expect(workflow['296']!.inputs!.strength_model).toBe(0.8)
    })

    it('creates ReferenceAudio node 348 with settings', async () => {
      const workflow = await buildLtxWorkflow(paramsWithAudio)
      expect(workflow['348']).toBeDefined()
      expect(workflow['348']!.class_type).toBe('LTXVReferenceAudio')
      expect(workflow['348']!.inputs!.identity_guidance_scale).toBe(3.0)
      expect(workflow['348']!.inputs!.start_percent).toBe(0.0)
      expect(workflow['348']!.inputs!.end_percent).toBe(1.0)
    })

    it('chains ID LoRA from TorchSettings when no user LoRA', async () => {
      const workflow = await buildLtxWorkflow(paramsWithAudio)
      expect(workflow['296']!.inputs!.model).toEqual(['354', 0])
      expect(workflow['348']!.inputs!.model).toEqual(['296', 0])
    })

    it('rewires NAG through ReferenceAudio', async () => {
      const workflow = await buildLtxWorkflow(paramsWithAudio)
      expect(workflow['72']!.inputs!.model).toEqual(['348', 0])
      expect(workflow['72']!.inputs!.nag_cond_video).toEqual(['348', 2])
      expect(workflow['72']!.inputs!.nag_cond_audio).toEqual(['348', 2])
    })

    it('rewires CFGGuider through ReferenceAudio', async () => {
      const workflow = await buildLtxWorkflow(paramsWithAudio)
      expect(workflow['355']!.inputs!.positive).toEqual(['348', 1])
      expect(workflow['355']!.inputs!.negative).toEqual(['348', 2])
    })

    it('rewires CFGGuider_2nd through ReferenceAudio', async () => {
      const workflow = await buildLtxWorkflow(paramsWithAudio)
      expect(workflow['407']!.inputs!.positive).toEqual(['348', 1])
      expect(workflow['407']!.inputs!.negative).toEqual(['348', 2])
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
      expect(workflow['296']).toBeUndefined()
      expect(workflow['348']).toBeUndefined()
      expect(workflow['350']).toBeUndefined()
    })

    it('NAG connects to TorchSettings directly', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['72']!.inputs!.model).toEqual(['354', 0])
      expect(workflow['72']!.inputs!.nag_cond_video).toEqual(['23', 1])
      expect(workflow['72']!.inputs!.nag_cond_audio).toEqual(['23', 1])
    })

    it('CFGGuider connects to LTXVConditioning directly', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['355']!.inputs!.positive).toEqual(['23', 0])
      expect(workflow['355']!.inputs!.negative).toEqual(['23', 1])
    })

    it('CFGGuider_2nd connects to LTXVConditioning directly', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['407']!.inputs!.positive).toEqual(['23', 0])
      expect(workflow['407']!.inputs!.negative).toEqual(['23', 1])
    })
  })

  describe('interaction with user LoRA chain', () => {
    it('chains ID LoRA after last user LoRA node', async () => {
      mockGetLtxSettings.mockResolvedValue(makeSettings({ loraEnabled: true }))
      mockApplyLtxLoraChain.mockImplementation(async (workflow) => {
        workflow['400'] = {
          inputs: {
            lora_name: 'user-lora.safetensors',
            strength_model: 0.7,
            model: ['354', 0],
          },
          class_type: 'LoraLoaderModelOnly',
          _meta: { title: 'Load LoRA' },
        }
        workflow['72']!.inputs!.model = ['400', 0]
      })

      const params: LtxGenerationParams = {
        ...baseParams,
        referenceAudio: 'voice-sample.wav',
        loraPreset: {
          presetId: '1',
          presetName: 'test',
          loraItems: [{
            loraFilename: 'user-lora.safetensors',
            loraName: 'UserLora',
            strength: 0.7,
            group: 'HIGH',
            order: 0,
          }],
        },
      }

      const workflow = await buildLtxWorkflow(params)

      expect(workflow['296']!.inputs!.model).toEqual(['400', 0])
      expect(workflow['348']!.inputs!.model).toEqual(['296', 0])
      expect(workflow['72']!.inputs!.model).toEqual(['348', 0])
    })
  })
})
