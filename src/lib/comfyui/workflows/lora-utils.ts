import type { LoRAPresetItem } from '@/types'
import { createLogger } from '@/lib/logger'

const log = createLogger('comfyui')

export function deduplicateByFilename(items: LoRAPresetItem[], label?: string): LoRAPresetItem[] {
  const loraMap = new Map<string, LoRAPresetItem>()
  const sorted = [...items].sort((a, b) => a.order - b.order)

  for (const item of sorted) {
    loraMap.set(item.loraFilename, item)
  }

  const result = Array.from(loraMap.values())

  if (items.length > result.length) {
    log.info('LoRA duplicates removed', {
      label,
      original: items.length,
      afterDedup: result.length,
      removed: items.length - result.length,
    })
  }

  return result
}
