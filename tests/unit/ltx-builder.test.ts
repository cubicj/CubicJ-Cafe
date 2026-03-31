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
import type { LoRAPresetData } from '@/types/lora'
import { buildLtxWorkflow } from '@/lib/comfyui/workflows/ltx/builder'
import { getLtxSettings } from '@/lib/database/system-settings'

const mockGetLtxSettings = vi.mocked(getLtxSettings)

function makeSettings(overrides = {}) {
  return {
    unet: 'test-unet.safetensors',
    weightDtype: 'fp8',
    clipGguf: 'test-clip.gguf',
    clipEmbeddings: 'test-embeddings.safetensors',
    audioVae: 'test-audio-vae.safetensors',
    videoVae: 'test-video-vae.safetensors',
    loraEnabled: true,
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
    ...overrides,
  }
}

const baseParams: LtxGenerationParams = {
  model: 'ltx',
  prompt: 'a cat dancing on the moon',
  inputImage: 'test-image.png',
}

describe('buildLtxWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetLtxSettings.mockResolvedValue(makeSettings())
  })

  describe('settings injection', () => {
    it('sets prompt text in node 5', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['5']!.inputs!.text).toBe('a cat dancing on the moon')
    })

    it('sets input image in node 87', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['87']!.inputs!.image).toBe('test-image.png')
    })

    it('generates random seeds that differ between calls', async () => {
      const w1 = await buildLtxWorkflow(baseParams)
      const w2 = await buildLtxWorkflow(baseParams)
      expect(w1['16']!.inputs!.noise_seed).not.toBe(w2['16']!.inputs!.noise_seed)
    })

    it('sets filename prefix with LTX/ prefix', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['345']!.inputs!.filename_prefix).toBe('LTX/test-image')
    })

    it('strips image extension from filename prefix', async () => {
      const params: LtxGenerationParams = { ...baseParams, inputImage: 'photo.jpg' }
      const workflow = await buildLtxWorkflow(params)
      expect(workflow['345']!.inputs!.filename_prefix).toBe('LTX/photo')
    })

    it('injects model names into correct nodes', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['297']!.inputs!.unet_name).toBe('test-unet.safetensors')
      expect(workflow['297']!.inputs!.weight_dtype).toBe('fp8')
      expect(workflow['390']!.inputs!.clip_name1).toBe('test-clip.gguf')
      expect(workflow['390']!.inputs!.clip_name2).toBe('test-embeddings.safetensors')
      expect(workflow['1']!.inputs!.vae_name).toBe('test-audio-vae.safetensors')
      expect(workflow['2']!.inputs!.vae_name).toBe('test-video-vae.safetensors')
    })

    it('injects negative prompt into node 6', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['6']!.inputs!.text).toBe('test negative prompt')
    })

    it('injects NAG settings into node 72', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['72']!.inputs!.nag_scale).toBe(5)
      expect(workflow['72']!.inputs!.nag_alpha).toBe(0.3)
      expect(workflow['72']!.inputs!.nag_tau).toBe(1.5)
    })

    it('injects sampler into node 20', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['20']!.inputs!.sampler_name).toBe('test_sampler')
    })

    it('injects duration into node 103', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['103']!.inputs!.value).toBe(4)
    })

    it('injects frame rate in node 416', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['416']!.inputs!.number).toBe(16)
    })

    it('injects resize settings into node 86', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['86']!.inputs!.megapixels).toBe(0.5)
      expect(workflow['86']!.inputs!.multiple_of).toBe(64)
      expect(workflow['86']!.inputs!.upscale_method).toBe('bilinear')
    })

    it('injects RTX settings into node 322', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['322']!.inputs!.resize_type).toBe('fixed resolution')
      expect(workflow['322']!.inputs!['resize_type.scale']).toBe(1.5)
      expect(workflow['322']!.inputs!.quality).toBe('HIGH')
    })

    it('injects VFI settings into nodes 395/339', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['395']!.inputs!.ckpt_name).toBe('test-vfi-checkpoint')
      expect(workflow['395']!.inputs!.clear_cache_after_n_frames).toBe(100)
      expect(workflow['339']!.inputs!.value).toBe(2)
    })

    it('injects CRF into node 345', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['345']!.inputs!.crf).toBe(20)
    })

    it('injects scheduler settings into node 403', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['403']!.inputs!.steps).toBe(4)
      expect(workflow['403']!.inputs!.max_shift).toBe(2.05)
      expect(workflow['403']!.inputs!.base_shift).toBe(0.95)
      expect(workflow['403']!.inputs!.stretch).toBe(true)
      expect(workflow['403']!.inputs!.terminal).toBe(0.1)
    })

    it('injects sigmas 2nd into node 431', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['431']!.inputs!.sigmas).toBe('0.85, 0.725, 0.42, 0.18, 0.0')
    })

    it('injects distilled LoRA into node 433', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['433']!.inputs!.lora_name).toBe('test-distilled-lora.safetensors')
      expect(workflow['433']!.inputs!.strength_model).toBe(0.6)
    })

    it('injects upscale model into node 421', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['421']!.inputs!.model_name).toBe('test-upscale-model.safetensors')
    })

    it('injects color match into node 437', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['437']!.inputs!.method).toBe('mkl')
      expect(workflow['437']!.inputs!.strength).toBe(0.3)
    })
  })

  describe('end image handling', () => {
    it('sets end image in node 260 when provided', async () => {
      const params: LtxGenerationParams = { ...baseParams, endImage: 'end-photo.png' }
      const workflow = await buildLtxWorkflow(params)
      expect(workflow['260']!.inputs!.image).toBe('end-photo.png')
    })

    it('keeps two-image mode in both nodes 265 and 417 when endImage provided', async () => {
      const params: LtxGenerationParams = { ...baseParams, endImage: 'end-photo.png' }
      const workflow = await buildLtxWorkflow(params)
      expect(workflow['265']!.inputs!['num_images']).toBe('2')
      expect(workflow['265']!.inputs!['num_images.image_2']).toBeDefined()
      expect(workflow['417']!.inputs!['num_images']).toBe('2')
      expect(workflow['417']!.inputs!['num_images.image_2']).toBeDefined()
    })

    it('switches to single-image mode in both 265 and 417 when no endImage', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['265']!.inputs!['num_images']).toBe('1')
      expect(workflow['265']!.inputs!['num_images.image_2']).toBeUndefined()
      expect(workflow['265']!.inputs!['num_images.index_2']).toBeUndefined()
      expect(workflow['265']!.inputs!['num_images.strength_2']).toBeUndefined()
      expect(workflow['417']!.inputs!['num_images']).toBe('1')
      expect(workflow['417']!.inputs!['num_images.image_2']).toBeUndefined()
      expect(workflow['417']!.inputs!['num_images.index_2']).toBeUndefined()
      expect(workflow['417']!.inputs!['num_images.strength_2']).toBeUndefined()
    })

    it('removes end image nodes when no endImage', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['260']).toBeUndefined()
      expect(workflow['261']).toBeUndefined()
      expect(workflow['264']).toBeUndefined()
    })
  })

  describe('LoRA preset integration', () => {
    it('applies LoRA chain when preset provided', async () => {
      const { applyLtxLoraChain } = await import('@/lib/comfyui/workflows/ltx/lora-manager')
      const mockApplyLoraChain = vi.mocked(applyLtxLoraChain)
      mockApplyLoraChain.mockImplementation(async (workflow) => {
        workflow['400'] = {
          inputs: {
            lora_name: 'LTX\\Custom\\style.safetensors',
            strength_model: 0.7,
            model: ['354', 0],
          },
          class_type: 'LoraLoaderModelOnly',
          _meta: { title: 'Load LoRA' },
        }
        workflow['72']!.inputs!.model = ['400', 0]
      })

      const loraPreset: LoRAPresetData = {
        presetId: '1',
        presetName: 'test',
        loraItems: [{
          loraFilename: 'LTX\\Custom\\style.safetensors',
          loraName: 'Style',
          strength: 0.7,
          group: 'HIGH',
          order: 0,
        }],
      }
      const params: LtxGenerationParams = { ...baseParams, loraPreset }
      const workflow = await buildLtxWorkflow(params)

      expect(workflow['400']).toBeDefined()
      expect(workflow['400']!.class_type).toBe('LoraLoaderModelOnly')
      expect(workflow['400']!.inputs!.model).toEqual(['354', 0])
      expect(workflow['72']!.inputs!.model).toEqual(['400', 0])
    })

    it('connects NAG directly to TorchSettings when no preset', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['400']).toBeUndefined()
      expect(workflow['72']!.inputs!.model).toEqual(['354', 0])
    })
  })

  describe('structural integrity', () => {
    it('preserves all critical nodes', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      const criticalNodes = [
        '1', '2', '5', '6', '16', '20', '72', '86', '87', '103',
        '265', '297', '298', '322', '333', '339', '340', '345',
        '354', '355', '373', '384', '390', '395', '403', '406',
        '407', '409', '416', '417', '418', '419', '421', '422',
        '431', '433', '437',
      ]
      for (const nodeId of criticalNodes) {
        expect(workflow[nodeId], `node ${nodeId} should exist`).toBeDefined()
      }
    })

    it('does not contain removed nodes', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      const removedNodes = [
        '11', '12', '335',
        '19', '47', '59', '61', '82', '317', '319', '334', '336', '337', '362', '378',
      ]
      for (const nodeId of removedNodes) {
        expect(workflow[nodeId], `node ${nodeId} should not exist`).toBeUndefined()
      }
    })

    it('connects 1st pass chain: Sampler → VRAM → SeparateAV_1st → Upsampler → ImgToVideo_2nd → ConcatAV_2nd', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['17']!.inputs!.guider).toEqual(['355', 0])
      expect(workflow['373']!.inputs!.any_input).toEqual(['17', 0])
      expect(workflow['418']!.inputs!.av_latent).toEqual(['373', 0])
      expect(workflow['422']!.inputs!.samples).toEqual(['418', 0])
      expect(workflow['417']!.inputs!.latent).toEqual(['422', 0])
      expect(workflow['419']!.inputs!.video_latent).toEqual(['417', 0])
      expect(workflow['419']!.inputs!.audio_latent).toEqual(['418', 1])
    })

    it('connects 2nd pass chain: Sampler_2nd → VRAM_2nd → SeparateAV', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['406']!.inputs!.guider).toEqual(['407', 0])
      expect(workflow['406']!.inputs!.sigmas).toEqual(['431', 0])
      expect(workflow['406']!.inputs!.latent_image).toEqual(['419', 0])
      expect(workflow['409']!.inputs!.any_input).toEqual(['406', 0])
      expect(workflow['384']!.inputs!.av_latent).toEqual(['409', 0])
    })

    it('connects model chain: NAG → DistilledLoRA → CFGGuider', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['72']!.inputs!.model).toEqual(['354', 0])
      expect(workflow['433']!.inputs!.model).toEqual(['72', 0])
      expect(workflow['355']!.inputs!.model).toEqual(['433', 0])
    })

    it('connects 2nd pass guider with model and conditioning', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['407']!.inputs!.model).toEqual(['72', 0])
      expect(workflow['407']!.inputs!.positive).toEqual(['23', 0])
      expect(workflow['407']!.inputs!.negative).toEqual(['23', 1])
    })

    it('connects VAEDecode and AudioDecode from SeparateAV', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['333']!.inputs!.samples).toEqual(['384', 0])
      expect(workflow['321']!.inputs!.samples).toEqual(['384', 1])
    })

    it('connects ColorMatch from VAEDecode and input image', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['437']!.inputs!.image_target).toEqual(['333', 0])
      expect(workflow['437']!.inputs!.image_ref).toEqual(['87', 0])
    })

    it('connects VFI from ColorMatch', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['395']!.inputs!.frames).toEqual(['437', 0])
    })

    it('connects RTX from VFI', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['322']!.inputs!.images).toEqual(['395', 0])
    })

    it('connects VideoCombine frame_rate to VFI math expression', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['345']!.inputs!.frame_rate).toEqual(['340', 1])
    })

    it('connects NAG with both video and audio conditioning', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['72']!.inputs!.nag_cond_video).toEqual(['23', 1])
      expect(workflow['72']!.inputs!.nag_cond_audio).toEqual(['23', 1])
    })

    it('connects CFGGuider with conditioning', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['355']!.inputs!.positive).toEqual(['23', 0])
      expect(workflow['355']!.inputs!.negative).toEqual(['23', 1])
    })
  })

  describe('VFI bypass', () => {
    beforeEach(() => {
      mockGetLtxSettings.mockResolvedValue(makeSettings({ vfiEnabled: false }))
    })

    it('removes VFI nodes when disabled', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['395']).toBeUndefined()
      expect(workflow['339']).toBeUndefined()
      expect(workflow['340']).toBeUndefined()
    })

    it('connects ColorMatch directly to RTX', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['322']!.inputs!.images).toEqual(['437', 0])
    })

    it('connects VideoCombine frame_rate to FRAME_RATE node', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['345']!.inputs!.frame_rate).toEqual(['416', 2])
    })
  })
})
