import type { LtxGenerationParams } from '@/lib/comfyui/workflows/types'
import { buildLtxWorkflow } from '@/lib/comfyui/workflows/ltx/builder'

const baseParams: LtxGenerationParams = {
  model: 'ltx',
  prompt: 'a cat dancing on the moon',
  inputImage: 'test-image.png',
  durationSeconds: 5,
}

describe('buildLtxWorkflow', () => {
  it('sets prompt text in node 5', async () => {
    const workflow = await buildLtxWorkflow(baseParams)
    expect(workflow['5'].inputs.text).toBe('a cat dancing on the moon')
  })

  it('sets input image in node 87', async () => {
    const workflow = await buildLtxWorkflow(baseParams)
    expect(workflow['87'].inputs.image).toBe('test-image.png')
  })

  it('sets duration in node 103', async () => {
    const workflow = await buildLtxWorkflow(baseParams)
    expect(workflow['103'].inputs.value).toBe(5)
  })

  it('generates random seeds that differ between calls', async () => {
    const w1 = await buildLtxWorkflow(baseParams)
    const w2 = await buildLtxWorkflow(baseParams)

    const seeds1 = [w1['16'].inputs.noise_seed, w1['32'].inputs.noise_seed]
    const seeds2 = [w2['16'].inputs.noise_seed, w2['32'].inputs.noise_seed]

    expect(seeds1[0]).not.toBe(seeds2[0])
    expect(seeds1[1]).not.toBe(seeds2[1])
  })

  it('sets filename prefix with LTX/ prefix', async () => {
    const workflow = await buildLtxWorkflow(baseParams)
    expect(workflow['38'].inputs.filename_prefix).toBe('LTX/test-image')
  })

  it('strips image extension from filename prefix', async () => {
    const params: LtxGenerationParams = { ...baseParams, inputImage: 'photo.jpg' }
    const workflow = await buildLtxWorkflow(params)
    expect(workflow['38'].inputs.filename_prefix).toBe('LTX/photo')
  })
})
