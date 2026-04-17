import { buildLtxWorkflow as rawBuilder } from '@/lib/comfyui/workflows/ltx/builder'
import { prisma } from '@/lib/database/prisma'
import { assertNoPlaceholders } from '../helpers/workflow-assertions'
import { cleanTables } from '../helpers/db'
import type { ComfyUIWorkflow } from '@/types'
import { LTX } from '@/lib/comfyui/workflows/ltx/nodes'

let lastWorkflow: ComfyUIWorkflow | null = null
const buildLtxWorkflow = async (...args: Parameters<typeof rawBuilder>) => {
  const wf = await rawBuilder(...args)
  lastWorkflow = wf
  return wf
}

beforeEach(async () => {
  await cleanTables()
})

afterEach(() => {
  if (lastWorkflow) assertNoPlaceholders(lastWorkflow)
  lastWorkflow = null
})

describe('buildLtxWorkflow', () => {
  it('builds base workflow with only input image', async () => {
    const wf = await buildLtxWorkflow({
      model: 'ltx',
      prompt: 'a test scene',
      inputImage: 'img.png',
      videoDuration: 5,
    })
    expect(wf[LTX.POSITIVE_PROMPT].inputs.text).toBe('a test scene')
    expect(wf[LTX.DURATION].inputs.value).toBe(5)
    expect(wf[LTX.LOAD_IMAGE_START].inputs.image).toBe('img.png')
    expect(wf[LTX.LOAD_IMAGE_END]).toBeUndefined()
    expect(wf[LTX.LOAD_AUDIO]).toBeUndefined()
    expect(wf[LTX.REFERENCE_AUDIO]).toBeUndefined()
    expect(wf[LTX.AUDIO_NORM]).toBeUndefined()
  })

  it('injects end image nodes when endImage provided', async () => {
    const wf = await buildLtxWorkflow({
      model: 'ltx',
      prompt: 'p',
      inputImage: 'img.png',
      videoDuration: 5,
      endImage: 'end.png',
    })
    expect(wf[LTX.LOAD_IMAGE_END].inputs.image).toBe('end.png')
    expect(wf[LTX.RESIZE_END_IMAGE]).toBeDefined()
    expect(wf[LTX.PREPROCESS_END]).toBeDefined()
    expect(wf[LTX.IMG_TO_VIDEO].inputs['num_images']).toBe('2')
  })

  it('collapses IMG_TO_VIDEO to single image when endImage absent', async () => {
    const wf = await buildLtxWorkflow({
      model: 'ltx',
      prompt: 'p',
      inputImage: 'img.png',
      videoDuration: 5,
    })
    expect(wf[LTX.IMG_TO_VIDEO].inputs['num_images']).toBe('1')
    expect(wf[LTX.IMG_TO_VIDEO].inputs['num_images.image_2']).toBeUndefined()
  })

  it('applies distilled LoRA to slot 1 when enabled in settings', async () => {
    await prisma.systemSetting.update({
      where: { key: 'ltx.distilled_lora_enabled' },
      data: { value: 'true' },
    })
    const wf = await buildLtxWorkflow({
      model: 'ltx',
      prompt: 'p',
      inputImage: 'img.png',
      videoDuration: 5,
    })
    const lora = wf[LTX.POWER_LORA].inputs['lora_1'] as { on: boolean; lora: string; strength: number }
    expect(lora.on).toBe(true)
    expect(lora.lora).toBe('test-distilled.safetensors')
    expect(lora.strength).toBe(0.5)
  })

  it('leaves all LoRA slots off when distilled disabled and no audio', async () => {
    const wf = await buildLtxWorkflow({
      model: 'ltx',
      prompt: 'p',
      inputImage: 'img.png',
      videoDuration: 5,
    })
    for (const slot of ['lora_1', 'lora_2', 'lora_3', 'lora_4']) {
      expect((wf[LTX.POWER_LORA].inputs[slot] as { on: boolean }).on).toBe(false)
    }
  })

  it('strips RTX node when rtx disabled', async () => {
    await prisma.systemSetting.update({
      where: { key: 'ltx.rtx_enabled' },
      data: { value: 'false' },
    })
    const wf = await buildLtxWorkflow({
      model: 'ltx',
      prompt: 'p',
      inputImage: 'img.png',
      videoDuration: 5,
    })
    expect(wf[LTX.RTX_SUPER_RES]).toBeUndefined()
    expect(wf[LTX.VIDEO_COMBINE].inputs.images).toEqual([LTX.VRAM_POST_VAE_DECODE, 0])
  })
})
