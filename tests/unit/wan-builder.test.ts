import { vi } from 'vitest'

vi.mock('@/lib/database/system-settings', () => ({
  getWanSettings: vi.fn().mockResolvedValue({
    loraEnabled: false,
    megapixels: 0.5,
    shift: 5,
    nagScale: 5,
    stepsHigh: 3,
    stepsLow: 3,
    length: 121,
    sampler: 'euler',
    negativePrompt: 'test negative prompt',
  }),
}))

vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}))

import type { WanGenerationParams } from '@/lib/comfyui/workflows/types'
import { buildWanWorkflow } from '@/lib/comfyui/workflows/wan/builder'

const baseParams: WanGenerationParams = {
  model: 'wan',
  prompt: 'a dragon flying through clouds',
  inputImage: 'dragon-input.png',
}

describe('buildWanWorkflow', () => {
  it('produces a valid workflow object', async () => {
    const workflow = await buildWanWorkflow(baseParams)
    expect(workflow).toBeDefined()
    expect(workflow).not.toBeNull()
    expect(typeof workflow).toBe('object')
  })

  it('sets random seed in node 3', async () => {
    const w1 = await buildWanWorkflow(baseParams)
    const w2 = await buildWanWorkflow(baseParams)

    expect(typeof w1['3']!.inputs!.noise_seed).toBe('number')
    expect(w1['3']!.inputs!.noise_seed).not.toBe(w2['3']!.inputs!.noise_seed)
  })

  it('sets filename prefix with WAN/ prefix based on inputImage', async () => {
    const workflow = await buildWanWorkflow(baseParams)
    expect(workflow['21']!.inputs!.filename_prefix).toBe('WAN/dragon-input')
  })

  it('strips image extension from filename prefix', async () => {
    const params: WanGenerationParams = { ...baseParams, inputImage: 'photo.jpeg' }
    const workflow = await buildWanWorkflow(params)
    expect(workflow['21']!.inputs!.filename_prefix).toBe('WAN/photo')
  })

  it('sets prompt in node 10', async () => {
    const workflow = await buildWanWorkflow(baseParams)
    expect(workflow['10']!.inputs!.text).toBe('a dragon flying through clouds')
  })

  it('sets start image in node 5', async () => {
    const workflow = await buildWanWorkflow(baseParams)
    expect(workflow['5']!.inputs!.image).toBe('dragon-input.png')
  })

  it('uses fixed 121 frame length in WanFirstLastFrameToVideo nodes when endImage provided', async () => {
    const params: WanGenerationParams = { ...baseParams, endImage: 'end.png' }
    const workflow = await buildWanWorkflow(params)
    expect(workflow['31']!.inputs!.length).toBe(121)
    expect(workflow['30']!.inputs!.length).toBe(121)
  })

  it('sets end image when provided', async () => {
    const params: WanGenerationParams = { ...baseParams, endImage: 'end.png' }
    const workflow = await buildWanWorkflow(params)
    expect(workflow['11']!.inputs!.image).toBe('end.png')
  })

  it('removes end image nodes when no end image', async () => {
    const workflow = await buildWanWorkflow(baseParams)
    expect(workflow['11']).toBeUndefined()
    expect(workflow['18']).toBeUndefined()
  })

  it('removes end_image from WanFirstLastFrameToVideo when no end image', async () => {
    const workflow = await buildWanWorkflow(baseParams)
    expect(workflow['30']!.inputs!.end_image).toBeUndefined()
    expect(workflow['31']!.inputs!.end_image).toBeUndefined()
  })

  describe('settings injection', () => {
    it('injects negative prompt into node 41', async () => {
      const workflow = await buildWanWorkflow(baseParams)
      expect(workflow['41']!.inputs!.text).toBe('test negative prompt')
    })

    it('injects NAG settings into both pass nodes', async () => {
      const workflow = await buildWanWorkflow(baseParams)
      expect(workflow['20']!.inputs!.nag_scale).toBe(7)
      expect(workflow['19']!.inputs!.nag_scale).toBe(7)
    })

    it('injects megapixels into resize node', async () => {
      const workflow = await buildWanWorkflow(baseParams)
      expect(workflow['25']!.inputs!.megapixels).toBe(0.66)
    })

    it('injects shift into both ModelSamplingSD3 nodes', async () => {
      const workflow = await buildWanWorkflow(baseParams)
      expect(workflow['32']!.inputs!.shift).toBe(5)
      expect(workflow['33']!.inputs!.shift).toBe(5)
    })

    it('injects steps into CustomSplineSigma nodes', async () => {
      const workflow = await buildWanWorkflow(baseParams)
      expect(workflow['52']!.inputs!.steps).toBe(3)
      expect(workflow['53']!.inputs!.steps).toBe(3)
    })

    it('injects sampler into node 14', async () => {
      const workflow = await buildWanWorkflow(baseParams)
      expect(workflow['14']!.inputs!.sampler_name).toBe('euler')
    })

    it('injects frame length into WanFirstLastFrameToVideo nodes', async () => {
      const params: WanGenerationParams = { ...baseParams, endImage: 'end.png' }
      const workflow = await buildWanWorkflow(params)
      expect(workflow['31']!.inputs!.length).toBe(121)
      expect(workflow['30']!.inputs!.length).toBe(121)
    })
  })

  describe('structural integrity', () => {
    it('preserves all critical nodes in start-only mode', async () => {
      const workflow = await buildWanWorkflow(baseParams)
      const criticalNodes = ['1', '2', '3', '5', '10', '13', '14', '20', '21', '25', '26', '30', '31', '32', '33', '41', '42', '52', '53']
      for (const nodeId of criticalNodes) {
        expect(workflow[nodeId], `node ${nodeId} should exist`).toBeDefined()
      }
    })

    it('preserves end image nodes in start+end mode', async () => {
      const params: WanGenerationParams = { ...baseParams, endImage: 'end.png' }
      const workflow = await buildWanWorkflow(params)
      expect(workflow['11']).toBeDefined()
      expect(workflow['18']).toBeDefined()
    })
  })
})
