import { buildLtxrWorkflow as rawBuilder } from '@/lib/comfyui/workflows/ltxr/builder'
import { LTXR } from '@/lib/comfyui/workflows/ltxr/nodes'
import { prisma } from '@/lib/database/prisma'
import { LTXA_SEED } from '../../helpers/ltxa-seed'
import { assertNoPlaceholders } from '../../helpers/workflow-assertions'
import { cleanTables } from '../../helpers/db'
import type { ComfyUIWorkflow } from '@/types'

const DYNAMIC_LORA = {
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

describe('buildLtxrWorkflow reference audio', () => {
  it('injects LoadAudio and reference audio identity settings when referenceAudio provided', async () => {
    const wf = await buildLtxrWorkflow({
      model: 'ltxr',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
      referenceAudio: 'fake-voice.flac',
    })

    expect(wf[LTXR.LOAD_AUDIO]).toMatchObject({
      inputs: { audio: 'fake-voice.flac' },
      class_type: 'LoadAudio',
    })
    expect(wf[LTXR.REFERENCE_AUDIO]).toMatchObject({
      class_type: 'LTXVReferenceAudio',
      inputs: {
        identity_guidance_scale: 2.7,
        start_percent: 0.12,
        end_percent: 0.86,
        model: [LTXR.ID_LORA, 0],
        positive: [LTXR.VRAM_POST_CONDITIONING, 0],
        negative: [LTXR.CONDITIONING, 1],
      },
    })
  })

  it('routes reference audio through Add Guide and ANCHOR when audio provided', async () => {
    const wf = await buildLtxrWorkflow({
      model: 'ltxr',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
      referenceAudio: 'fake-voice.flac',
    })

    expect(wf[LTXR.ADD_GUIDE]!.inputs!.positive).toEqual([LTXR.REFERENCE_AUDIO, 1])
    expect(wf[LTXR.ADD_GUIDE]!.inputs!.negative).toEqual([LTXR.REFERENCE_AUDIO, 2])
    expect(wf[LTXR.ANCHOR]!.inputs!.model).toEqual([LTXR.REFERENCE_AUDIO, 0])
  })

  it('omits ID LoRA when reference audio is absent', async () => {
    const wf = await buildLtxrWorkflow({
      model: 'ltxr',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
    })

    expect(wf[LTXR.ID_LORA]).toBeUndefined()
    expect(wf[LTXR.NAG]!.inputs!.model).toEqual([DYNAMIC_LORA.SECOND, 0])
    expect(wf[LTXR.ANCHOR]!.inputs!.model).toEqual([LTXR.NAG, 0])
  })

  it('appends ID LoRA after NAG and before reference audio when enabled and reference audio exists', async () => {
    const wf = await buildLtxrWorkflow({
      model: 'ltxr',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
      referenceAudio: 'fake-voice.flac',
    })

    expect(wf[LTXR.ID_LORA]!.inputs).toMatchObject({
      lora_name: 'fake-ltxr-id-lora-v9n.safetensors',
      strength_model: 0.91,
      video: 0.51,
      video_to_audio: 0.52,
      audio: 0.53,
      audio_to_video: 0.54,
      other: 0.55,
      model: [LTXR.NAG, 0],
    })
    expect(wf[LTXR.REFERENCE_AUDIO]!.inputs!.model).toEqual([LTXR.ID_LORA, 0])
  })

  it('removes reference audio nodes and routes ANCHOR through NAG when audio absent', async () => {
    const wf = await buildLtxrWorkflow({
      model: 'ltxr',
      prompt: 'p',
      inputImage: 'fake-start.png',
      videoDuration: 4,
    })

    expect(wf[LTXR.LOAD_AUDIO]).toBeUndefined()
    expect(wf[LTXR.REFERENCE_AUDIO]).toBeUndefined()
    expect(wf[LTXR.ID_LORA]).toBeUndefined()
    expect(wf[LTXR.ADD_GUIDE]!.inputs!.positive).toEqual([LTXR.VRAM_POST_CONDITIONING, 0])
    expect(wf[LTXR.ADD_GUIDE]!.inputs!.negative).toEqual([LTXR.CONDITIONING, 1])
    expect(wf[LTXR.ANCHOR]!.inputs!.model).toEqual([LTXR.NAG, 0])
  })
})

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
      { key: 'ltxr.second_pass_anchor_strength', value: '0.24', type: 'number', category: 'ltxr' },
      { key: 'ltxr.second_pass_anchor_cache_at_step', value: '7', type: 'number', category: 'ltxr' },
      { key: 'ltxr.second_pass_anchor_similarity_threshold', value: '0.58', type: 'number', category: 'ltxr' },
      { key: 'ltxr.second_pass_anchor_decay_with_distance', value: '0.14', type: 'number', category: 'ltxr' },
      { key: 'ltxr.second_pass_anchor_energy_threshold', value: '0.22', type: 'number', category: 'ltxr' },
      { key: 'ltxr.second_pass_anchor_bypass', value: 'false', type: 'boolean', category: 'ltxr' },
      { key: 'ltxr.second_pass_anchor_debug', value: 'true', type: 'boolean', category: 'ltxr' },
      { key: 'ltxr.second_pass_anchor_advanced_mode', value: 'true', type: 'boolean', category: 'ltxr' },
      { key: 'ltxr.second_pass_anchor_cache_mode', value: 'fake-second-pass-anchor-cache-mode', type: 'string', category: 'ltxr' },
      { key: 'ltxr.second_pass_anchor_forwards_per_step', value: '3', type: 'number', category: 'ltxr' },
      { key: 'ltxr.second_pass_anchor_cache_warmup', value: '9', type: 'number', category: 'ltxr' },
      { key: 'ltxr.second_pass_anchor_frame', value: '2', type: 'number', category: 'ltxr' },
      { key: 'ltxr.second_pass_anchor_depth_curve', value: 'fake-second-pass-anchor-depth-curve', type: 'string', category: 'ltxr' },
      { key: 'ltxr.second_pass_anchor_block_index_filter', value: 'fake-second-pass-block-filter-1,3,5', type: 'string', category: 'ltxr' },
      { key: 'ltxr.watermark_enabled', value: 'false', type: 'boolean', category: 'ltxr' },
      { key: 'ltxr.watermark_image', value: '', type: 'string', category: 'ltxr' },
      { key: 'ltxr.watermark_position', value: 'center', type: 'string', category: 'ltxr' },
      { key: 'ltxr.watermark_scale', value: '80', type: 'number', category: 'ltxr' },
      { key: 'ltxr.watermark_transparency', value: '50', type: 'number', category: 'ltxr' },
    ],
  })
}
