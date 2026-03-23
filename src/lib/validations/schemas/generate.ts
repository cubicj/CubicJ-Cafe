import { z } from 'zod'
import { loraItemSchema } from './lora-preset'

const imageSchema = z.instanceof(File)
  .refine((f) => f.size > 0, '이미지를 업로드해주세요')
  .refine((f) => f.size <= 10 * 1024 * 1024, '이미지 파일이 너무 큽니다 (최대 10MB)')
  .refine((f) => f.type.startsWith('image/'), '이미지 형식이어야 합니다')

const optionalImageSchema = z.instanceof(File)
  .refine((f) => f.size <= 10 * 1024 * 1024, '이미지 파일이 너무 큽니다 (최대 10MB)')
  .refine((f) => f.type.startsWith('image/'), '이미지 형식이어야 합니다')
  .optional()

const generateLoraItemSchema = loraItemSchema.extend({
  loraName: z.string().default(''),
  order: z.coerce.number().int().min(0).default(0),
})

const generateLoraPresetDataSchema = z.object({
  presetId: z.string().min(1),
  presetName: z.string(),
  loraItems: z.array(generateLoraItemSchema),
})

export const generateSchema = z.object({
  prompt: z.string().min(1, '프롬프트를 입력해주세요').max(5000, '프롬프트가 너무 깁니다 (최대 5000자)').transform((s) => s.trim()),
  image: imageSchema,
  endImage: optionalImageSchema,
  lora: z.string().optional(),
  loraStrength: z.coerce.number().min(0).max(2).default(0.8),
  loraPreset: z.string().transform((s) => JSON.parse(s)).pipe(generateLoraPresetDataSchema).optional(),
  isNSFW: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  duration: z.coerce.number().int().min(4).max(7).default(5),
})

export const generateStatusQuerySchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
})

export type GenerateInput = z.infer<typeof generateSchema>
