import type { ComfyUIWorkflow } from '@/types'
import type { LoRAPresetItem, LoRAPresetData } from '@/types/lora'
import type { ComfyUIServer } from '../../server-manager'
import { createLogger } from '@/lib/logger'

const log = createLogger('comfyui')

const LTX_DYNAMIC_NODE_START = 400
const DISTILLED_LORA_NODE = '81'
const AUDIO_NORM_NODE = '268'

function deduplicateByFilename(items: LoRAPresetItem[]): LoRAPresetItem[] {
  const loraMap = new Map<string, LoRAPresetItem>()
  const sorted = [...items].sort((a, b) => a.order - b.order)

  for (const item of sorted) {
    loraMap.set(item.loraFilename, item)
  }

  const result = Array.from(loraMap.values())

  if (items.length > result.length) {
    log.info('LTX LoRA duplicates removed', {
      original: items.length,
      afterDedup: result.length,
      removed: items.length - result.length,
    })
  }

  return result
}

export async function applyLtxLoraChain(
  workflow: ComfyUIWorkflow,
  loraPreset: LoRAPresetData,
  server?: ComfyUIServer,
): Promise<void> {
  const loraItems = loraPreset.loraItems
  if (!loraItems || loraItems.length === 0) return

  const deduplicated = deduplicateByFilename(loraItems)
  let previousNodeId = DISTILLED_LORA_NODE

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

  log.info('LTX LoRA chain applied', {
    presetName: loraPreset.presetName,
    chainLength: deduplicated.length,
    loras: deduplicated.map(l => ({
      filename: l.loraFilename,
      strength: l.strength,
    })),
  })
}
