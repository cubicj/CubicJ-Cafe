import { z } from 'zod'
import { WAN_KEYS, LTX_SHARED_KEYS, LTX_1PASS_KEYS, LTX_2PASS_KEYS } from '@/lib/database/system-settings'

export const ALLOWED_SETTING_KEYS = new Set([
  ...Object.values(WAN_KEYS),
  ...Object.values(LTX_SHARED_KEYS),
  ...Object.values(LTX_1PASS_KEYS),
  ...Object.values(LTX_2PASS_KEYS),
  'comfyui_enabled',
])

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(25),
})

const settingItemSchema = z.object({
  key: z.string().refine((k) => ALLOWED_SETTING_KEYS.has(k), 'Unknown setting key'),
  value: z.string(),
  type: z.string().default('string'),
  category: z.string().default('general'),
})

export const settingsBatchSchema = z.object({
  settings: z.array(settingItemSchema).min(1),
})

export const settingSingleSchema = settingItemSchema

export const settingsPutSchema = z.union([settingsBatchSchema, settingSingleSchema])

export const cleanupSchema = z.object({
  maxAgeHours: z.number().int().min(1).default(24),
})

export const comfyuiToggleSchema = z.object({
  enabled: z.boolean(),
})

export const queuePauseSchema = z.object({
  position: z.number().int().min(1),
})

export const logsQuerySchema = paginationSchema.extend({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  level: z.enum(['debug', 'info', 'warn', 'error']).optional(),
  category: z.string().optional(),
  search: z.string().optional(),
})

export const logIngestSchema = z.object({
  entries: z.array(z.unknown()).max(100),
})

export const loraBundleCreateSchema = z
  .object({
    displayName: z.string().min(1).transform((s) => s.trim()),
    highLoRAFilename: z.string().optional(),
    lowLoRAFilename: z.string().optional(),
    order: z.coerce.number().int().optional(),
  })
  .refine(
    (d) => d.highLoRAFilename?.trim() || d.lowLoRAFilename?.trim(),
    'At least one LoRA filename required'
  )

export const loraBundleUpdateSchema = z.object({
  displayName: z
    .string()
    .min(1)
    .transform((s) => s.trim())
    .optional(),
  highLoRAFilename: z.string().optional(),
  lowLoRAFilename: z.string().optional(),
  order: z.coerce.number().int().optional(),
})

export const dbQuerySchema = paginationSchema.extend({
  table: z.enum(['users', 'queue_requests', 'lora_presets']).optional(),
  orderBy: z.string().optional(),
  orderDirection: z.enum(['asc', 'desc']).default('desc'),
})

export type SettingItem = z.infer<typeof settingItemSchema>
export type CleanupInput = z.infer<typeof cleanupSchema>
export type ComfyuiToggleInput = z.infer<typeof comfyuiToggleSchema>
export type QueuePauseInput = z.infer<typeof queuePauseSchema>
export type LogsQueryInput = z.infer<typeof logsQuerySchema>
export type LoraBundleCreateInput = z.infer<typeof loraBundleCreateSchema>
export type LoraBundleUpdateInput = z.infer<typeof loraBundleUpdateSchema>
export type DbQueryInput = z.infer<typeof dbQuerySchema>
