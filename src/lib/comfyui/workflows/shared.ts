import type { ComfyUIWorkflow } from '@/types'

export function generateSeed(): number {
  return Math.floor(Math.random() * 0xFFFFFFFFFFFF)
}

export function extractBaseImageName(imagePath: string): string {
  return imagePath.replace(/\.(png|jpg|jpeg|webp)$/i, '')
}

export function setNode(workflow: ComfyUIWorkflow, id: string, values: Record<string, unknown>) {
  const inputs = workflow[id]?.inputs
  if (inputs) {
    Object.assign(inputs, values)
  }
}
