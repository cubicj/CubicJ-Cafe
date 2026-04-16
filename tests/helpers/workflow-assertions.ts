import type { ComfyUIWorkflow } from '@/types'

/**
 * Asserts the built workflow has no unresolved PLACEHOLDER tokens.
 * Builders must replace every PLACEHOLDER from the template; missing one
 * means the literal string is sent to ComfyUI, causing silent failure.
 */
export function assertNoPlaceholders(workflow: ComfyUIWorkflow): void {
  expect(JSON.stringify(workflow)).not.toContain('PLACEHOLDER')
}
