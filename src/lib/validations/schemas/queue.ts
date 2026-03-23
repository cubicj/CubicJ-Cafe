import { z } from 'zod'

export const queueQuerySchema = z.object({
  action: z.enum(['list', 'stats', 'user']).default('list'),
})

export const queueActionSchema = z.object({
  action: z.literal('cancel'),
  requestId: z.string().min(1, 'requestId가 필요합니다'),
})

export type QueueQueryInput = z.infer<typeof queueQuerySchema>
export type QueueActionInput = z.infer<typeof queueActionSchema>
