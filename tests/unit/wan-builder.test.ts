import { vi } from 'vitest'

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
}

describe('buildWanWorkflow', () => {
  it('produces a valid workflow object', async () => {
    const workflow = await buildWanWorkflow(baseParams)
    expect(workflow).toBeDefined()
    expect(workflow).not.toBeNull()
    expect(typeof workflow).toBe('object')
  })

  it('sets random seed in node 549', async () => {
    const w1 = await buildWanWorkflow(baseParams)
    const w2 = await buildWanWorkflow(baseParams)

    expect(typeof w1['549']!.inputs!.noise_seed).toBe('number')
    expect(w1['549']!.inputs!.noise_seed).not.toBe(w2['549']!.inputs!.noise_seed)
  })

  it('sets filename prefix with WAN/ prefix based on inputImage', async () => {
    const workflow = await buildWanWorkflow(baseParams)
    expect(workflow['562']!.inputs!.filename_prefix).toBe('WAN/dragon-input')
  })

  it('strips image extension from filename prefix', async () => {
    const params: WanGenerationParams = { ...baseParams, inputImage: 'photo.jpeg' }
    const workflow = await buildWanWorkflow(params)
    expect(workflow['562']!.inputs!.filename_prefix).toBe('WAN/photo')
  })

  it('sets prompt in node 543', async () => {
    const workflow = await buildWanWorkflow(baseParams)
    expect(workflow['543']!.inputs!.text).toBe('a dragon flying through clouds')
  })

  it('sets start image in node 531', async () => {
    const workflow = await buildWanWorkflow(baseParams)
    expect(workflow['531']!.inputs!.image).toBe('dragon-input.png')
  })

  it('uses fixed 121 frame length in WanFirstLastFrameToVideo nodes when endImage provided', async () => {
    const params: WanGenerationParams = { ...baseParams, endImage: 'end.png' }
    const workflow = await buildWanWorkflow(params)
    expect(workflow['527']!.inputs!.length).toBe(121)
    expect(workflow['538']!.inputs!.length).toBe(121)
  })

  it('sets end image when provided', async () => {
    const params: WanGenerationParams = { ...baseParams, endImage: 'end.png' }
    const workflow = await buildWanWorkflow(params)
    expect(workflow['532']!.inputs!.image).toBe('end.png')
  })

  it('removes end image nodes when no end image', async () => {
    const workflow = await buildWanWorkflow(baseParams)
    expect(workflow['532']).toBeUndefined()
    expect(workflow['534']).toBeUndefined()
  })

  it('removes lora placeholders when no preset', async () => {
    const workflow = await buildWanWorkflow(baseParams)
    const highLoraInputs = workflow['525']!.inputs!
    const lowLoraInputs = workflow['526']!.inputs!
    const highHasLora = Object.keys(highLoraInputs).some(k => k.startsWith('lora_'))
    const lowHasLora = Object.keys(lowLoraInputs).some(k => k.startsWith('lora_'))
    expect(highHasLora).toBe(false)
    expect(lowHasLora).toBe(false)
  })

})
