import { buildH3Fl2vaWorkflow as rawBuilder } from '@/lib/comfyui/workflows/h3-fl2va/builder'
import { prisma } from '@/lib/database/prisma'
import { assertNoDanglingLinks, assertNoPlaceholders } from '@tests/helpers/workflow-assertions'
import { cleanTables } from '@tests/helpers/db'
import { seedH3Fl2va } from '@tests/helpers/h3-fl2va-seed'
import { H3_FL2VA } from '@/lib/comfyui/workflows/h3-fl2va/nodes'
import type { ComfyUIWorkflow } from '@/types'

let lastWorkflow: ComfyUIWorkflow | null = null
const buildH3Fl2vaWorkflow = async (...args: Parameters<typeof rawBuilder>) => {
  const wf = await rawBuilder(...args)
  lastWorkflow = wf
  return wf
}

beforeEach(async () => {
  await cleanTables()
  await seedH3Fl2va()
})

afterEach(() => {
  if (lastWorkflow) assertNoPlaceholders(lastWorkflow)
  lastWorkflow = null
})

describe('buildH3Fl2vaWorkflow', () => {
  it.each([
    { inputImage: 'first.png', endImage: 'last.png', rtx: true },
    { inputImage: 'first.png', endImage: undefined, rtx: true },
    { inputImage: undefined, endImage: 'last.png', rtx: true },
    { inputImage: 'first.png', endImage: 'last.png', rtx: false },
    { inputImage: 'first.png', endImage: undefined, rtx: false },
    { inputImage: undefined, endImage: 'last.png', rtx: false },
  ])('has no dangling links for inputImage=$inputImage endImage=$endImage rtx=$rtx', async ({ inputImage, endImage, rtx }) => {
    if (!rtx) {
      await prisma.systemSetting.update({ where: { key: 'h3-fl2va.rtx_enabled' }, data: { value: 'false' } })
    }
    const wf = await buildH3Fl2vaWorkflow({ model: 'h3-fl2va', prompt: 'p', videoDuration: 5, inputImage, endImage })
    assertNoDanglingLinks(wf)
  })

  it('throws when no image is provided', async () => {
    await expect(rawBuilder({ model: 'h3-fl2va', prompt: 'p', videoDuration: 5 })).rejects.toThrow()
  })

  it('excludes unused source workflow nodes', async () => {
    const wf = await buildH3Fl2vaWorkflow({ model: 'h3-fl2va', prompt: 'p', videoDuration: 5, inputImage: 'fake-start.png' })
    expect(wf['4']).toBeUndefined()
    expect(wf['51']).toBeUndefined()
  })

  it('wires loop input as FL2VA', async () => {
    const wf = await buildH3Fl2vaWorkflow({
      model: 'h3-fl2va',
      prompt: 'p',
      videoDuration: 5,
      inputImage: 'fake-loop.png',
      endImage: 'fake-loop.png',
    })
    expect(wf[H3_FL2VA.IMAGE_TO_VIDEO]!.inputs!.first_frame).toEqual(['2', 0])
    expect(wf[H3_FL2VA.IMAGE_TO_VIDEO]!.inputs!.last_frame).toEqual(['58', 0])
  })

  it('wires FL2VA mode with per-slot megapixels', async () => {
    const wf = await buildH3Fl2vaWorkflow({ model: 'h3-fl2va', prompt: 'p', videoDuration: 5, inputImage: 'first.png', endImage: 'last.png' })
    expect(wf[H3_FL2VA.LOAD_IMAGE_FIRST]!.inputs!.image).toBe('first.png')
    expect(wf[H3_FL2VA.LOAD_IMAGE_LAST]!.inputs!.image).toBe('last.png')
    expect(wf[H3_FL2VA.RESIZE_FIRST]!.inputs!.megapixels).toBe(0.5)
    expect(wf[H3_FL2VA.RESIZE_LAST]!.inputs!.megapixels).toBe(0.4)
    expect(wf[H3_FL2VA.IMAGE_TO_VIDEO]!.inputs!.first_frame).toEqual([H3_FL2VA.RESIZE_FIRST, 0])
    expect(wf[H3_FL2VA.IMAGE_TO_VIDEO]!.inputs!.last_frame).toEqual([H3_FL2VA.RESIZE_LAST, 0])
    expect(wf[H3_FL2VA.IMAGE_TO_VIDEO]!.inputs!.width).toEqual([H3_FL2VA.RESIZE_FIRST, 1])
    expect(wf[H3_FL2VA.IMAGE_TO_VIDEO]!.inputs!.height).toEqual([H3_FL2VA.RESIZE_FIRST, 2])
  })

  it('wires F2VA mode without last-frame nodes', async () => {
    const wf = await buildH3Fl2vaWorkflow({ model: 'h3-fl2va', prompt: 'p', videoDuration: 5, inputImage: 'first.png' })
    expect(wf[H3_FL2VA.LOAD_IMAGE_LAST]).toBeUndefined()
    expect(wf[H3_FL2VA.RESIZE_LAST]).toBeUndefined()
    expect(wf[H3_FL2VA.IMAGE_TO_VIDEO]!.inputs!.last_frame).toBeUndefined()
    expect(wf[H3_FL2VA.IMAGE_TO_VIDEO]!.inputs!.first_frame).toEqual([H3_FL2VA.RESIZE_FIRST, 0])
  })

  it('wires L2VA mode with main megapixels and rewired dimensions', async () => {
    const wf = await buildH3Fl2vaWorkflow({ model: 'h3-fl2va', prompt: 'p', videoDuration: 5, endImage: 'last.png' })
    expect(wf[H3_FL2VA.LOAD_IMAGE_FIRST]).toBeUndefined()
    expect(wf[H3_FL2VA.RESIZE_FIRST]).toBeUndefined()
    expect(wf[H3_FL2VA.IMAGE_TO_VIDEO]!.inputs!.first_frame).toBeUndefined()
    expect(wf[H3_FL2VA.RESIZE_LAST]!.inputs!.megapixels).toBe(0.5)
    expect(wf[H3_FL2VA.IMAGE_TO_VIDEO]!.inputs!.last_frame).toEqual([H3_FL2VA.RESIZE_LAST, 0])
    expect(wf[H3_FL2VA.IMAGE_TO_VIDEO]!.inputs!.width).toEqual([H3_FL2VA.RESIZE_LAST, 1])
    expect(wf[H3_FL2VA.IMAGE_TO_VIDEO]!.inputs!.height).toEqual([H3_FL2VA.RESIZE_LAST, 2])
  })

  it('composes the frame expression and duration inputs from settings', async () => {
    const wf = await buildH3Fl2vaWorkflow({ model: 'h3-fl2va', prompt: 'p', videoDuration: 7, inputImage: 'first.png' })
    expect(wf[H3_FL2VA.FRAME_N]!.inputs!.value).toBe(7)
    expect(wf[H3_FL2VA.FRAME_MATH]!.inputs!.expression).toBe('10 * a + 3')
    expect(wf[H3_FL2VA.FPS]!.inputs!.number).toBe(10)
  })

  it('injects model files, sampling, and output settings', async () => {
    const wf = await buildH3Fl2vaWorkflow({ model: 'h3-fl2va', prompt: 'a scene', videoDuration: 5, inputImage: 'first.png' })
    expect(wf[H3_FL2VA.UNET_LOADER]!.inputs).toMatchObject({ unet_name: 'test-h3-unet.safetensors', weight_dtype: 'fake-weight-dtype' })
    expect(wf[H3_FL2VA.CLIP_LOADER]!.inputs).toMatchObject({ clip_name: 'test-h3-clip.safetensors', type: 'test-clip-type', device: 'fake-clip-device' })
    expect(wf[H3_FL2VA.VIDEO_VAE_LOADER]!.inputs!.vae_name).toBe('test-h3-video-vae.safetensors')
    expect(wf[H3_FL2VA.AUDIO_VAE_LOADER]!.inputs!.vae_name).toBe('test-h3-audio-vae.safetensors')
    expect(wf[H3_FL2VA.TURBO_LORA]!.inputs).toMatchObject({ lora_name: 'test-h3-lora.safetensors', strength: 0.9 })
    expect(wf[H3_FL2VA.SIGMA_SHIFT]!.inputs).toMatchObject({ shift_video: 7, shift_audio: 2 })
    expect(wf[H3_FL2VA.ATTENTION_BACKEND]!.inputs!.attention).toBe('test attention')
    expect(wf[H3_FL2VA.FUSED_MODULATION]!.inputs!.enabled).toBe(true)
    expect(wf[H3_FL2VA.CHUNK_FEEDFORWARD]!.inputs).toMatchObject({ enabled: true, chunks: 3, min_tokens: 1024 })
    expect(wf[H3_FL2VA.SAMPLER_SELECT]!.inputs!.sampler_name).toBe('fake-sampler')
    expect(wf[H3_FL2VA.SCHEDULER]!.inputs!.scheduler).toBe('fake-scheduler')
    expect(wf[H3_FL2VA.STEPS]!.inputs!.value).toBe(4)
    expect(wf[H3_FL2VA.POSITIVE_PROMPT]!.inputs!.positive).toBe('a scene')
    expect(typeof wf[H3_FL2VA.RANDOM_NOISE]!.inputs!.noise_seed).toBe('number')
    expect(wf[H3_FL2VA.VIDEO_COMBINE]!.inputs).toMatchObject({ crf: 18, format: 'fake-video-format', pix_fmt: 'fake-pix-format', filename_prefix: 'H3FL2VA/first' })
  })

  it('keeps RTX node wired when enabled', async () => {
    const wf = await buildH3Fl2vaWorkflow({ model: 'h3-fl2va', prompt: 'p', videoDuration: 5, inputImage: 'first.png' })
    expect(wf[H3_FL2VA.RTX_SUPER_RES]!.inputs).toMatchObject({ resize_type: 'fake-resize-type', 'resize_type.scale': 1.7, quality: 'HIGH' })
    expect(wf[H3_FL2VA.VIDEO_COMBINE]!.inputs!.images).toEqual([H3_FL2VA.RTX_SUPER_RES, 0])
  })

  it('strips RTX node when disabled', async () => {
    await prisma.systemSetting.update({ where: { key: 'h3-fl2va.rtx_enabled' }, data: { value: 'false' } })
    const wf = await buildH3Fl2vaWorkflow({ model: 'h3-fl2va', prompt: 'p', videoDuration: 5, inputImage: 'first.png' })
    expect(wf[H3_FL2VA.RTX_SUPER_RES]).toBeUndefined()
    expect(wf[H3_FL2VA.VIDEO_COMBINE]!.inputs!.images).toEqual([H3_FL2VA.VAE_DECODE, 0])
  })

  it('uses the end image for the filename prefix in L2VA mode', async () => {
    const wf = await buildH3Fl2vaWorkflow({ model: 'h3-fl2va', prompt: 'p', videoDuration: 5, endImage: 'last.png' })
    expect(wf[H3_FL2VA.VIDEO_COMBINE]!.inputs!.filename_prefix).toBe('H3FL2VA/last')
  })
})
