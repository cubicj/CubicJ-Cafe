import { buildH3Ref2vaWorkflow as rawBuilder } from '@/lib/comfyui/workflows/h3-ref2va/builder'
import { prisma } from '@/lib/database/prisma'
import { assertNoDanglingLinks, assertNoPlaceholders } from '@tests/helpers/workflow-assertions'
import { cleanTables } from '@tests/helpers/db'
import { seedH3Ref2va } from '@tests/helpers/h3-ref2va-seed'
import { H3_REF2VA, H3_REF2VA_NO_VIDEO, refImageLoadId, refImageResizeId, refVideoLoadId, refVideoResizeId, refAudioLoadId } from '@/lib/comfyui/workflows/h3-ref2va/nodes'
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

function withVideoParams(overrides: Partial<H3Ref2vaGenerationParams> = {}): H3Ref2vaGenerationParams {
  return baseParams({ refVideos: [{ name: 'v0.mp4', includeSoundtrack: false }], ...overrides })
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
    expect(wf[refImageResizeId(0)]!.inputs).toMatchObject({ megapixels: 0.4, multiple_of: 16, upscale_method: 'fake-resize-method', image: [refImageLoadId(0), 0] })
    expect(wf[H3_REF2VA.REFERENCE_TO_VIDEO]!.inputs!['ref_images.ref_image_0']).toEqual([refImageResizeId(0), 0])
    expect(wf[H3_REF2VA.REFERENCE_TO_VIDEO]!.inputs!['ref_images.ref_image_1']).toEqual([refImageResizeId(1), 0])
    expect(wf[H3_REF2VA.REFERENCE_TO_VIDEO]!.inputs!.ref_image_size).toBe('test-match')
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

  it('composes the frame expression and duration inputs from settings', async () => {
    const wf = await buildH3Ref2vaWorkflow(baseParams())
    expect(wf[H3_REF2VA.FRAME_N]!.inputs!.value).toBe(7)
    expect(wf[H3_REF2VA.FRAME_MATH]!.inputs!.expression).toBe('10 * a + 3')
    expect(wf[H3_REF2VA.FPS]!.inputs!.number).toBe(10)
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

  it('uses the first audio basename for the filename prefix when no images or videos exist', async () => {
    const wf = await buildH3Ref2vaWorkflow(baseParams({
      refImages: [],
      refAudios: ['uploads\\reference.wav'],
      resolution: { mode: 'custom', aspectWidth: 1, aspectHeight: 1 },
    }))
    expect(wf[H3_REF2VA.VIDEO_COMBINE]!.inputs!.filename_prefix).toBe('H3Ref2VA/reference')
  })

  describe('with-video pipeline', () => {
    it('wires videos and soundtracks by slot', async () => {
      const wf = await buildH3Ref2vaWorkflow(baseParams({
        refVideos: [
          { name: 'v0.mp4', includeSoundtrack: false },
          { name: 'v1.mp4', includeSoundtrack: true },
        ],
      }))
      expect(wf[refVideoLoadId(0)]).toEqual({
        inputs: {
          video: 'v0.mp4',
          force_rate: 12,
          custom_width: 0,
          custom_height: 0,
          frame_load_cap: [H3_REF2VA.FRAME_MATH, 0],
          start_time: 0,
          format: 'test-format',
        },
        class_type: 'VHS_LoadVideoFFmpeg',
        _meta: { title: 'Load Video FFmpeg (Upload) 🎥🅥🅗🅢' },
      })
      expect(wf[refVideoResizeId(0)]!.inputs).toMatchObject({ megapixels: 0.3, multiple_of: 16, upscale_method: 'fake-resize-method', image: [refVideoLoadId(0), 0] })
      expect(wf[refVideoResizeId(0)]!.class_type).toBe('ResizeImageToMegapixels')
      expect(wf[refImageResizeId(0)]!.inputs!.megapixels).toBe(0.5)
      expect(wf[H3_REF2VA.REFERENCE_TO_VIDEO]!.inputs!['ref_videos.ref_video_0']).toEqual([refVideoResizeId(0), 0])
      expect(wf[H3_REF2VA.REFERENCE_TO_VIDEO]!.inputs!['ref_videos.ref_video_1']).toEqual([refVideoResizeId(1), 0])
      expect(wf[H3_REF2VA.REFERENCE_TO_VIDEO]!.inputs!['ref_video_audios.ref_video_audio_0']).toBeUndefined()
      expect(wf[H3_REF2VA.REFERENCE_TO_VIDEO]!.inputs!['ref_video_audios.ref_video_audio_1']).toEqual([refVideoLoadId(1), 2])
    })

    it('wires the sage attention stack between sigma shift and chunk feedforward', async () => {
      const wf = await buildH3Ref2vaWorkflow(withVideoParams())
      expect(wf[H3_REF2VA.SAGE_PATCH]!.inputs).toMatchObject({ sage_attention: 'test-sage-mode', allow_compile: false, model: [H3_REF2VA.SIGMA_SHIFT, 0] })
      expect(wf[H3_REF2VA.MEMEFF_SAGE]!.inputs!.model).toEqual([H3_REF2VA.SAGE_PATCH, 0])
      expect(wf[H3_REF2VA.LOW_VRAM_ATTN]!.inputs).toMatchObject({ head_chunks: 5, model: [H3_REF2VA.MEMEFF_SAGE, 0] })
      expect(wf[H3_REF2VA.CHUNK_FEEDFORWARD]!.inputs!.model).toEqual([H3_REF2VA.LOW_VRAM_ATTN, 0])
      expect(wf['3']).toBeUndefined()
      expect(wf['11']).toBeUndefined()
      expect(wf['12']).toBeUndefined()
    })

    it('uses the source-aligned processing node ids and links', async () => {
      const wf = await buildH3Ref2vaWorkflow(withVideoParams())
      expect(H3_REF2VA.CHUNK_FEEDFORWARD).toBe('52')
      expect(H3_REF2VA.SEPARATE_AV).toBe('62')
      expect(wf['9']).toBeUndefined()
      expect(wf['28']).toBeUndefined()
      expect(wf[H3_REF2VA.CHUNK_FEEDFORWARD]!.class_type).toBe('MiniMaxH3ChunkFeedForward')
      expect(wf[H3_REF2VA.GUIDER]!.inputs!.model).toEqual([H3_REF2VA.CHUNK_FEEDFORWARD, 0])
      expect(wf[H3_REF2VA.SCHEDULER]!.inputs!.model).toEqual([H3_REF2VA.CHUNK_FEEDFORWARD, 0])
      expect(wf[H3_REF2VA.SEPARATE_AV]!.class_type).toBe('LTXVSeparateAVLatent')
      expect(wf[H3_REF2VA.VAE_DECODE]!.inputs!.samples).toEqual([H3_REF2VA.SEPARATE_AV, 0])
      expect(wf[H3_REF2VA.VAE_DECODE_AUDIO]!.inputs!.samples).toEqual([H3_REF2VA.SEPARATE_AV, 1])
      expect(wf[H3_REF2VA.FPS]!.inputs!.number_type).toBe('float')
    })

    it('injects model files, sampling, and output settings', async () => {
      const wf = await buildH3Ref2vaWorkflow(withVideoParams({ prompt: 'a scene' }))
      expect(wf[H3_REF2VA.UNET_LOADER]!.inputs).toMatchObject({ unet_name: 'test-h3r-unet.safetensors', weight_dtype: 'fake-weight-dtype' })
      expect(wf[H3_REF2VA.TURBO_LORA]!.inputs).toMatchObject({ lora_name: 'test-h3r-lora.safetensors', strength_model: 0.9 })
      expect(wf[H3_REF2VA.CLIP_LOADER]!.inputs).toMatchObject({ clip_name: 'test-h3r-clip.safetensors', type: 'test-clip-type', device: 'fake-clip-device' })
      expect(wf[H3_REF2VA.VIDEO_VAE_LOADER]!.inputs!.vae_name).toBe('test-h3r-video-vae.safetensors')
      expect(wf[H3_REF2VA.AUDIO_VAE_LOADER]!.inputs!.vae_name).toBe('test-h3r-audio-vae.safetensors')
      expect(wf[H3_REF2VA.SIGMA_SHIFT]!.inputs).toMatchObject({ shift_video: 7, shift_audio: 2 })
      expect(wf[H3_REF2VA.CHUNK_FEEDFORWARD]!.inputs).toMatchObject({ enabled: true, chunks: 3, min_tokens: 1024 })
      expect(wf[H3_REF2VA.SAMPLER_SELECT]!.inputs!.sampler_name).toBe('fake-sampler')
      expect(wf[H3_REF2VA.SCHEDULER]!.inputs!.scheduler).toBe('fake-scheduler')
      expect(wf[H3_REF2VA.STEPS]!.inputs!.value).toBe(4)
      expect(wf[H3_REF2VA.POSITIVE_PROMPT]!.inputs!.positive).toBe('a scene')
      expect(typeof wf[H3_REF2VA.RANDOM_NOISE]!.inputs!.noise_seed).toBe('number')
      expect(wf[H3_REF2VA.VIDEO_COMBINE]!.inputs).toMatchObject({ crf: 18, format: 'fake-video-format', pix_fmt: 'fake-pix-format', filename_prefix: 'H3Ref2VA/img0' })
    })

    it('uses the first video name for the filename prefix when no images exist', async () => {
      const wf = await buildH3Ref2vaWorkflow(withVideoParams({
        refImages: [],
        refVideos: [{ name: 'uploads/clip.mp4', includeSoundtrack: false }],
        resolution: { mode: 'custom', aspectWidth: 16, aspectHeight: 9 },
      }))
      expect(wf[H3_REF2VA.VIDEO_COMBINE]!.inputs!.filename_prefix).toBe('H3Ref2VA/clip')
    })

    it('injects literal custom resolution from settings megapixels', async () => {
      const wf = await buildH3Ref2vaWorkflow(withVideoParams({ resolution: { mode: 'custom', aspectWidth: 16, aspectHeight: 9 } }))
      expect(wf[H3_REF2VA.REFERENCE_TO_VIDEO]!.inputs!.width).toBe(944)
      expect(wf[H3_REF2VA.REFERENCE_TO_VIDEO]!.inputs!.height).toBe(528)
    })
  })

  describe('no-video pipeline', () => {
    it('builds the two-pass graph without turbo lora', async () => {
      const wf = await buildH3Ref2vaWorkflow(baseParams())
      expect(wf['8']).toBeUndefined()
      expect(wf[H3_REF2VA_NO_VIDEO.UNET_LOADER]!.inputs).toMatchObject({ unet_name: 'test-h3r-nv-unet.safetensors', weight_dtype: 'fake-weight-dtype' })
      expect(wf[H3_REF2VA_NO_VIDEO.SIGMA_SHIFT]!.inputs!.model).toEqual([H3_REF2VA_NO_VIDEO.UNET_LOADER, 0])
      expect(wf[H3_REF2VA_NO_VIDEO.SAMPLER_SELECT]!.inputs!.sampler_name).toBe('test-nv-sampler')
      expect(wf[H3_REF2VA_NO_VIDEO.SCHEDULER]!.inputs!.scheduler).toBe('test-nv-scheduler')
      expect(wf[H3_REF2VA_NO_VIDEO.STEPS]!.inputs!.value).toBe(9)
      expect(wf[H3_REF2VA_NO_VIDEO.CHUNK_FEEDFORWARD]!.inputs).toMatchObject({ enabled: true, chunks: 5, min_tokens: 512, model: [H3_REF2VA_NO_VIDEO.LOW_VRAM_ATTN, 0] })
    })

    it('loads the no-video clip and video vae with shared type, device, and audio vae', async () => {
      const wf = await buildH3Ref2vaWorkflow(baseParams())
      expect(wf[H3_REF2VA_NO_VIDEO.CLIP_LOADER]!.inputs).toMatchObject({ clip_name: 'test-h3r-nv-clip.safetensors', type: 'test-clip-type', device: 'fake-clip-device' })
      expect(wf[H3_REF2VA_NO_VIDEO.VIDEO_VAE_LOADER]!.inputs!.vae_name).toBe('test-h3r-nv-video-vae.safetensors')
      expect(wf[H3_REF2VA_NO_VIDEO.AUDIO_VAE_LOADER]!.inputs!.vae_name).toBe('test-h3r-audio-vae.safetensors')
    })

    it('wires the split-sigma first pass and manual-sigma second pass', async () => {
      const wf = await buildH3Ref2vaWorkflow(baseParams())
      expect(wf[H3_REF2VA_NO_VIDEO.SPLIT_SIGMAS]!.inputs).toMatchObject({ step: 6, sigmas: [H3_REF2VA_NO_VIDEO.SCHEDULER, 0] })
      expect(wf[H3_REF2VA_NO_VIDEO.SAMPLER_FIRST]!.inputs).toMatchObject({ sigmas: [H3_REF2VA_NO_VIDEO.SPLIT_SIGMAS, 0], latent_image: [H3_REF2VA_NO_VIDEO.REFERENCE_TO_VIDEO, 1] })
      expect(wf[H3_REF2VA_NO_VIDEO.UNLOAD_POST_SAMPLER]!.inputs!.passthrough).toEqual([H3_REF2VA_NO_VIDEO.SAMPLER_FIRST, 1])
      expect(wf[H3_REF2VA_NO_VIDEO.MANUAL_SIGMAS]!.inputs!.sigmas).toBe('0.9, 0.5, 0.1, 0.0')
      expect(wf[H3_REF2VA_NO_VIDEO.SAMPLER_SECOND]!.inputs).toMatchObject({ sigmas: [H3_REF2VA_NO_VIDEO.MANUAL_SIGMAS, 0], latent_image: [H3_REF2VA_NO_VIDEO.CONCAT_AV, 0] })
      expect(wf[H3_REF2VA_NO_VIDEO.VAE_DECODE]!.inputs!.samples).toEqual([H3_REF2VA_NO_VIDEO.SEPARATE_AV_FINAL, 0])
      expect(wf[H3_REF2VA_NO_VIDEO.VAE_DECODE_AUDIO]!.inputs!.samples).toEqual([H3_REF2VA_NO_VIDEO.SEPARATE_AV_FINAL, 1])
    })

    it('configures the latent upscaler from no-video settings', async () => {
      const wf = await buildH3Ref2vaWorkflow(baseParams())
      expect(wf[H3_REF2VA_NO_VIDEO.LATENT_UPSCALER]!.inputs).toMatchObject({
        model_name: 'test-nv-upscaler.pth',
        mode: 'megapixels',
        'mode.megapixels': 0.6,
        align: 8,
        enable_chunking: false,
        device: 'test-device',
        precision: 'test-precision',
        latent: [H3_REF2VA_NO_VIDEO.SEPARATE_AV_MID, 0],
      })
      expect(wf[H3_REF2VA_NO_VIDEO.CONCAT_AV]!.inputs).toMatchObject({ video_latent: [H3_REF2VA_NO_VIDEO.LATENT_UPSCALER, 0], audio_latent: [H3_REF2VA_NO_VIDEO.SEPARATE_AV_MID, 1] })
    })

    it('resizes references with the no-video megapixels and computes custom resolution from them', async () => {
      const wf = await buildH3Ref2vaWorkflow(baseParams({ resolution: { mode: 'custom', aspectWidth: 16, aspectHeight: 9 } }))
      expect(wf[refImageResizeId(0)]!.inputs!.megapixels).toBe(0.4)
      expect(wf[H3_REF2VA_NO_VIDEO.REFERENCE_TO_VIDEO]!.inputs!.width).toBe(848)
      expect(wf[H3_REF2VA_NO_VIDEO.REFERENCE_TO_VIDEO]!.inputs!.height).toBe(480)
    })

    it('wires the sage stack in the no-video graph', async () => {
      const wf = await buildH3Ref2vaWorkflow(baseParams())
      expect(wf[H3_REF2VA_NO_VIDEO.SAGE_PATCH]!.inputs).toMatchObject({ sage_attention: 'test-sage-mode', allow_compile: false, model: [H3_REF2VA_NO_VIDEO.SIGMA_SHIFT, 0] })
      expect(wf[H3_REF2VA_NO_VIDEO.MEMEFF_SAGE]!.inputs!.model).toEqual([H3_REF2VA_NO_VIDEO.SAGE_PATCH, 0])
      expect(wf[H3_REF2VA_NO_VIDEO.LOW_VRAM_ATTN]!.inputs).toMatchObject({ head_chunks: 5, model: [H3_REF2VA_NO_VIDEO.MEMEFF_SAGE, 0] })
    })
  })
})
