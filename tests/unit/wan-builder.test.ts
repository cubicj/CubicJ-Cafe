import { buildWanWorkflow as rawBuilder } from '@/lib/comfyui/workflows/wan/builder'
import { prisma } from '@/lib/database/prisma'
import { assertNoPlaceholders } from '../helpers/workflow-assertions'
import { cleanTables } from '../helpers/db'
import { WAN } from '@/lib/comfyui/workflows/wan/nodes'
import type { ComfyUIWorkflow } from '@/types'

let lastWorkflow: ComfyUIWorkflow | null = null
const buildWanWorkflow = async (...args: Parameters<typeof rawBuilder>) => {
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

describe('buildWanWorkflow', () => {
  it('builds base workflow with only input image', async () => {
    const wf = await buildWanWorkflow({
      model: 'wan',
      prompt: 'a scene',
      inputImage: 'img.png',
      videoDuration: 5,
    })
    expect(wf[WAN.POSITIVE_PROMPT]!.inputs!.text).toBe('a scene')
    expect(wf[WAN.LOAD_IMAGE_START]!.inputs!.image).toBe('img.png')
    expect(wf[WAN.LOAD_IMAGE_END]).toBeUndefined()
    expect(wf[WAN.RESIZE_END_IMAGE]).toBeUndefined()
    expect(wf[WAN.IMG_TO_VIDEO_ENCODE]!.inputs!.end_image).toBeUndefined()
  })

  it('wires end image when provided', async () => {
    const wf = await buildWanWorkflow({
      model: 'wan',
      prompt: 'p',
      inputImage: 'img.png',
      videoDuration: 5,
      endImage: 'end.png',
    })
    expect(wf[WAN.LOAD_IMAGE_END]!.inputs!.image).toBe('end.png')
    expect(wf[WAN.RESIZE_END_IMAGE]).toBeDefined()
    expect(wf[WAN.IMG_TO_VIDEO_ENCODE]!.inputs!.end_image).toEqual([WAN.RESIZE_END_IMAGE, 0])
  })

  it('applies sigmas from settings to both samplers', async () => {
    const wf = await buildWanWorkflow({ model: 'wan', prompt: 'p', inputImage: 'img.png', videoDuration: 5 })
    expect(wf[WAN.SIGMAS_HIGH]!.inputs!.sigmas).toBe('1.0, 0.9375, 0.875')
    expect(wf[WAN.SIGMAS_LOW]!.inputs!.sigmas).toBe('0.875, 0.4375, 0.0')
  })

  it('assigns independent seeds to samplers', async () => {
    const wf = await buildWanWorkflow({ model: 'wan', prompt: 'p', inputImage: 'img.png', videoDuration: 5 })
    const seedHigh = wf[WAN.SAMPLER_HIGH]!.inputs!.seed as number
    const seedLow = wf[WAN.SAMPLER_LOW]!.inputs!.seed as number
    expect(typeof seedHigh).toBe('number')
    expect(typeof seedLow).toBe('number')
    expect(seedHigh).not.toBe(seedLow)
  })

  it('writes block swap settings to BLOCK_SWAP node', async () => {
    const wf = await buildWanWorkflow({ model: 'wan', prompt: 'p', inputImage: 'img.png', videoDuration: 5 })
    expect(wf[WAN.BLOCK_SWAP]!.inputs).toMatchObject({
      blocks_to_swap: 20,
      offload_img_emb: false,
      offload_txt_emb: false,
      vace_blocks_to_swap: 0,
      prefetch_blocks: 1,
    })
  })

  it('strips RTX node when disabled', async () => {
    await prisma.systemSetting.update({ where: { key: 'wan.rtx_enabled' }, data: { value: 'false' } })
    const wf = await buildWanWorkflow({ model: 'wan', prompt: 'p', inputImage: 'img.png', videoDuration: 5 })
    expect(wf[WAN.RTX_SUPER_RES]).toBeUndefined()
    expect(wf[WAN.VIDEO_COMBINE]!.inputs!.images).toEqual([WAN.VRAM_POST_DECODE, 0])
  })

  it('omits clip vision nodes and clip_embeds wiring on encode', async () => {
    const wf = await buildWanWorkflow({ model: 'wan', prompt: 'p', inputImage: 'img.png', videoDuration: 5 })
    expect(wf['143']).toBeUndefined()
    expect(wf[WAN.IMG_TO_VIDEO_ENCODE]!.inputs!.clip_embeds).toBeUndefined()
  })

  it('wires WanVideoContextRefineMode for both HIGH and LOW samplers', async () => {
    const wf = await buildWanWorkflow({ model: 'wan', prompt: 'p', inputImage: 'img.png', videoDuration: 5 })

    expect(wf[WAN.CONTEXT_REFINE_HIGH]).toBeDefined()
    expect(wf[WAN.CONTEXT_REFINE_HIGH]!.class_type).toBe('WanVideoContextRefineMode')
    expect(wf[WAN.CONTEXT_REFINE_HIGH]!.inputs!.disable_window_reinject).toBe(true)
    expect(wf[WAN.CONTEXT_REFINE_HIGH]!.inputs!.propagate_x0).toBe(true)
    expect(wf[WAN.CONTEXT_REFINE_HIGH]!.inputs!.propagate_x0_strength).toBe(0.98)
    expect(wf[WAN.CONTEXT_REFINE_HIGH]!.inputs!.image_embeds).toEqual([WAN.IMG_TO_VIDEO_ENCODE, 0])

    expect(wf[WAN.CONTEXT_REFINE_LOW]).toBeDefined()
    expect(wf[WAN.CONTEXT_REFINE_LOW]!.class_type).toBe('WanVideoContextRefineMode')
    expect(wf[WAN.CONTEXT_REFINE_LOW]!.inputs!.disable_window_reinject).toBe(true)
    expect(wf[WAN.CONTEXT_REFINE_LOW]!.inputs!.propagate_x0).toBe(false)
    expect(wf[WAN.CONTEXT_REFINE_LOW]!.inputs!.propagate_x0_strength).toBe(0.5)
    expect(wf[WAN.CONTEXT_REFINE_LOW]!.inputs!.image_embeds).toEqual([WAN.IMG_TO_VIDEO_ENCODE, 0])

    expect(wf[WAN.SAMPLER_HIGH]!.inputs!.image_embeds).toEqual([WAN.CONTEXT_REFINE_HIGH, 0])
    expect(wf[WAN.SAMPLER_LOW]!.inputs!.image_embeds).toEqual([WAN.CONTEXT_REFINE_LOW, 0])
  })

  it('writes duration to SECONDS node', async () => {
    const wf = await buildWanWorkflow({ model: 'wan', prompt: 'p', inputImage: 'img.png', videoDuration: 7 })
    expect(wf[WAN.SECONDS]!.inputs!.number).toBe(7)
  })

  it('strips context_options at 5s (81 frames, nLat=21)', async () => {
    const wf = await buildWanWorkflow({ model: 'wan', prompt: 'p', inputImage: 'img.png', videoDuration: 5 })
    expect(wf[WAN.CONTEXT_OPTIONS]).toBeUndefined()
    expect(wf[WAN.SAMPLER_HIGH]!.inputs!.context_options).toBeUndefined()
    expect(wf[WAN.SAMPLER_LOW]!.inputs!.context_options).toBeUndefined()
  })

  it('wires computed context_options at 6s (97 frames, nLat=25)', async () => {
    const wf = await buildWanWorkflow({ model: 'wan', prompt: 'p', inputImage: 'img.png', videoDuration: 6 })
    expect(wf[WAN.CONTEXT_OPTIONS]!.inputs).toMatchObject({
      context_schedule: 'static_standard',
      context_frames: 81,
      context_stride: 4,
      context_overlap: 68,
      freenoise: true,
      fuse_method: 'pyramid',
    })
    expect(wf[WAN.SAMPLER_HIGH]!.inputs!.context_options).toEqual([WAN.CONTEXT_OPTIONS, 0])
    expect(wf[WAN.SAMPLER_LOW]!.inputs!.context_options).toEqual([WAN.CONTEXT_OPTIONS, 0])
  })
})
