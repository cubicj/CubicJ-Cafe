import type { ComfyUIWorkflow } from '@/types'

/**
 * Asserts the built workflow has no unresolved PLACEHOLDER tokens.
 * Builders must replace every PLACEHOLDER from the template; missing one
 * means the literal string is sent to ComfyUI, causing silent failure.
 *
 * Note: this is a substring check on the serialized JSON. If any field
 * legitimately needs to contain the literal substring "PLACEHOLDER" (e.g.,
 * a model filename), this assertion will trip. Today no such case exists.
 */
export function assertNoPlaceholders(workflow: ComfyUIWorkflow): void {
  expect(JSON.stringify(workflow)).not.toContain('PLACEHOLDER')
}
