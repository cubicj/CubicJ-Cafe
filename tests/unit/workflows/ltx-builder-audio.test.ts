import { buildLtxWorkflow as rawBuilder } from '@/lib/comfyui/workflows/ltx/builder'
import { assertNoPlaceholders } from '../../helpers/workflow-assertions'
import { cleanTables } from '../../helpers/db'
import { LTX } from '@/lib/comfyui/workflows/ltx/nodes'
import type { ComfyUIWorkflow } from '@/types'

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
        model: [LTX.LORA_1, 0],
        positive: [LTX.VRAM_POST_CONDITIONING, 0],
        negative: [LTX.CONDITIONING, 1],
      },
    })
  })

  it('routes NAG and ADD_GUIDE through reference audio outputs when audio provided', async () => {
    const wf = await buildLtxWorkflow({
      model: 'ltx',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
      referenceAudio: 'fake-voice.flac',
    })

    expect(wf[LTX.NAG]!.inputs!.model).toEqual([LTX.REFERENCE_AUDIO, 0])
    expect(wf[LTX.ADD_GUIDE]!.inputs!.positive).toEqual([LTX.REFERENCE_AUDIO, 1])
    expect(wf[LTX.ADD_GUIDE]!.inputs!.negative).toEqual([LTX.REFERENCE_AUDIO, 2])
  })

  it('removes reference audio nodes and rewires ADD_GUIDE to conditioning outputs when audio absent', async () => {
    const wf = await buildLtxWorkflow({
      model: 'ltx',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
    })

    expect(wf[LTX.LOAD_AUDIO]).toBeUndefined()
    expect(wf[LTX.REFERENCE_AUDIO]).toBeUndefined()
    expect(wf[LTX.NAG]!.inputs!.model).toEqual([LTX.LORA_1, 0])
    expect(wf[LTX.ADD_GUIDE]!.inputs!.positive).toEqual([LTX.VRAM_POST_CONDITIONING, 0])
    expect(wf[LTX.ADD_GUIDE]!.inputs!.negative).toEqual([LTX.CONDITIONING, 1])
  })
})
