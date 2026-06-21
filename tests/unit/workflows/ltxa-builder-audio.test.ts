import { buildLtxaWorkflow as rawBuilder } from '@/lib/comfyui/workflows/ltxa/builder'
import { assertNoPlaceholders } from '../../helpers/workflow-assertions'
import { cleanTables } from '../../helpers/db'
import { LTXA } from '@/lib/comfyui/workflows/ltxa/nodes'
import type { ComfyUIWorkflow } from '@/types'
import { prisma } from '@/lib/database/prisma'

const DYNAMIC_LORA = {
  FIRST: '7000',
  SECOND: '7001',
} as const

const SOURCE_PATCH = {
  AUDIO_VAE: '611',
  ATTENTION_TUNER: '677',
} as const

let lastWorkflow: ComfyUIWorkflow | null = null
const buildLtxaWorkflow = async (...args: Parameters<typeof rawBuilder>) => {
  const wf = await rawBuilder(...args)
  lastWorkflow = wf
  return wf
}

beforeEach(async () => {
  await cleanTables()
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

afterEach(() => {
  if (lastWorkflow) assertNoPlaceholders(lastWorkflow)
  lastWorkflow = null
})

describe('buildLtxaWorkflow reference audio', () => {
  it('injects LoadAudio and reference audio identity settings when referenceAudio provided', async () => {
    const wf = await buildLtxaWorkflow({
      model: 'ltxa',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
      referenceAudio: 'fake-voice.flac',
    })

    expect(wf[LTXA.LOAD_AUDIO]).toMatchObject({
      inputs: { audio: 'fake-voice.flac' },
      class_type: 'LoadAudio',
    })
    expect(wf[LTXA.REFERENCE_AUDIO]).toMatchObject({
      class_type: 'LTXVReferenceAudio',
      inputs: {
        identity_guidance_scale: 2.7,
        start_percent: 0.12,
        end_percent: 0.86,
        model: [LTXA.ID_LORA, 0],
        positive: [LTXA.CONDITIONING, 0],
        negative: [LTXA.CONDITIONING, 1],
      },
    })
    expect(wf[LTXA.REFERENCE_AUDIO]!.inputs!.audio_vae).toEqual([SOURCE_PATCH.AUDIO_VAE, 0])
  })

  it('routes reference audio through Add Guide and ANCHOR when audio provided', async () => {
    const wf = await buildLtxaWorkflow({
      model: 'ltxa',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
      referenceAudio: 'fake-voice.flac',
    })

    expect(wf[LTXA.ADD_GUIDE]!.inputs!.positive).toEqual([LTXA.REFERENCE_AUDIO, 1])
    expect(wf[LTXA.ADD_GUIDE]!.inputs!.negative).toEqual([LTXA.REFERENCE_AUDIO, 2])
    expect(wf[LTXA.FIRST_PASS_DISTILLED_LORA]!.inputs!.model).toEqual([LTXA.REFERENCE_AUDIO, 0])
    expect(wf[LTXA.ANCHOR]!.inputs!.model).toEqual([LTXA.FIRST_PASS_DISTILLED_LORA, 0])
    expect(wf[LTXA.SECOND_PASS_REFERENCE_AUDIO]!.inputs).toMatchObject({
      model: [LTXA.ID_LORA, 0],
      positive: [LTXA.CROP_GUIDES, 0],
      negative: [LTXA.CROP_GUIDES, 1],
      reference_audio: [LTXA.LOAD_AUDIO, 0],
      audio_vae: [SOURCE_PATCH.AUDIO_VAE, 0],
    })
    expect(wf[LTXA.SECOND_PASS_DISTILLED_LORA]!.inputs!.model).toEqual([
      LTXA.SECOND_PASS_REFERENCE_AUDIO,
      0,
    ])
    expect(wf['708']!.inputs).toMatchObject({
      positive: [LTXA.SECOND_PASS_REFERENCE_AUDIO, 1],
      negative: [LTXA.SECOND_PASS_REFERENCE_AUDIO, 2],
      latent: ['539', 0],
    })
    expect(wf[LTXA.SECOND_PASS_CFG_GUIDER]!.inputs).toMatchObject({
      positive: ['708', 0],
      negative: ['708', 1],
    })
  })

  it('omits ID LoRA when reference audio is absent', async () => {
    const wf = await buildLtxaWorkflow({
      model: 'ltxa',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
    })

    expect(wf[LTXA.ID_LORA]).toBeUndefined()
    expect(wf[LTXA.LOAD_AUDIO]).toBeUndefined()
    expect(wf[LTXA.REFERENCE_AUDIO]).toBeUndefined()
    expect(wf[LTXA.SECOND_PASS_REFERENCE_AUDIO]).toBeUndefined()
    expect(wf['708']!.inputs).toMatchObject({
      positive: [LTXA.CROP_GUIDES, 0],
      negative: [LTXA.CROP_GUIDES, 1],
      latent: ['539', 0],
    })
    expect(wf[DYNAMIC_LORA.SECOND]!.inputs!.model).not.toEqual([LTXA.ID_LORA, 0])
    expect(wf[LTXA.NAG]!.inputs!.model).toEqual([SOURCE_PATCH.ATTENTION_TUNER, 0])
    expect(wf[DYNAMIC_LORA.FIRST]!.inputs!.model).toEqual([LTXA.NAG, 0])
    expect(wf[LTXA.ANCHOR]!.inputs!.model).toEqual([LTXA.FIRST_PASS_DISTILLED_LORA, 0])
  })

  it('appends ID LoRA after dynamic LoRA and before reference audio when enabled and reference audio exists', async () => {
    const wf = await buildLtxaWorkflow({
      model: 'ltxa',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
      referenceAudio: 'fake-voice.flac',
    })

    expect(wf[LTXA.ID_LORA]!.inputs).toMatchObject({
      lora_name: 'fake-ltxa-id-lora-v9n.safetensors',
      strength_model: 0.91,
      video: 0.51,
      video_to_audio: 0.52,
      audio: 0.53,
      audio_to_video: 0.54,
      other: 0.55,
      model: [DYNAMIC_LORA.SECOND, 0],
    })
    expect(wf[DYNAMIC_LORA.SECOND]!.inputs!.model).toEqual([DYNAMIC_LORA.FIRST, 0])
    expect(wf[LTXA.NAG]!.inputs!.model).toEqual([SOURCE_PATCH.ATTENTION_TUNER, 0])
    expect(wf[LTXA.ID_LORA]!.inputs!.model).toEqual([DYNAMIC_LORA.SECOND, 0])
    expect(wf[LTXA.REFERENCE_AUDIO]!.inputs!.model).toEqual([LTXA.ID_LORA, 0])
  })

  it('omits ID LoRA when disabled even with reference audio', async () => {
    await updateSettings({ 'ltxa.id_lora_enabled': 'false' })

    const wf = await buildLtxaWorkflow({
      model: 'ltxa',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
      referenceAudio: 'fake-voice.flac',
    })

    expect(wf[LTXA.ID_LORA]).toBeUndefined()
    expect(wf[LTXA.REFERENCE_AUDIO]!.inputs!.model).toEqual([DYNAMIC_LORA.SECOND, 0])
    expect(wf[LTXA.SECOND_PASS_REFERENCE_AUDIO]!.inputs!.model).toEqual([DYNAMIC_LORA.SECOND, 0])
  })

  it('removes reference audio nodes and routes ANCHOR through first-pass distilled LoRA when audio absent', async () => {
    const wf = await buildLtxaWorkflow({
      model: 'ltxa',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
    })

    expect(wf[LTXA.LOAD_AUDIO]).toBeUndefined()
    expect(wf[LTXA.REFERENCE_AUDIO]).toBeUndefined()
    expect(wf[LTXA.SECOND_PASS_REFERENCE_AUDIO]).toBeUndefined()
    expect(wf[LTXA.ID_LORA]).toBeUndefined()
    expect(wf[LTXA.ADD_GUIDE]!.inputs!.positive).toEqual([LTXA.CONDITIONING, 0])
    expect(wf[LTXA.ADD_GUIDE]!.inputs!.negative).toEqual([LTXA.CONDITIONING, 1])
    expect(wf[LTXA.FIRST_PASS_DISTILLED_LORA]!.inputs!.model).toEqual([DYNAMIC_LORA.SECOND, 0])
    expect(wf[LTXA.SECOND_PASS_DISTILLED_LORA]!.inputs!.model).toEqual([DYNAMIC_LORA.SECOND, 0])
    expect(wf[LTXA.ANCHOR]!.inputs!.model).toEqual([LTXA.FIRST_PASS_DISTILLED_LORA, 0])
  })
})
