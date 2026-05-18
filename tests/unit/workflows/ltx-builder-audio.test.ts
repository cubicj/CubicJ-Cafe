import { buildLtxWorkflow as rawBuilder } from '@/lib/comfyui/workflows/ltx/builder'
import { assertNoPlaceholders } from '../../helpers/workflow-assertions'
import { cleanTables } from '../../helpers/db'
import { LTX } from '@/lib/comfyui/workflows/ltx/nodes'
import type { ComfyUIWorkflow } from '@/types'
import { prisma } from '@/lib/database/prisma'

const DYNAMIC_LORA = {
  SECOND: '7001',
} as const

let lastWorkflow: ComfyUIWorkflow | null = null
const buildLtxWorkflow = async (...args: Parameters<typeof rawBuilder>) => {
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

describe('buildLtxWorkflow reference audio', () => {
  it('injects LoadAudio and reference audio identity settings when referenceAudio provided', async () => {
    const wf = await buildLtxWorkflow({
      model: 'ltx',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
      referenceAudio: 'fake-voice.flac',
    })

    expect(wf[LTX.LOAD_AUDIO]).toMatchObject({
      inputs: { audio: 'fake-voice.flac' },
      class_type: 'LoadAudio',
    })
    expect(wf[LTX.REFERENCE_AUDIO]).toMatchObject({
      class_type: 'LTXVReferenceAudio',
      inputs: {
        identity_guidance_scale: 2.7,
        start_percent: 0.12,
        end_percent: 0.86,
        model: [LTX.ID_LORA, 0],
        positive: [LTX.VRAM_POST_CONDITIONING, 0],
        negative: [LTX.CONDITIONING, 1],
      },
    })
  })

  it('routes reference audio through Add Guide and ANCHOR when audio provided', async () => {
    const wf = await buildLtxWorkflow({
      model: 'ltx',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
      referenceAudio: 'fake-voice.flac',
    })

    expect(wf[LTX.ADD_GUIDE]!.inputs!.positive).toEqual([LTX.REFERENCE_AUDIO, 1])
    expect(wf[LTX.ADD_GUIDE]!.inputs!.negative).toEqual([LTX.REFERENCE_AUDIO, 2])
    expect(wf[LTX.ANCHOR]!.inputs!.model).toEqual([LTX.REFERENCE_AUDIO, 0])
  })

  it('omits ID LoRA when reference audio is absent', async () => {
    const wf = await buildLtxWorkflow({
      model: 'ltx',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
    })

    expect(wf[LTX.ID_LORA]).toBeUndefined()
    expect(wf[LTX.NAG]!.inputs!.model).toEqual([DYNAMIC_LORA.SECOND, 0])
    expect(wf[LTX.ANCHOR]!.inputs!.model).toEqual([LTX.NAG, 0])
  })

  it('appends ID LoRA after NAG and before reference audio when enabled and reference audio exists', async () => {
    const wf = await buildLtxWorkflow({
      model: 'ltx',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
      referenceAudio: 'fake-voice.flac',
    })

    expect(wf[LTX.ID_LORA]!.inputs).toMatchObject({
      lora_name: 'fake-ltx-id-lora-v9n.safetensors',
      strength_model: 0.91,
      video: 0.51,
      video_to_audio: 0.52,
      audio: 0.53,
      audio_to_video: 0.54,
      other: 0.55,
      model: [LTX.NAG, 0],
    })
    expect(wf[LTX.REFERENCE_AUDIO]!.inputs!.model).toEqual([LTX.ID_LORA, 0])
  })

  it('omits ID LoRA when disabled even with reference audio', async () => {
    await updateSettings({ 'ltx.id_lora_enabled': 'false' })

    const wf = await buildLtxWorkflow({
      model: 'ltx',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
      referenceAudio: 'fake-voice.flac',
    })

    expect(wf[LTX.ID_LORA]).toBeUndefined()
    expect(wf[LTX.REFERENCE_AUDIO]!.inputs!.model).toEqual([LTX.NAG, 0])
  })

  it('removes reference audio nodes and routes ANCHOR through NAG when audio absent', async () => {
    const wf = await buildLtxWorkflow({
      model: 'ltx',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
    })

    expect(wf[LTX.LOAD_AUDIO]).toBeUndefined()
    expect(wf[LTX.REFERENCE_AUDIO]).toBeUndefined()
    expect(wf[LTX.ID_LORA]).toBeUndefined()
    expect(wf[LTX.ADD_GUIDE]!.inputs!.positive).toEqual([LTX.VRAM_POST_CONDITIONING, 0])
    expect(wf[LTX.ADD_GUIDE]!.inputs!.negative).toEqual([LTX.CONDITIONING, 1])
    expect(wf[LTX.ANCHOR]!.inputs!.model).toEqual([LTX.NAG, 0])
  })
})
