import type { ComfyUIWorkflow } from '@/types'
import type { LoRAPresetData } from '@/types/lora'
import type { ComfyUIServer } from '../../server-manager'
import { createLogger } from '@/lib/logger'
import { deduplicateByFilename } from '../lora-utils'

const log = createLogger('comfyui')

const LTX_DYNAMIC_NODE_START = 400
const SAGE_ATTENTION_NODE = '298'
const LORA_PLACEHOLDER_NODE = '296'
const AUDIO_NORM_NODE = '268'
const AUDIO_NORM_2ND_PASS_NODE = '306'

export async function applyLtxLoraChain(
  workflow: ComfyUIWorkflow,
  loraPreset: LoRAPresetData,
  server?: ComfyUIServer,
): Promise<void> {
  const loraItems = loraPreset.loraItems
  if (!loraItems || loraItems.length === 0) return

  const deduplicated = deduplicateByFilename(loraItems)
  delete workflow[LORA_PLACEHOLDER_NODE]
  let previousNodeId = SAGE_ATTENTION_NODE

  for (let i = 0; i < deduplicated.length; i++) {
    const newNodeId = String(LTX_DYNAMIC_NODE_START + i)

    let loraFilename = deduplicated[i].loraFilename
    if (server?.type === 'RUNPOD') {
      loraFilename = loraFilename.replace(/\\/g, '/')
    }

    workflow[newNodeId] = {
      inputs: {
        lora_name: loraFilename,
        strength_model: deduplicated[i].strength,
        model: [previousNodeId, 0],
      },
      class_type: 'LoraLoaderModelOnly',
      _meta: { title: 'Load LoRA' },
    }
    previousNodeId = newNodeId
  }

  const audioNormNode = workflow[AUDIO_NORM_NODE]
  if (audioNormNode?.inputs) {
    audioNormNode.inputs.model = [previousNodeId, 0]
  }
  const audioNorm2ndNode = workflow[AUDIO_NORM_2ND_PASS_NODE]
  if (audioNorm2ndNode?.inputs) {
    audioNorm2ndNode.inputs.model = [previousNodeId, 0]
  }

  log.info('LTX LoRA chain applied', {
    presetName: loraPreset.presetName,
    chainLength: deduplicated.length,
    loras: deduplicated.map(l => ({
      filename: l.loraFilename,
      strength: l.strength,
    })),
  })
}
