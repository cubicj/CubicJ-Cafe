import { vi } from 'vitest'

vi.mock('@/lib/database/system-settings', () => ({
  getLtxSettings: vi.fn().mockResolvedValue({
    unet: 'test-unet.safetensors',
    weightDtype: 'fp8',
    clipGguf: 'test-clip.gguf',
    clipEmbeddings: 'test-embeddings.safetensors',
    audioVae: 'test-audio-vae.safetensors',
    videoVae: 'test-video-vae.safetensors',
    loraEnabled: true,
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
    videoFormat: 'video/h264-mp4',
    videoPixFmt: 'yuv420p',
    negativePrompt: 'test negative prompt',
    idLoraName: 'test-id-lora.safetensors',
    idLoraStrength: 0.8,
    identityGuidanceScale: 3.0,
    identityStartPercent: 0.0,
    identityEndPercent: 1.0,
  }),
}))

import type { LtxGenerationParams } from '@/lib/comfyui/workflows/types'
import type { LoRAPresetData } from '@/types/lora'
import { buildLtxWorkflow } from '@/lib/comfyui/workflows/ltx/builder'

const baseParams: LtxGenerationParams = {
  model: 'ltx',
  prompt: 'a cat dancing on the moon',
  inputImage: 'test-image.png',
}

describe('buildLtxWorkflow', () => {
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
    expect(workflow['319']!.inputs!.filename_prefix).toBe('LTX/test-image')
  })

  it('strips image extension from filename prefix', async () => {
    const params: LtxGenerationParams = { ...baseParams, inputImage: 'photo.jpg' }
    const workflow = await buildLtxWorkflow(params)
    expect(workflow['319']!.inputs!.filename_prefix).toBe('LTX/photo')
  })

  describe('end image handling', () => {
    it('sets end image in node 260 when provided', async () => {
      const params: LtxGenerationParams = { ...baseParams, endImage: 'end-photo.png' }
      const workflow = await buildLtxWorkflow(params)
      expect(workflow['260']!.inputs!.image).toBe('end-photo.png')
    })

    it('keeps two-image mode in node 265 when endImage provided', async () => {
      const params: LtxGenerationParams = { ...baseParams, endImage: 'end-photo.png' }
      const workflow = await buildLtxWorkflow(params)
      expect(workflow['265']!.inputs!['num_images']).toBe('2')
      expect(workflow['265']!.inputs!['num_images.image_2']).toBeDefined()
    })

    it('switches to single-image mode when no endImage', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['265']!.inputs!['num_images']).toBe('1')
      expect(workflow['265']!.inputs!['num_images.image_2']).toBeUndefined()
      expect(workflow['265']!.inputs!['num_images.index_2']).toBeUndefined()
      expect(workflow['265']!.inputs!['num_images.strength_2']).toBeUndefined()
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

      expect(workflow['296']).toBeUndefined()
      expect(workflow['400']).toBeDefined()
      expect(workflow['400']!.class_type).toBe('LoraLoaderModelOnly')
      expect(workflow['400']!.inputs!.model).toEqual(['298', 0])
      expect(workflow['317']!.inputs!.model).toEqual(['400', 0])
    })

    it('removes placeholder and connects 317 directly to 298 when no preset', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['400']).toBeUndefined()
      expect(workflow['296']).toBeUndefined()
      expect(workflow['317']!.inputs!.model).toEqual(['298', 0])
    })
  })

  describe('settings injection', () => {
    it('injects model names into correct nodes', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['297']!.inputs!.unet_name).toBe('test-unet.safetensors')
      expect(workflow['297']!.inputs!.weight_dtype).toBe('fp8')
      expect(workflow['47']!.inputs!.clip_name1).toBe('test-clip.gguf')
      expect(workflow['47']!.inputs!.clip_name2).toBe('test-embeddings.safetensors')
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

    it('injects sigmas into node 335', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['335']!.inputs!.sigmas).toBe('1.0, 0.5, 0.0')
    })

    it('injects audio normalization into node 317', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['317']!.inputs!.audio_normalization_factors).toBe('1,1,1')
    })

    it('injects duration into node 103', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['103']!.inputs!.value).toBe(4)
    })

    it('injects frame rate with INT and FLOAT variants', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['11']!.inputs!.value).toBe(16)
      expect(workflow['12']!.inputs!.value).toBe(16)
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

    it('injects VFI settings into nodes 337/339', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['337']!.inputs!.ckpt_name).toBe('test-vfi-checkpoint')
      expect(workflow['337']!.inputs!.clear_cache_after_n_frames).toBe(100)
      expect(workflow['339']!.inputs!.value).toBe(2)
    })

    it('injects CRF into node 319', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['319']!.inputs!.crf).toBe(20)
    })
  })

  describe('structural integrity', () => {
    it('preserves all critical nodes including VFI pipeline', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      const criticalNodes = ['1', '2', '5', '6', '11', '12', '16', '20', '47', '72', '86', '87', '103', '265', '297', '317', '319', '322', '335', '336', '337', '339', '340']
      for (const nodeId of criticalNodes) {
        expect(workflow[nodeId], `node ${nodeId} should exist`).toBeDefined()
      }
    })

    it('connects VFI pipeline correctly: VAEDecode → VRAM → VFI → RTX', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['336']!.inputs!.image_pass).toEqual(['333', 0])
      expect(workflow['337']!.inputs!.frames).toEqual(['336', 1])
      expect(workflow['322']!.inputs!.images).toEqual(['337', 0])
    })

    it('connects VideoCombine frame_rate to VFI math expression', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['319']!.inputs!.frame_rate).toEqual(['340', 1])
    })
  })
})
