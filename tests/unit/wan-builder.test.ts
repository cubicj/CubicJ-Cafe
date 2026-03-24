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

  it('rewires to WanImageToVideo when no end image', async () => {
    const workflow = await buildWanWorkflow(baseParams)
    expect(workflow['16']!.inputs!.latent_image).toEqual(['37', 2])
    expect(workflow['4']!.inputs!.conditioning).toEqual(['37', 0])
    expect(workflow['17']!.inputs!.conditioning).toEqual(['29', 0])
  })

})
