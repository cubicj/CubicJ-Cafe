import { z } from 'zod'
import { loraItemSchema } from './lora-preset'

const imageSchema = z.instanceof(File)
  .refine((f) => f.size > 0, '이미지를 업로드해주세요')
  .refine((f) => f.size <= 10 * 1024 * 1024, '이미지 파일이 너무 큽니다 (최대 10MB)')
  .refine((f) => f.type.startsWith('image/'), '이미지 형식이어야 합니다')

const optionalImageSchema = z.instanceof(File)
  .transform((f) => (f.size === 0 ? undefined : f))
  .pipe(
    z.instanceof(File)
      .refine((f) => f.size <= 10 * 1024 * 1024, '이미지 파일이 너무 큽니다 (최대 10MB)')
      .refine((f) => f.type.startsWith('image/'), '이미지 형식이어야 합니다')
      .optional()
  )
  .optional()

const i2vLoraItemSchema = loraItemSchema.extend({
  loraName: z.string().default(''),
  order: z.coerce.number().int().min(0).default(0),
})

const i2vLoraPresetDataSchema = z.object({
  presetId: z.string().min(1),
  presetName: z.string(),
  loraItems: z.array(i2vLoraItemSchema),
})

export const i2vSchema = z.object({
  prompt: z.string().min(1, '프롬프트를 입력해주세요').max(5000, '프롬프트가 너무 깁니다 (최대 5000자)').transform((s) => s.trim()),
  image: imageSchema,
  endImage: optionalImageSchema,
  model: z.enum(['wan', 'ltx']).default('wan'),
  loraPreset: z.string().transform((s) => JSON.parse(s)).pipe(i2vLoraPresetDataSchema).optional(),
  isNSFW: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  isLoop: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
})

export const i2vStatusQuerySchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
})

export type I2VInput = z.infer<typeof i2vSchema>
