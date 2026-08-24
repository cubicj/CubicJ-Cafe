import { buildH3Ref2vaWorkflow as rawBuilder } from '@/lib/comfyui/workflows/h3-ref2va/builder'
import { prisma } from '@/lib/database/prisma'
import { assertNoDanglingLinks, assertNoPlaceholders } from '@tests/helpers/workflow-assertions'
import { cleanTables } from '@tests/helpers/db'
import { seedH3Ref2va } from '@tests/helpers/h3-ref2va-seed'
import { H3_REF2VA, refImageLoadId, refImageResizeId, refVideoLoadId, refVideoResizeId, refAudioLoadId } from '@/lib/comfyui/workflows/h3-ref2va/nodes'
import type { H3Ref2vaGenerationParams } from '@/lib/comfyui/workflows/types'
import type { ComfyUIWorkflow } from '@/types'

let lastWorkflow: ComfyUIWorkflow | null = null
const buildH3Ref2vaWorkflow = async (params: H3Ref2vaGenerationParams) => {
  const wf = await rawBuilder(params)
  lastWorkflow = wf
  return wf
}

function baseParams(overrides: Partial<H3Ref2vaGenerationParams> = {}): H3Ref2vaGenerationParams {
  return {
    model: 'h3-ref2va',
    prompt: 'p',
    videoDuration: 7,
    refImages: ['img0.png'],
    refVideos: [],
    refAudios: [],
    resolution: { mode: 'firstImage' },
    ...overrides,
  }
}

beforeEach(async () => {
  await cleanTables()
  await seedH3Ref2va()
})

afterEach(() => {
  if (lastWorkflow) assertNoPlaceholders(lastWorkflow)
  lastWorkflow = null
})

