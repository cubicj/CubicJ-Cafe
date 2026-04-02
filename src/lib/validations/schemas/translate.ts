import { z } from 'zod'

export const translateSchema = z.object({
  text: z.string().min(1, '번역할 텍스트를 입력해주세요').max(10000),
  sourceLang: z.string().min(2).max(10),
  targetLang: z.string().min(2).max(10),
})

export type TranslateInput = z.infer<typeof translateSchema>
