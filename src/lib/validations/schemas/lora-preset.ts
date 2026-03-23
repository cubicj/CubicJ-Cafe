import { z } from 'zod'

export const loraItemSchema = z.object({
  loraFilename: z.string().min(1),
  loraName: z.string().nullish(),
  strength: z.coerce.number().min(0).max(2).default(0.8),
  group: z.enum(['HIGH', 'LOW']).default('HIGH'),
  order: z.coerce.number().int().min(0).nullish(),
  bundleId: z.string().nullish(),
})

export const createLoraPresetSchema = z.object({
  name: z.string().min(1, '프리셋 이름은 필수입니다').max(100).transform((s) => s.trim()),
  isPublic: z.boolean().default(false),
  loraItems: z.array(loraItemSchema).min(1, 'LoRA 아이템이 필요합니다').max(20),
  model: z.enum(['wan', 'ltx']).default('wan'),
})

export const updateLoraPresetSchema = createLoraPresetSchema.partial()

export const reorderPresetsSchema = z.object({
  presetIds: z.array(z.string().min(1)).min(1, '프리셋 ID 배열이 필요합니다').max(100),
})

export const loraPresetQuerySchema = z.object({
  model: z.enum(['wan', 'ltx']).default('wan'),
})

export const loraPresetDataSchema = z.object({
  presetId: z.string().min(1),
  presetName: z.string(),
  loraItems: z.array(loraItemSchema),
})

export type CreateLoraPresetInput = z.infer<typeof createLoraPresetSchema>
export type UpdateLoraPresetInput = z.infer<typeof updateLoraPresetSchema>
export type LoraItemInput = z.infer<typeof loraItemSchema>
