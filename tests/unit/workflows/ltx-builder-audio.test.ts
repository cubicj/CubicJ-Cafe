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
    sigmas: '1.0, 0.5, 0.0',
    audioNorm: '1,1,1',
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
    negativePrompt: 'test negative prompt',
    idLoraName: 'test-id-lora.safetensors',
    idLoraStrength: 0.8,
    identityGuidanceScale: 3.0,
    identityStartPercent: 0.0,
    identityEndPercent: 1.0,
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

    it('sets audio filename in LoadAudio node', async () => {
      const workflow = await buildLtxWorkflow(paramsWithAudio)
      expect(workflow['350']!.inputs!.audio).toBe('voice-sample.wav')
    })

    it('sets ID LoRA name and strength from settings', async () => {
      const workflow = await buildLtxWorkflow(paramsWithAudio)
      expect(workflow['349']!.inputs!.lora_name).toBe('test-id-lora.safetensors')
      expect(workflow['349']!.inputs!.strength_model).toBe(0.8)
    })

    it('sets ReferenceAudio identity params from settings', async () => {
      const workflow = await buildLtxWorkflow(paramsWithAudio)
      expect(workflow['348']!.inputs!.identity_guidance_scale).toBe(3.0)
      expect(workflow['348']!.inputs!.start_percent).toBe(0.0)
      expect(workflow['348']!.inputs!.end_percent).toBe(1.0)
    })

    it('rewires conditioning through ReferenceAudio node', async () => {
      const workflow = await buildLtxWorkflow(paramsWithAudio)
      expect(workflow['23']!.inputs!.positive).toEqual(['348', 1])
      expect(workflow['23']!.inputs!.negative).toEqual(['348', 2])
    })

    it('chains ReferenceAudio into model path before AudioNorm', async () => {
      const workflow = await buildLtxWorkflow(paramsWithAudio)
      expect(workflow['348']!.inputs!.model).toEqual(['349', 0])
      expect(workflow['317']!.inputs!.model).toEqual(['348', 0])
    })

    it('connects ID LoRA to SageAttention when no user LoRA', async () => {
      const workflow = await buildLtxWorkflow(paramsWithAudio)
      expect(workflow['349']!.inputs!.model).toEqual(['298', 0])
    })
  })

  describe('when referenceAudio is not provided', () => {
    it('removes all reference audio nodes', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['348']).toBeUndefined()
      expect(workflow['349']).toBeUndefined()
      expect(workflow['350']).toBeUndefined()
    })

    it('preserves original conditioning wiring', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['23']!.inputs!.positive).toEqual(['59', 0])
      expect(workflow['23']!.inputs!.negative).toEqual(['61', 0])
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
            model: ['298', 0],
          },
          class_type: 'LoraLoaderModelOnly',
          _meta: { title: 'Load LoRA' },
        }
        workflow['317']!.inputs!.model = ['400', 0]
        delete workflow['296']
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

      expect(workflow['349']!.inputs!.model).toEqual(['400', 0])
      expect(workflow['348']!.inputs!.model).toEqual(['349', 0])
      expect(workflow['317']!.inputs!.model).toEqual(['348', 0])
    })
  })
})
