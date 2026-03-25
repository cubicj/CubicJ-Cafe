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
})
