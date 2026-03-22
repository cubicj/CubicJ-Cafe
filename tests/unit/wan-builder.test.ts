import { vi } from 'vitest'

vi.mock('@/lib/database/model-settings', () => ({
  getActiveModel: vi.fn().mockResolvedValue('wan'),
  getModelSettings: vi.fn().mockResolvedValue({
    highDiffusionModel: 'test-high.safetensors',
    lowDiffusionModel: 'test-low.safetensors',
    textEncoder: 'test-encoder.safetensors',
    vae: 'test-vae.safetensors',
    upscaleModel: 'test-upscale.safetensors',
    clipVision: 'test-clip.safetensors',
    ksampler: 'euler_ancestral',
    highCfg: 3.0, lowCfg: 3.0, highShift: 5.0, lowShift: 5.0,
  }),
  setActiveModel: vi.fn(),
}))

vi.mock('@/lib/database/system-settings', () => ({
  getNegativePrompt: vi.fn().mockResolvedValue('test negative prompt'),
  getQualityPrompt: vi.fn().mockResolvedValue('masterpiece, best quality'),
  getVideoResolution: vi.fn().mockResolvedValue(560),
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
  videoLength: 81,
}

describe('buildWanWorkflow', () => {
  it('produces a valid workflow object', async () => {
    const workflow = await buildWanWorkflow(baseParams)
    expect(workflow).toBeDefined()
    expect(workflow).not.toBeNull()
    expect(typeof workflow).toBe('object')
  })

  it('sets random seed in node 291', async () => {
    const w1 = await buildWanWorkflow(baseParams)
    const w2 = await buildWanWorkflow(baseParams)

    expect(typeof w1['291']!.inputs!.seed).toBe('number')
    expect(w1['291']!.inputs!.seed).not.toBe(w2['291']!.inputs!.seed)
  })

  it('sets filename prefix with WAN/ prefix based on inputImage', async () => {
    const workflow = await buildWanWorkflow(baseParams)
    expect(workflow['285']!.inputs!.filename_prefix).toBe('WAN/dragon-input')
  })

  it('strips image extension from filename prefix', async () => {
    const params: WanGenerationParams = { ...baseParams, inputImage: 'photo.jpeg' }
    const workflow = await buildWanWorkflow(params)
    expect(workflow['285']!.inputs!.filename_prefix).toBe('WAN/photo')
  })
})
