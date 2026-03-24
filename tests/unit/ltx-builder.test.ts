import { vi } from 'vitest'

vi.mock('@/lib/database/system-settings', () => ({
  getLtxSettings: vi.fn().mockResolvedValue({
    loraEnabled: true,
    cfg: 1,
    steps: 30,
    nagScale: 5,
    duration: 97,
    megapixels: 0.5,
    imgCompression: 35,
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

    const seeds1 = [w1['16']!.inputs!.noise_seed, w1['32']!.inputs!.noise_seed]
    const seeds2 = [w2['16']!.inputs!.noise_seed, w2['32']!.inputs!.noise_seed]

    expect(seeds1[0]).not.toBe(seeds2[0])
    expect(seeds1[1]).not.toBe(seeds2[1])
  })

  it('sets filename prefix with LTX/ prefix', async () => {
    const workflow = await buildLtxWorkflow(baseParams)
    expect(workflow['38']!.inputs!.filename_prefix).toBe('LTX/test-image')
  })

  it('strips image extension from filename prefix', async () => {
    const params: LtxGenerationParams = { ...baseParams, inputImage: 'photo.jpg' }
    const workflow = await buildLtxWorkflow(params)
    expect(workflow['38']!.inputs!.filename_prefix).toBe('LTX/photo')
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
      expect(workflow['267']).toBeUndefined()
    })

    it('preserves start image preprocess node 266 when no endImage', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['266']).toBeDefined()
      expect(workflow['266']!.class_type).toBe('LTXVPreprocess')
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
      expect(workflow['268']!.inputs!.model).toEqual(['400', 0])
    })

    it('removes placeholder and connects 268 directly to 298 when no preset', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['400']).toBeUndefined()
      expect(workflow['296']).toBeUndefined()
      expect(workflow['268']!.inputs!.model).toEqual(['298', 0])
    })
  })
})
