import { buildLtxWorkflow as rawBuilder } from '@/lib/comfyui/workflows/ltx/builder'
import { prisma } from '@/lib/database/prisma'
import { assertNoPlaceholders } from '../helpers/workflow-assertions'
import { cleanTables } from '../helpers/db'
import type { ComfyUIWorkflow } from '@/types'
import { LTX } from '@/lib/comfyui/workflows/ltx/nodes'

const END_IMAGE = {
  LOAD_IMAGE: '260',
  FRAME_INDEX: '261',
  RESIZE: '264',
} as const

let lastWorkflow: ComfyUIWorkflow | null = null
const buildLtxWorkflow = async (...args: Parameters<typeof rawBuilder>) => {
  const wf = await rawBuilder(...args)
  lastWorkflow = wf
  return wf
}

async function updateSettings(settings: Record<string, string>) {
  await prisma.$transaction(
    Object.entries(settings).map(([key, value]) =>
      prisma.systemSetting.update({
        where: { key },
        data: { value },
      })
    )
  )
}

beforeEach(async () => {
  await cleanTables()
})

afterEach(() => {
  if (lastWorkflow) assertNoPlaceholders(lastWorkflow)
  lastWorkflow = null
})

describe('buildLtxWorkflow', () => {
  it('builds base workflow with prompt, input image, models, duration, and conditioning prompts', async () => {
    const wf = await buildLtxWorkflow({
      model: 'ltx',
      prompt: 'fake requested scene',
      inputImage: 'fake-start.png',
      videoDuration: 8,
    })

    expect(wf[LTX.POSITIVE_PROMPT]!.inputs!.text).toBe('fake requested scene')
    expect(wf[LTX.NEGATIVE_PROMPT]!.inputs!.text).toBe('fake negative prompt z8r')
    expect(wf[LTX.VIDEO_CONDITIONING_PROMPT]!.inputs!.text).toBe('fake video conditioning prompt h2k')
    expect(wf[LTX.AUDIO_CONDITIONING_PROMPT]!.inputs!.text).toBe('fake audio conditioning prompt m9t')
    expect(wf[LTX.DURATION]!.inputs!.value).toBe(8)
    expect(wf[LTX.FRAME_BASE]!.inputs!.value).toBe(10)
    expect(wf[LTX.FRAME_RATE]!.inputs!.number).toBe(18)
    expect(wf[LTX.LOAD_IMAGE_START]!.inputs!.image).toBe('fake-start.png')
    expect(wf[LTX.CHECKPOINT]!.inputs!.ckpt_name).toBe('fake-ltx-checkpoint-q7m.safetensors')
    expect(wf[LTX.AUDIO_VAE]!.inputs!.ckpt_name).toBe('fake-ltx-checkpoint-q7m.safetensors')
    expect(wf[LTX.TEXT_ENCODER]!.inputs).toMatchObject({
      text_encoder: 'fake-ltx-text-encoder-p4v.safetensors',
      ckpt_name: 'fake-ltx-checkpoint-q7m.safetensors',
    })
    expect(wf[LTX.RESIZE_START_IMAGE]!.inputs).toMatchObject({
      megapixels: 0.73,
      multiple_of: 24,
      upscale_method: 'fake-resize-method',
    })
    expect(wf[LTX.LOAD_AUDIO]).toBeUndefined()
    expect(wf[LTX.REFERENCE_AUDIO]).toBeUndefined()
  })

  it('injects scheduler, NAG, guide, anchor, and scheduled CFG settings', async () => {
    const wf = await buildLtxWorkflow({
      model: 'ltx',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
    })

    expect(wf[LTX.CLOWN_SAMPLER]!.inputs).toMatchObject({
      sampler_name: 'fake-sampler-r6d',
      eta: 0.17,
      bongmath: true,
    })
    expect(wf[LTX.SCHEDULER]!.inputs).toMatchObject({
      steps: 13,
      max_shift: 1.37,
      base_shift: 0.41,
      stretch: false,
      terminal: 0.23,
    })
    expect(wf[LTX.NAG]!.inputs).toMatchObject({
      nag_scale: 3.4,
      nag_alpha: 0.19,
      nag_tau: 1.61,
    })
    expect(wf[LTX.ADD_GUIDE]!.inputs).toMatchObject({
      frame_idx: 3,
      strength: 0.46,
      crf: 27,
      blur_radius: 5,
      interpolation: 'fake-guide-interpolation',
      crop: 'fake-guide-crop',
    })
    expect(wf[LTX.ANCHOR]!.inputs).toMatchObject({
      strength: 0.31,
      cache_at_step: 4,
      similarity_threshold: 0.62,
      decay_with_distance: 0.27,
      energy_threshold: 0.18,
      bypass: true,
      debug: false,
      advanced_mode: true,
      cache_mode: 'fake-anchor-cache-mode',
      forwards_per_step: 2,
      cache_warmup: 6,
      anchor_frame: 1,
      depth_curve: 'fake-anchor-depth-curve',
      block_index_filter: 'fake-block-filter-2,4,6',
    })
    expect(wf[LTX.SCHEDULED_CFG]!.inputs).toMatchObject({
      cfg: 2.2,
      start_percent: 0.08,
      end_percent: 0.77,
    })
  })

  it('injects four LoRA slots with routing values and chains enabled slots', async () => {
    const wf = await buildLtxWorkflow({
      model: 'ltx',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
    })

    expect(wf[LTX.LORA_3]!.inputs).toMatchObject({
      lora_name: 'fake-ltx-lora-slot3-c3e.safetensors',
      strength_model: 0.73,
      video: 0.31,
      video_to_audio: 0.32,
      audio: 0.33,
      audio_to_video: 0.34,
      other: 0.35,
      model: [LTX.SAGE_ATTN_PATCH, 0],
    })
    expect(wf[LTX.LORA_2]!.inputs).toMatchObject({
      lora_name: 'fake-ltx-lora-slot2-b2w.safetensors',
      strength_model: 0.62,
      video: 0.21,
      video_to_audio: 0.22,
      audio: 0.23,
      audio_to_video: 0.24,
      other: 0.25,
      model: [LTX.LORA_3, 0],
    })
    expect(wf[LTX.LORA_4]!.inputs).toMatchObject({
      lora_name: 'fake-ltx-lora-slot4-d4r.safetensors',
      strength_model: 0.84,
      video: 0.41,
      video_to_audio: 0.42,
      audio: 0.43,
      audio_to_video: 0.44,
      other: 0.45,
      model: [LTX.LORA_2, 0],
    })
    expect(wf[LTX.LORA_1]!.inputs).toMatchObject({
      lora_name: 'fake-ltx-lora-slot1-a1q.safetensors',
      strength_model: 0.51,
      video: 0.11,
      video_to_audio: 0.12,
      audio: 0.13,
      audio_to_video: 0.14,
      other: 0.15,
      model: [LTX.LORA_4, 0],
    })
    expect(wf[LTX.NAG]!.inputs!.model).toEqual([LTX.LORA_1, 0])
  })

  it('bypasses a disabled LoRA in a mixed enabled chain', async () => {
    await updateSettings({ 'ltx.lora_2_enabled': 'false' })

    const wf = await buildLtxWorkflow({
      model: 'ltx',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
    })

    expect(wf[LTX.LORA_3]!.inputs).toMatchObject({
      strength_model: 0.73,
      model: [LTX.SAGE_ATTN_PATCH, 0],
    })
    expect(wf[LTX.LORA_2]).toBeUndefined()
    expect(wf[LTX.LORA_4]!.inputs).toMatchObject({
      strength_model: 0.84,
      model: [LTX.LORA_3, 0],
    })
    expect(wf[LTX.LORA_1]!.inputs).toMatchObject({
      strength_model: 0.51,
      model: [LTX.LORA_4, 0],
    })
    expect(wf[LTX.NAG]!.inputs!.model).toEqual([LTX.LORA_1, 0])
  })

  it('removes disabled LoRA nodes while bypassing the chain', async () => {
    await updateSettings({
      'ltx.lora_1_enabled': 'false',
      'ltx.lora_2_enabled': 'false',
      'ltx.lora_3_enabled': 'false',
      'ltx.lora_4_enabled': 'false',
    })

    const wf = await buildLtxWorkflow({
      model: 'ltx',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
    })

    for (const id of [LTX.LORA_1, LTX.LORA_2, LTX.LORA_3, LTX.LORA_4]) {
      expect(wf[id]).toBeUndefined()
    }
    expect(wf[LTX.NAG]!.inputs!.model).toEqual([LTX.SAGE_ATTN_PATCH, 0])
  })

  it('injects end image nodes when endImage provided', async () => {
    const wf = await buildLtxWorkflow({
      model: 'ltx',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
      endImage: 'fake-end.png',
    })

    expect(wf[END_IMAGE.LOAD_IMAGE]).toMatchObject({
      inputs: { image: 'fake-end.png' },
      class_type: 'LoadImage',
    })
    expect(wf[END_IMAGE.FRAME_INDEX]!.inputs).toMatchObject({
      expression: 'a - 1',
      a: [LTX.FRAME_COUNT_MATH, 0],
    })
    expect(wf[END_IMAGE.RESIZE]!.inputs).toMatchObject({
      megapixels: 0.73,
      multiple_of: 24,
      upscale_method: 'fake-resize-method',
      image: [END_IMAGE.LOAD_IMAGE, 0],
    })
    expect(wf[LTX.IMG_TO_VIDEO]!.inputs!['num_images']).toBe('2')
    expect(wf[LTX.IMG_TO_VIDEO]!.inputs!['num_images.image_2']).toEqual([END_IMAGE.RESIZE, 0])
    expect(wf[LTX.IMG_TO_VIDEO]!.inputs!['num_images.index_2']).toEqual([END_IMAGE.FRAME_INDEX, 0])
    expect(wf[LTX.IMG_TO_VIDEO]!.inputs!['num_images.strength_2']).toBe(1)
  })

  it('removes end image nodes when endImage absent', async () => {
    const wf = await buildLtxWorkflow({
      model: 'ltx',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
    })

    expect(wf[END_IMAGE.LOAD_IMAGE]).toBeUndefined()
    expect(wf[END_IMAGE.FRAME_INDEX]).toBeUndefined()
    expect(wf[END_IMAGE.RESIZE]).toBeUndefined()
    expect(wf[LTX.IMG_TO_VIDEO]!.inputs!['num_images']).toBe('1')
    expect(wf[LTX.IMG_TO_VIDEO]!.inputs!['num_images.image_2']).toBeUndefined()
    expect(wf[LTX.IMG_TO_VIDEO]!.inputs!['num_images.index_2']).toBeUndefined()
    expect(wf[LTX.IMG_TO_VIDEO]!.inputs!['num_images.strength_2']).toBeUndefined()
  })

  it('routes video combine through RTX when enabled', async () => {
    const wf = await buildLtxWorkflow({
      model: 'ltx',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
    })

    expect(wf[LTX.RTX_SUPER_RES]!.inputs).toMatchObject({
      resize_type: 'fake-rtx-resize-type',
      'resize_type.scale': 1.6,
      quality: 'fake-rtx-quality',
    })
    expect(wf[LTX.VIDEO_COMBINE]!.inputs!.images).toEqual([LTX.RTX_SUPER_RES, 0])
  })

  it('removes RTX node and routes video combine directly when RTX disabled', async () => {
    await updateSettings({ 'ltx.rtx_enabled': 'false' })

    const wf = await buildLtxWorkflow({
      model: 'ltx',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
    })

    expect(wf[LTX.RTX_SUPER_RES]).toBeUndefined()
    expect(wf[LTX.VIDEO_COMBINE]!.inputs!.images).toEqual([LTX.VRAM_POST_VAE_DECODE, 0])
  })

  it('injects output settings', async () => {
    const wf = await buildLtxWorkflow({
      model: 'ltx',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
    })

    expect(wf[LTX.VIDEO_COMBINE]!.inputs).toMatchObject({
      frame_rate: 18,
      crf: 29,
      format: 'fake-video-format',
      pix_fmt: 'fake-pix-fmt',
      filename_prefix: 'LTX/fake-start',
    })
  })
})
