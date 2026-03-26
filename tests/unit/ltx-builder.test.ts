import { vi } from 'vitest'

vi.mock('@/lib/database/system-settings', () => ({
  getLtxSettings: vi.fn().mockResolvedValue({
    unet: 'test-unet.safetensors',
    weightDtype: 'default',
    clipGguf: 'test-clip.gguf',
    clipEmbeddings: 'test-embeddings.safetensors',
    audioVae: 'test-audio-vae.safetensors',
    videoVae: 'test-video-vae.safetensors',
    loraEnabled: true,
    sampler: 'test_sampler',
    sigmas: '1.0, 0.9, 0.8, 0.7, 0.975, 0.6, 0.725, 0.3, 0.0',
    audioNorm: '1,1,1',
    nagScale: 5,
    nagAlpha: 0.3,
    nagTau: 1.5,
    duration: 5,
    frameRate: 16,
    megapixels: 0.5,
    resizeMultipleOf: 32,
    resizeUpscaleMethod: 'lanczos',
    rtxResizeType: 'scale by multiplier',
    rtxScale: 2,
    rtxQuality: 'ULTRA',
    negativePrompt: 'test negative prompt',
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
      expect(workflow['297']!.inputs!.weight_dtype).toBe('default')
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
      expect(workflow['72']!.inputs!.nag_scale).toBe(9)
      expect(workflow['72']!.inputs!.nag_alpha).toBe(0.25)
      expect(workflow['72']!.inputs!.nag_tau).toBe(2.5)
    })

    it('injects sampler into node 20', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['20']!.inputs!.sampler_name).toBe('test_sampler')
    })

    it('injects sigmas into node 335', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['335']!.inputs!.sigmas).toContain('1.0')
    })

    it('injects audio normalization into node 317', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['317']!.inputs!.audio_normalization_factors).toBe('1,1,1')
    })

    it('injects duration into node 103', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['103']!.inputs!.value).toBe(5)
    })

    it('injects frame rate with INT and FLOAT variants', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['11']!.inputs!.value).toBe(24)
      expect(workflow['12']!.inputs!.value).toBe(24)
    })

    it('injects resize settings into node 86', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['86']!.inputs!.megapixels).toBe(0.66)
      expect(workflow['86']!.inputs!.multiple_of).toBe(32)
      expect(workflow['86']!.inputs!.upscale_method).toBe('lanczos')
    })

    it('injects RTX settings into node 322', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['322']!.inputs!.resize_type).toBe('scale by multiplier')
      expect(workflow['322']!.inputs!['resize_type.scale']).toBe(2)
      expect(workflow['322']!.inputs!.quality).toBe('ULTRA')
    })
  })

  describe('structural integrity', () => {
    it('preserves all critical nodes', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      const criticalNodes = ['1', '2', '5', '6', '11', '12', '16', '20', '47', '72', '86', '87', '103', '265', '297', '317', '319', '322', '335']
      for (const nodeId of criticalNodes) {
        expect(workflow[nodeId], `node ${nodeId} should exist`).toBeDefined()
      }
    })
  })
})