describe('buildH3Ref2vaWorkflow', () => {
  it.each([
    baseParams(),
    baseParams({ refImages: ['a.png', 'b.png'], refVideos: [{ name: 'v0.mp4', includeSoundtrack: true }] }),
    baseParams({ refImages: [], refVideos: [{ name: 'v0.mp4', includeSoundtrack: false }], resolution: { mode: 'custom', aspectWidth: 16, aspectHeight: 9 } }),
    baseParams({ refImages: [], refVideos: [], refAudios: ['a0.wav'], resolution: { mode: 'custom', aspectWidth: 1, aspectHeight: 1 } }),
    baseParams({
      refImages: Array.from({ length: 9 }, (_, i) => `img${i}.png`),
      refVideos: [
        { name: 'v0.mp4', includeSoundtrack: true },
        { name: 'v1.mp4', includeSoundtrack: false },
        { name: 'v2.mp4', includeSoundtrack: true },
      ],
      refAudios: ['a0.wav', 'a1.flac', 'a2.mp3'],
    }),
  ])('has no dangling links (case %#)', async (params) => {
    const wf = await buildH3Ref2vaWorkflow(params)
    assertNoDanglingLinks(wf)
  })

  it('throws when no reference is provided', async () => {
    await expect(rawBuilder(baseParams({ refImages: [], resolution: { mode: 'custom', aspectWidth: 1, aspectHeight: 1 } }))).rejects.toThrow()
  })

  it('throws for firstImage resolution without images', async () => {
    await expect(rawBuilder(baseParams({ refImages: [], refAudios: ['a0.wav'] }))).rejects.toThrow()
  })

  it.each([
    baseParams({ refImages: Array.from({ length: 10 }, (_, i) => `img${i}.png`) }),
    baseParams({ refVideos: Array.from({ length: 4 }, (_, i) => ({ name: `video${i}.mp4`, includeSoundtrack: false })) }),
    baseParams({ refAudios: Array.from({ length: 4 }, (_, i) => `audio${i}.wav`) }),
  ])('throws when reference counts exceed the node limits (case %#)', async (params) => {
    await expect(rawBuilder(params)).rejects.toThrow()
  })

  it('wires image references through per-slot resize nodes', async () => {
    const wf = await buildH3Ref2vaWorkflow(baseParams({ refImages: ['a.png', 'b.png'] }))
    expect(wf[refImageLoadId(0)]!.inputs!.image).toBe('a.png')
    expect(wf[refImageLoadId(1)]!.inputs!.image).toBe('b.png')
    expect(wf[refImageResizeId(0)]!.inputs).toMatchObject({ megapixels: 0.5, multiple_of: 16, upscale_method: 'fake-resize-method', image: [refImageLoadId(0), 0] })
    expect(wf[H3_REF2VA.REFERENCE_TO_VIDEO]!.inputs!['ref_images.ref_image_0']).toEqual([refImageResizeId(0), 0])
    expect(wf[H3_REF2VA.REFERENCE_TO_VIDEO]!.inputs!['ref_images.ref_image_1']).toEqual([refImageResizeId(1), 0])
    expect(wf[H3_REF2VA.REFERENCE_TO_VIDEO]!.inputs!.ref_image_size).toBe('test-match')
  })

  it('wires videos and soundtracks by slot', async () => {
    const wf = await buildH3Ref2vaWorkflow(baseParams({
      refVideos: [
        { name: 'v0.mp4', includeSoundtrack: false },
        { name: 'v1.mp4', includeSoundtrack: true },
      ],
    }))
    expect(wf[refVideoLoadId(0)]!.inputs).toMatchObject({ video: 'v0.mp4', force_rate: 12, format: 'test-format' })
    expect(wf[refVideoResizeId(0)]!.inputs).toMatchObject({ megapixels: 0.3, multiple_of: 16, upscale_method: 'fake-resize-method', image: [refVideoLoadId(0), 0] })
    expect(wf[refVideoResizeId(0)]!.class_type).toBe('ResizeImageToMegapixels')
    expect(wf[H3_REF2VA.REFERENCE_TO_VIDEO]!.inputs!['ref_videos.ref_video_0']).toEqual([refVideoResizeId(0), 0])
    expect(wf[H3_REF2VA.REFERENCE_TO_VIDEO]!.inputs!['ref_videos.ref_video_1']).toEqual([refVideoResizeId(1), 0])
    expect(wf[H3_REF2VA.REFERENCE_TO_VIDEO]!.inputs!['ref_video_audios.ref_video_audio_0']).toBeUndefined()
    expect(wf[H3_REF2VA.REFERENCE_TO_VIDEO]!.inputs!['ref_video_audios.ref_video_audio_1']).toEqual([refVideoLoadId(1), 2])
  })

  it('wires standalone audio references', async () => {
    const wf = await buildH3Ref2vaWorkflow(baseParams({ refAudios: ['a0.wav'] }))
    expect(wf[refAudioLoadId(0)]!.inputs!.audio).toBe('a0.wav')
    expect(wf[H3_REF2VA.REFERENCE_TO_VIDEO]!.inputs!['ref_audios.ref_audio_0']).toEqual([refAudioLoadId(0), 0])
  })

  it('wires firstImage resolution from the first resize node outputs', async () => {
    const wf = await buildH3Ref2vaWorkflow(baseParams())
    expect(wf[H3_REF2VA.REFERENCE_TO_VIDEO]!.inputs!.width).toEqual([refImageResizeId(0), 1])
    expect(wf[H3_REF2VA.REFERENCE_TO_VIDEO]!.inputs!.height).toEqual([refImageResizeId(0), 2])
  })

  it('injects literal custom resolution from settings megapixels', async () => {
    const wf = await buildH3Ref2vaWorkflow(baseParams({ resolution: { mode: 'custom', aspectWidth: 16, aspectHeight: 9 } }))
    expect(wf[H3_REF2VA.REFERENCE_TO_VIDEO]!.inputs!.width).toBe(944)
    expect(wf[H3_REF2VA.REFERENCE_TO_VIDEO]!.inputs!.height).toBe(528)
  })

  it('uses video-conditional steps and output megapixels when a reference video is present', async () => {
    const wf = await buildH3Ref2vaWorkflow(baseParams({
      refImages: ['a.png', 'b.png'],
      refVideos: [{ name: 'v0.mp4', includeSoundtrack: false }],
      resolution: { mode: 'custom', aspectWidth: 16, aspectHeight: 9 },
    }))
    expect(wf[H3_REF2VA.STEPS]!.inputs!.value).toBe(7)
    expect(wf[refImageResizeId(0)]!.inputs!.megapixels).toBe(0.21)
    expect(wf[refImageResizeId(1)]!.inputs!.megapixels).toBe(0.21)
    expect(wf[refVideoResizeId(0)]!.inputs!.megapixels).toBe(0.3)
    expect(wf[H3_REF2VA.REFERENCE_TO_VIDEO]!.inputs!.width).toBe(608)
    expect(wf[H3_REF2VA.REFERENCE_TO_VIDEO]!.inputs!.height).toBe(336)
  })

  it('composes the frame expression and duration inputs from settings', async () => {
    const wf = await buildH3Ref2vaWorkflow(baseParams())
    expect(wf[H3_REF2VA.FRAME_N]!.inputs!.value).toBe(7)
    expect(wf[H3_REF2VA.FRAME_MATH]!.inputs!.expression).toBe('10 * a + 3')
    expect(wf[H3_REF2VA.FPS]!.inputs!.number).toBe(10)
  })

  it('injects model files, sampling, and output settings', async () => {
    const wf = await buildH3Ref2vaWorkflow(baseParams({ prompt: 'a scene' }))
    expect(wf[H3_REF2VA.UNET_LOADER]!.inputs).toMatchObject({ unet_name: 'test-h3r-unet.safetensors', weight_dtype: 'fake-weight-dtype' })
    expect(wf[H3_REF2VA.TURBO_LORA]!.inputs).toMatchObject({ lora_name: 'test-h3r-lora.safetensors', strength_model: 0.9 })
    expect(wf[H3_REF2VA.CLIP_LOADER]!.inputs).toMatchObject({ clip_name: 'test-h3r-clip.safetensors', type: 'test-clip-type', device: 'fake-clip-device' })
    expect(wf[H3_REF2VA.VIDEO_VAE_LOADER]!.inputs!.vae_name).toBe('test-h3r-video-vae.safetensors')
    expect(wf[H3_REF2VA.AUDIO_VAE_LOADER]!.inputs!.vae_name).toBe('test-h3r-audio-vae.safetensors')
    expect(wf[H3_REF2VA.SIGMA_SHIFT]!.inputs).toMatchObject({ shift_video: 7, shift_audio: 2 })
    expect(wf[H3_REF2VA.ATTENTION_BACKEND]!.inputs!.attention).toBe('test attention')
    expect(wf[H3_REF2VA.FUSED_MODULATION]!.inputs!.enabled).toBe(true)
    expect(wf[H3_REF2VA.CHUNK_FEEDFORWARD]!.inputs).toMatchObject({ enabled: true, chunks: 3, min_tokens: 1024 })
    expect(wf[H3_REF2VA.SAMPLER_SELECT]!.inputs!.sampler_name).toBe('fake-sampler')
    expect(wf[H3_REF2VA.SCHEDULER]!.inputs!.scheduler).toBe('fake-scheduler')
    expect(wf[H3_REF2VA.STEPS]!.inputs!.value).toBe(4)
    expect(wf[H3_REF2VA.POSITIVE_PROMPT]!.inputs!.positive).toBe('a scene')
    expect(typeof wf[H3_REF2VA.RANDOM_NOISE]!.inputs!.noise_seed).toBe('number')
    expect(wf[H3_REF2VA.VIDEO_COMBINE]!.inputs).toMatchObject({ crf: 18, format: 'fake-video-format', pix_fmt: 'fake-pix-format', filename_prefix: 'H3Ref2VA/img0' })
  })

  it('removes the sol attn node and rewires the chain when disabled', async () => {
    const wf = await buildH3Ref2vaWorkflow(baseParams())
    expect(wf[H3_REF2VA.SOL_ATTN]).toBeUndefined()
    expect(wf[H3_REF2VA.FUSED_MODULATION]!.inputs!.model).toEqual([H3_REF2VA.ATTENTION_BACKEND, 0])
  })

  it('keeps and configures the sol attn node when enabled', async () => {
    await prisma.systemSetting.update({ where: { key: 'h3-ref2va.sol_attn_enabled' }, data: { value: 'true' } })
    const wf = await buildH3Ref2vaWorkflow(baseParams())
    expect(wf[H3_REF2VA.SOL_ATTN]!.inputs).toMatchObject({
      enabled: true,
      tau_start: 1.1,
      tau_end: 0.7,
      curve: 'test-curve',
      min_tokens: 2048,
      strict: false,
      dense_percent: 0.5,
      thresh_type: 'test-thresh',
      int8_qk: true,
      int8_pv: false,
      sink_conditioning: 'test-sink',
      dense_blocks: '',
    })
    expect(wf[H3_REF2VA.FUSED_MODULATION]!.inputs!.model).toEqual([H3_REF2VA.SOL_ATTN, 0])
  })

  it('keeps RTX node wired when enabled', async () => {
    const wf = await buildH3Ref2vaWorkflow(baseParams())
    expect(wf[H3_REF2VA.RTX_SUPER_RES]!.inputs).toMatchObject({ resize_type: 'fake-resize-type', 'resize_type.scale': 1.7, quality: 'HIGH' })
    expect(wf[H3_REF2VA.VIDEO_COMBINE]!.inputs!.images).toEqual([H3_REF2VA.RTX_SUPER_RES, 0])
  })

  it('strips RTX node when disabled', async () => {
    await prisma.systemSetting.update({ where: { key: 'h3-ref2va.rtx_enabled' }, data: { value: 'false' } })
    const wf = await buildH3Ref2vaWorkflow(baseParams())
    expect(wf[H3_REF2VA.RTX_SUPER_RES]).toBeUndefined()
    expect(wf[H3_REF2VA.VIDEO_COMBINE]!.inputs!.images).toEqual([H3_REF2VA.VAE_DECODE, 0])
  })

  it('uses the first video name for the filename prefix when no images exist', async () => {
    const wf = await buildH3Ref2vaWorkflow(baseParams({
      refImages: [],
      refVideos: [{ name: 'uploads/clip.mp4', includeSoundtrack: false }],
      resolution: { mode: 'custom', aspectWidth: 16, aspectHeight: 9 },
    }))
    expect(wf[H3_REF2VA.VIDEO_COMBINE]!.inputs!.filename_prefix).toBe('H3Ref2VA/clip')
  })

  it('uses the first audio basename for the filename prefix when no images or videos exist', async () => {
    const wf = await buildH3Ref2vaWorkflow(baseParams({
      refImages: [],
      refAudios: ['uploads\\reference.wav'],
      resolution: { mode: 'custom', aspectWidth: 1, aspectHeight: 1 },
    }))
    expect(wf[H3_REF2VA.VIDEO_COMBINE]!.inputs!.filename_prefix).toBe('H3Ref2VA/reference')
  })
})
