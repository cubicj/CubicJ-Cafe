import { buildLtxrWorkflow as rawBuilder } from '@/lib/comfyui/workflows/ltxr/builder'
import { LTXR } from '@/lib/comfyui/workflows/ltxr/nodes'
import { prisma } from '@/lib/database/prisma'
import { LTXA_SEED } from '../helpers/ltxa-seed'
import { assertNoPlaceholders } from '../helpers/workflow-assertions'
import { cleanTables } from '../helpers/db'
import type { ComfyUIWorkflow } from '@/types'

const DYNAMIC_LORA = {
  FIRST: '7000',
  SECOND: '7001',
} as const

let lastWorkflow: ComfyUIWorkflow | null = null
const buildLtxrWorkflow = async (...args: Parameters<typeof rawBuilder>) => {
  const wf = await rawBuilder(...args)
  lastWorkflow = wf
  return wf
}

beforeEach(async () => {
  await cleanTables()
  await seedLtxr()
})

afterEach(() => {
  if (lastWorkflow) assertNoPlaceholders(lastWorkflow)
  lastWorkflow = null
})

describe('buildLtxrWorkflow', () => {
  it('builds base workflow with LTXR settings, output prefix, and no watermark when disabled', async () => {
    const wf = await buildLtxrWorkflow({
      model: 'ltxr',
      prompt: 'fake requested ltxr scene',
      inputImage: 'fake-ltxr-start.png',
      videoDuration: 8,
    })

    expect(wf[LTXR.POSITIVE_PROMPT]!.inputs!.text).toBe('fake requested ltxr scene')
    expect(wf[LTXR.NEGATIVE_PROMPT]!.inputs!.text).toBe('fake negative prompt z8r')
    expect(wf[LTXR.VIDEO_CONDITIONING_PROMPT]!.inputs!.text).toBe('fake video conditioning prompt h2k')
    expect(wf[LTXR.AUDIO_CONDITIONING_PROMPT]!.inputs!.text).toBe('fake audio conditioning prompt m9t')
    expect(wf[LTXR.LOAD_IMAGE_START]!.inputs!.image).toBe('fake-ltxr-start.png')
    expect(wf[LTXR.CHECKPOINT]!.inputs!.ckpt_name).toBe('fake-ltxr-checkpoint-q7m.safetensors')
    expect(wf[LTXR.TEXT_ENCODER]!.inputs).toMatchObject({
      text_encoder: 'fake-ltxr-text-encoder-p4v.safetensors',
      ckpt_name: 'fake-ltxr-checkpoint-q7m.safetensors',
    })
    expect(wf[LTXR.TEXT_ENCODER]!.class_type).toBe('LTXAVTextEncoderLoader')
    expect(wf[LTXR.DURATION]!.inputs!.value).toBe(8)
    expect(wf[LTXR.VIDEO_COMBINE]!.inputs).toMatchObject({
      filename_prefix: 'LTXR/fake-ltxr-start',
      crf: 29,
      format: 'fake-video-format',
      pix_fmt: 'fake-pix-fmt',
    })
    expect(wf[LTXR.WATERMARK]).toBeUndefined()
    expect(wf[LTXR.VIDEO_COMBINE]!.inputs!.images).toEqual([LTXR.RTX_SUPER_RES, 0])
  })

  it('always uses the SFW LoRA chain even when generation is NSFW', async () => {
    const wf = await buildLtxrWorkflow({
      model: 'ltxr',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
      isNSFW: true,
    })

    expect(wf[DYNAMIC_LORA.FIRST]).toMatchObject({
      class_type: 'LTX2LoraLoaderAdvanced',
      inputs: {
        lora_name: 'fake-ltxr-sfw-chain-a.safetensors',
        strength_model: 0.51,
        model: [LTXR.CHECKPOINT, 0],
      },
    })
    expect(wf[DYNAMIC_LORA.SECOND]).toMatchObject({
      class_type: 'LTX2LoraLoaderAdvanced',
      inputs: {
        lora_name: 'fake-ltxr-sfw-chain-c.safetensors',
        strength_model: 0.73,
        model: [DYNAMIC_LORA.FIRST, 0],
      },
    })
    expect(JSON.stringify(wf)).not.toContain('fake-ltxr-nsfw')
    expect(wf[LTXR.NAG]!.inputs!.model).toEqual([DYNAMIC_LORA.SECOND, 0])
  })

  it('removes watermark and wires video combine directly to VAE when RTX is disabled', async () => {
    await updateSettings({
      'ltxr.rtx_enabled': 'false',
      'ltxr.watermark_enabled': 'false',
    })

    const wf = await buildLtxrWorkflow({
      model: 'ltxr',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
    })

    expect(wf[LTXR.RTX_SUPER_RES]).toBeUndefined()
    expect(wf[LTXR.WATERMARK]).toBeUndefined()
    expect(wf[LTXR.VIDEO_COMBINE]!.inputs!.images).toEqual([LTXR.VAE_DECODE, 0])
  })

  it('sets watermark inputs and wires video combine through watermark when enabled', async () => {
    await updateSettings({
      'ltxr.watermark_enabled': 'true',
      'ltxr.watermark_image': 'fake-watermark-asset-id',
      'ltxr.watermark_position': 'bottom-right',
      'ltxr.watermark_scale': '42',
      'ltxr.watermark_transparency': '17',
    })

    const wf = await buildLtxrWorkflow({
      model: 'ltxr',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
      watermarkImage: 'fake-watermark.png',
    })

    expect(wf[LTXR.WATERMARK]).toMatchObject({
      class_type: 'BatchWatermarkSingle',
      inputs: {
        watermark: 'fake-watermark.png',
        position: 'bottom-right',
        scale: 42,
        transparency: 17,
        image: [LTXR.RTX_SUPER_RES, 0],
      },
    })
    expect(wf[LTXR.VIDEO_COMBINE]!.inputs!.images).toEqual([LTXR.WATERMARK, 0])
  })

  it('dispatches LTXR from workflow router', async () => {
    const { buildWorkflow } = await import('@/lib/comfyui/workflow-router')

    const wf = await buildWorkflow({
      model: 'ltxr',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
    })

    expect(wf[LTXR.VIDEO_COMBINE]!.inputs!.filename_prefix).toBe('LTXR/fake-start')
  })
})

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

async function seedLtxr() {
  const rows = LTXA_SEED
    .filter((row) => row.key !== 'ltxa.nsfw_lora_chain')
    .map((row) => ({
      key: row.key.replace('ltxa.', 'ltxr.'),
      value: row.value.replaceAll('fake-ltxa', 'fake-ltxr'),
      type: row.type,
      category: 'ltxr',
    }))

  await prisma.systemSetting.createMany({
    data: [
      ...rows,
      { key: 'ltxr.watermark_enabled', value: 'false', type: 'boolean', category: 'ltxr' },
      { key: 'ltxr.watermark_image', value: '', type: 'string', category: 'ltxr' },
      { key: 'ltxr.watermark_position', value: 'center', type: 'string', category: 'ltxr' },
      { key: 'ltxr.watermark_scale', value: '80', type: 'number', category: 'ltxr' },
      { key: 'ltxr.watermark_transparency', value: '50', type: 'number', category: 'ltxr' },
    ],
  })
}
