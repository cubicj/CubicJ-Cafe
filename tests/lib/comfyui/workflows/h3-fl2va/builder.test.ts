import { buildH3Fl2vaWorkflow } from '@/lib/comfyui/workflows/h3-fl2va/builder'
import { H3_FL2VA } from '@/lib/comfyui/workflows/h3-fl2va/nodes'
import { prisma } from '@/lib/database/prisma'
import { cleanTables } from '@tests/helpers/db'
import { seedH3Fl2va } from '@tests/helpers/h3-fl2va-seed'
import { assertNoDanglingLinks, assertNoPlaceholders } from '@tests/helpers/workflow-assertions'

beforeEach(async () => {
  await cleanTables()
  await seedH3Fl2va()
})

describe('buildH3Fl2vaWorkflow', () => {
  it.each([
    { mode: 'both', inputImage: 'fake-first.png', endImage: 'fake-last.png' },
    { mode: 'first-only', inputImage: 'fake-first.png', endImage: undefined },
    { mode: 'last-only', inputImage: undefined, endImage: 'fake-last.png' },
  ])('builds the $mode mode without dangling links or placeholders', async ({ inputImage, endImage }) => {
    const workflow = await buildH3Fl2vaWorkflow({ model: 'h3-fl2va', prompt: 'fake prompt', videoDuration: 9, inputImage, endImage })

    assertNoDanglingLinks(workflow)
    assertNoPlaceholders(workflow)
  })

  it('throws when no image is provided', async () => {
    await expect(buildH3Fl2vaWorkflow({ model: 'h3-fl2va', prompt: 'fake prompt', videoDuration: 9 })).rejects.toThrow('H3 FL2VA requires at least one image')
  })

  it('wires both frames into both conditioning passes', async () => {
    const workflow = await buildH3Fl2vaWorkflow({
      model: 'h3-fl2va',
      prompt: 'fake prompt',
      videoDuration: 9,
      inputImage: 'fake-first.png',
      endImage: 'fake-last.png',
    })

    expect(workflow[H3_FL2VA.LOAD_IMAGE_FIRST]!.inputs!.image).toBe('fake-first.png')
    expect(workflow[H3_FL2VA.LOAD_IMAGE_LAST]!.inputs!.image).toBe('fake-last.png')
    expect(workflow[H3_FL2VA.IMAGE_TO_VIDEO_FIRST]!.inputs).toMatchObject({
      first_frame: [H3_FL2VA.RESIZE_FIRST_PASS1, 0],
      last_frame: [H3_FL2VA.RESIZE_LAST_PASS1, 0],
      width: [H3_FL2VA.RESIZE_FIRST_PASS1, 1],
      height: [H3_FL2VA.RESIZE_FIRST_PASS1, 2],
    })
    expect(workflow[H3_FL2VA.IMAGE_TO_VIDEO_SECOND]!.inputs).toMatchObject({
      first_frame: [H3_FL2VA.RESIZE_FIRST_PASS2, 0],
      last_frame: [H3_FL2VA.RESIZE_LAST_PASS2, 0],
      width: [H3_FL2VA.RESIZE_FIRST_PASS2, 1],
      height: [H3_FL2VA.RESIZE_FIRST_PASS2, 2],
    })
    expect(workflow[H3_FL2VA.LATENT_UPSCALER]!.inputs).toMatchObject({
      mode: 'target dimensions',
      'mode.width': [H3_FL2VA.RESIZE_FIRST_PASS2, 1],
      'mode.height': [H3_FL2VA.RESIZE_FIRST_PASS2, 2],
    })
  })

  it('removes all last-frame nodes and inputs in first-only mode', async () => {
    const workflow = await buildH3Fl2vaWorkflow({ model: 'h3-fl2va', prompt: 'fake prompt', videoDuration: 9, inputImage: 'fake-first.png' })

    expect(workflow[H3_FL2VA.LOAD_IMAGE_LAST]).toBeUndefined()
    expect(workflow[H3_FL2VA.RESIZE_LAST_PASS1]).toBeUndefined()
    expect(workflow[H3_FL2VA.RESIZE_LAST_PASS2]).toBeUndefined()
    expect(workflow[H3_FL2VA.IMAGE_TO_VIDEO_FIRST]!.inputs!.last_frame).toBeUndefined()
    expect(workflow[H3_FL2VA.IMAGE_TO_VIDEO_SECOND]!.inputs!.last_frame).toBeUndefined()
    expect(workflow[H3_FL2VA.IMAGE_TO_VIDEO_FIRST]!.inputs!.first_frame).toEqual([H3_FL2VA.RESIZE_FIRST_PASS1, 0])
    expect(workflow[H3_FL2VA.IMAGE_TO_VIDEO_SECOND]!.inputs!.first_frame).toEqual([H3_FL2VA.RESIZE_FIRST_PASS2, 0])
  })

  it('rewires both conditioning passes and the upscaler in last-only mode', async () => {
    const workflow = await buildH3Fl2vaWorkflow({ model: 'h3-fl2va', prompt: 'fake prompt', videoDuration: 9, endImage: 'fake-last.png' })

    expect(workflow[H3_FL2VA.LOAD_IMAGE_FIRST]).toBeUndefined()
    expect(workflow[H3_FL2VA.RESIZE_FIRST_PASS1]).toBeUndefined()
    expect(workflow[H3_FL2VA.RESIZE_FIRST_PASS2]).toBeUndefined()
    expect(workflow[H3_FL2VA.IMAGE_TO_VIDEO_FIRST]!.inputs).toMatchObject({
      last_frame: [H3_FL2VA.RESIZE_LAST_PASS1, 0],
      width: [H3_FL2VA.RESIZE_LAST_PASS1, 1],
      height: [H3_FL2VA.RESIZE_LAST_PASS1, 2],
    })
    expect(workflow[H3_FL2VA.IMAGE_TO_VIDEO_FIRST]!.inputs!.first_frame).toBeUndefined()
    expect(workflow[H3_FL2VA.IMAGE_TO_VIDEO_SECOND]!.inputs).toMatchObject({
      last_frame: [H3_FL2VA.RESIZE_LAST_PASS2, 0],
      width: [H3_FL2VA.RESIZE_LAST_PASS2, 1],
      height: [H3_FL2VA.RESIZE_LAST_PASS2, 2],
    })
    expect(workflow[H3_FL2VA.IMAGE_TO_VIDEO_SECOND]!.inputs!.first_frame).toBeUndefined()
    expect(workflow[H3_FL2VA.LATENT_UPSCALER]!.inputs).toMatchObject({
      'mode.width': [H3_FL2VA.RESIZE_LAST_PASS2, 1],
      'mode.height': [H3_FL2VA.RESIZE_LAST_PASS2, 2],
    })
  })

  it('preserves the two-pass sampling and latent bridge structure', async () => {
    const workflow = await buildH3Fl2vaWorkflow({ model: 'h3-fl2va', prompt: 'fake prompt', videoDuration: 9, inputImage: 'fake-first.png' })

    expect(workflow[H3_FL2VA.UNLOAD_POST_ENCODE]!.inputs!.passthrough).toEqual([H3_FL2VA.IMAGE_TO_VIDEO_FIRST, 0])
    expect(workflow[H3_FL2VA.GUIDER_FIRST]!.inputs).toMatchObject({ model: [H3_FL2VA.CHUNK_FEEDFORWARD, 0], conditioning: [H3_FL2VA.UNLOAD_POST_ENCODE, 0] })
    expect(workflow[H3_FL2VA.SAMPLER_FIRST]!.inputs).toMatchObject({
      guider: [H3_FL2VA.GUIDER_FIRST, 0],
      sigmas: [H3_FL2VA.SPLIT_SIGMAS, 0],
      latent_image: [H3_FL2VA.IMAGE_TO_VIDEO_FIRST, 1],
    })
    expect(workflow[H3_FL2VA.UNLOAD_POST_SAMPLER]!.inputs!.passthrough).toEqual([H3_FL2VA.SAMPLER_FIRST, 1])
    expect(workflow[H3_FL2VA.LATENT_UPSCALER]!.inputs!.latent).toEqual([H3_FL2VA.SEPARATE_AV_MID, 0])
    expect(workflow[H3_FL2VA.CONCAT_AV]!.inputs).toMatchObject({ video_latent: [H3_FL2VA.LATENT_UPSCALER, 0], audio_latent: [H3_FL2VA.SEPARATE_AV_MID, 1] })
    expect(workflow[H3_FL2VA.GUIDER_SECOND]!.inputs).toMatchObject({ model: [H3_FL2VA.CHUNK_FEEDFORWARD, 0], conditioning: [H3_FL2VA.IMAGE_TO_VIDEO_SECOND, 0] })
    expect(workflow[H3_FL2VA.SAMPLER_SECOND]!.inputs).toMatchObject({
      guider: [H3_FL2VA.GUIDER_SECOND, 0],
      sigmas: [H3_FL2VA.MANUAL_SIGMAS, 0],
      latent_image: [H3_FL2VA.CONCAT_AV, 0],
    })
  })

  it('injects settings into sampling, upscaling, resizes, duration, and output', async () => {
    const workflow = await buildH3Fl2vaWorkflow({
      model: 'h3-fl2va',
      prompt: 'fake scene',
      videoDuration: 11,
      inputImage: 'fake.first.png',
      endImage: 'fake-last.png',
    })

    expect(workflow[H3_FL2VA.UNET_LOADER]!.inputs).toMatchObject({ unet_name: 'test-h3-unet.safetensors', weight_dtype: 'fake-weight-dtype' })
    expect(workflow[H3_FL2VA.CLIP_LOADER]!.inputs).toMatchObject({ clip_name: 'test-h3-clip.safetensors', type: 'test-clip-type', device: 'fake-clip-device' })
    expect(workflow[H3_FL2VA.VIDEO_VAE_LOADER]!.inputs!.vae_name).toBe('test-h3-video-vae.safetensors')
    expect(workflow[H3_FL2VA.AUDIO_VAE_LOADER]!.inputs!.vae_name).toBe('test-h3-audio-vae.safetensors')
    expect(workflow[H3_FL2VA.SIGMA_SHIFT]!.inputs).toMatchObject({ shift_video: 7, shift_audio: 2 })
    expect(workflow[H3_FL2VA.CHUNK_FEEDFORWARD]!.inputs).toMatchObject({ enabled: true, chunks: 3, min_tokens: 1024 })
    expect(workflow[H3_FL2VA.SAMPLER_SELECT]!.inputs!.sampler_name).toBe('fake-sampler')
    expect(workflow[H3_FL2VA.SCHEDULER]!.inputs!.scheduler).toBe('fake-scheduler')
    expect(workflow[H3_FL2VA.STEPS]!.inputs!.value).toBe(4)
    expect(workflow[H3_FL2VA.SPLIT_SIGMAS]!.inputs!.step).toBe(6)
    expect(workflow[H3_FL2VA.MANUAL_SIGMAS]!.inputs!.sigmas).toBe('0.93, 0.47, 0.02')
    expect(workflow[H3_FL2VA.LATENT_UPSCALER]!.inputs).toMatchObject({
      model_name: 'fake-h3-upscaler-z9.pth',
      align: 48,
      enable_chunking: true,
      device: 'fake-device-x',
      precision: 'fake-precision-y',
    })

    for (const nodeId of [H3_FL2VA.RESIZE_FIRST_PASS1, H3_FL2VA.RESIZE_LAST_PASS1]) {
      expect(workflow[nodeId]!.inputs).toMatchObject({ megapixels: 0.61, multiple_of: 16, upscale_method: 'fake-resize-method' })
    }
    for (const nodeId of [H3_FL2VA.RESIZE_FIRST_PASS2, H3_FL2VA.RESIZE_LAST_PASS2]) {
      expect(workflow[nodeId]!.inputs).toMatchObject({ megapixels: 0.83, multiple_of: 16, upscale_method: 'fake-resize-method' })
    }

    expect(workflow[H3_FL2VA.FRAME_N]!.inputs!.value).toBe(11)
    expect(workflow[H3_FL2VA.FRAME_MATH]!.inputs!.expression).toBe('10 * a + 3')
    expect(workflow[H3_FL2VA.FPS]!.inputs).toMatchObject({ number_type: 'float', number: 10 })
    expect(workflow[H3_FL2VA.POSITIVE_PROMPT]!.inputs!.positive).toBe('fake scene')
    expect(typeof workflow[H3_FL2VA.RANDOM_NOISE]!.inputs!.noise_seed).toBe('number')
    expect(workflow[H3_FL2VA.VIDEO_COMBINE]!.inputs).toMatchObject({
      crf: 18,
      format: 'fake-video-format',
      pix_fmt: 'fake-pix-format',
      filename_prefix: 'H3FL2VA/fake.first',
    })
  })

  it('wires the sage stack and contains no LoRA node', async () => {
    const workflow = await buildH3Fl2vaWorkflow({ model: 'h3-fl2va', prompt: 'fake prompt', videoDuration: 9, inputImage: 'fake-first.png' })

    expect(workflow[H3_FL2VA.SIGMA_SHIFT]!.inputs!.model).toEqual([H3_FL2VA.UNET_LOADER, 0])
    expect(workflow[H3_FL2VA.SAGE_PATCH]!.inputs).toMatchObject({ sage_attention: 'test-sage-mode', allow_compile: false, model: [H3_FL2VA.SIGMA_SHIFT, 0] })
    expect(workflow[H3_FL2VA.MEMEFF_SAGE]!.inputs!.model).toEqual([H3_FL2VA.SAGE_PATCH, 0])
    expect(workflow[H3_FL2VA.LOW_VRAM_ATTN]!.inputs).toMatchObject({ head_chunks: 5, model: [H3_FL2VA.MEMEFF_SAGE, 0] })
    expect(workflow[H3_FL2VA.CHUNK_FEEDFORWARD]!.inputs!.model).toEqual([H3_FL2VA.LOW_VRAM_ATTN, 0])
    expect(Object.values(workflow).some((node) => node.class_type.includes('LoRA'))).toBe(false)
  })

  it('keeps the RTX node wired when enabled', async () => {
    const workflow = await buildH3Fl2vaWorkflow({ model: 'h3-fl2va', prompt: 'fake prompt', videoDuration: 9, inputImage: 'fake-first.png' })

    expect(workflow[H3_FL2VA.RTX_SUPER_RES]!.inputs).toMatchObject({ resize_type: 'fake-resize-type', 'resize_type.scale': 1.7, quality: 'fake-quality' })
    expect(workflow[H3_FL2VA.VIDEO_COMBINE]!.inputs!.images).toEqual([H3_FL2VA.RTX_SUPER_RES, 0])
  })

  it('removes the RTX node and rewires decoded images when disabled', async () => {
    await prisma.systemSetting.update({ where: { key: 'h3-fl2va.rtx_enabled' }, data: { value: 'false' } })
    const workflow = await buildH3Fl2vaWorkflow({ model: 'h3-fl2va', prompt: 'fake prompt', videoDuration: 9, inputImage: 'fake-first.png' })

    expect(workflow[H3_FL2VA.RTX_SUPER_RES]).toBeUndefined()
    expect(workflow[H3_FL2VA.VIDEO_COMBINE]!.inputs!.images).toEqual([H3_FL2VA.VAE_DECODE, 0])
    assertNoDanglingLinks(workflow)
    assertNoPlaceholders(workflow)
  })

  it('uses the end image basename for the filename prefix in last-only mode', async () => {
    const workflow = await buildH3Fl2vaWorkflow({ model: 'h3-fl2va', prompt: 'fake prompt', videoDuration: 9, endImage: 'fake.last.png' })

    expect(workflow[H3_FL2VA.VIDEO_COMBINE]!.inputs!.filename_prefix).toBe('H3FL2VA/fake.last')
  })
})
