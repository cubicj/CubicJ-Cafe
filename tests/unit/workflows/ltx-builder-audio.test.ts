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
  it('injects LoadAudio, LTXVReferenceAudio, LTX2AudioLatentNormalizingSampling when referenceAudio provided', async () => {
    const wf = await buildLtxWorkflow({
      model: 'ltx',
      prompt: 'p',
      inputImage: 'img.png',
      videoDuration: 5,
      referenceAudio: 'voice.flac',
    })
    expect(wf[LTX.LOAD_AUDIO]).toMatchObject({
      inputs: { audio: 'voice.flac' },
      class_type: 'LoadAudio',
    })
    expect(wf[LTX.REFERENCE_AUDIO].class_type).toBe('LTXVReferenceAudio')
    expect(wf[LTX.AUDIO_NORM].class_type).toBe('LTX2AudioLatentNormalizingSampling')
  })

  it('flips LoRA slot 2 on with ID LoRA settings when audio provided', async () => {
    const wf = await buildLtxWorkflow({
      model: 'ltx',
      prompt: 'p',
      inputImage: 'img.png',
      videoDuration: 5,
      referenceAudio: 'v.flac',
    })
    const slot = wf[LTX.POWER_LORA]!.inputs!['lora_2'] as { on: boolean; lora: string; strength: number }
    expect(slot.on).toBe(true)
    expect(slot.lora).toBe('test-id-lora.safetensors')
    expect(slot.strength).toBe(0.68)
  })

  it('rewires CFGGuider to read from REFERENCE_AUDIO outputs', async () => {
    const wf = await buildLtxWorkflow({
      model: 'ltx',
      prompt: 'p',
      inputImage: 'img.png',
      videoDuration: 5,
      referenceAudio: 'v.flac',
    })
    expect(wf[LTX.CFG_GUIDER]!.inputs!.positive).toEqual([LTX.REFERENCE_AUDIO, 1])
    expect(wf[LTX.CFG_GUIDER]!.inputs!.negative).toEqual([LTX.REFERENCE_AUDIO, 2])
  })

  it('writes audio_normalization_factors from settings into AudioNorm', async () => {
    const wf = await buildLtxWorkflow({
      model: 'ltx',
      prompt: 'p',
      inputImage: 'img.png',
      videoDuration: 5,
      referenceAudio: 'v.flac',
    })
    expect(wf[LTX.AUDIO_NORM]!.inputs!.audio_normalization_factors).toBe('1,1,0.7,1,1,0.7,1,1,1,1')
  })
})
