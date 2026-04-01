import type { ComfyUIWorkflow } from '@/types'
import type { LoRAPresetData } from '@/types/lora'
import type { ComfyUIServer } from '../../server-manager'
import { createLogger } from '@/lib/logger'
import { deduplicateByFilename } from '../lora-utils'

const log = createLogger('comfyui')

const LTX_DYNAMIC_NODE_START = 500
const TORCH_SETTINGS_NODE = '354'
const NAG_NODE = '72'

export async function applyLtxLoraChain(
  workflow: ComfyUIWorkflow,
  loraPreset: LoRAPresetData,
  server?: ComfyUIServer,
): Promise<void> {
  const loraItems = loraPreset.loraItems
  if (!loraItems || loraItems.length === 0) return

  const deduplicated = deduplicateByFilename(loraItems)
  let previousNodeId = TORCH_SETTINGS_NODE

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

  const nagNode = workflow[NAG_NODE]
  if (nagNode?.inputs) {
    nagNode.inputs.model = [previousNodeId, 0]
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
