import type { ComfyUIWorkflow } from '@/types'
import { createLogger } from '@/lib/logger'

const log = createLogger('comfyui')

export function generateSeed(): number {
  return Math.floor(Math.random() * 0xFFFFFFFFFFFF)
}

export function extractBaseImageName(imagePath: string): string {
  return imagePath.replace(/\.(png|jpg|jpeg|webp)$/i, '')
}

export function setNode(workflow: ComfyUIWorkflow, id: string, values: Record<string, unknown>) {
  const node = workflow[id]
  if (!node) {
    log.warn('setNode: node not found in workflow', { nodeId: id, keys: Object.keys(values) })
    return
  }
  if (!node.inputs) {
    log.warn('setNode: node has no inputs', { nodeId: id, classType: node.class_type })
    return
  }
  Object.assign(node.inputs, values)
}

export function dumpWorkflow(model: string, workflow: ComfyUIWorkflow) {
  log.info(`${model.toUpperCase()} workflow dump`, { workflow: JSON.stringify(workflow) })
}
