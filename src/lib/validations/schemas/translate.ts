import { z } from 'zod'

export const translateSchema = z.object({
  text: z.string().min(1, '번역할 텍스트를 입력해주세요').max(10000),
  sourceLang: z.string().min(2).max(10).regex(/^[a-zA-Z-]{2,10}$/, 'sourceLang 형식이 올바르지 않습니다'),
  targetLang: z.string().min(2).max(10).regex(/^[a-zA-Z-]{2,10}$/, 'targetLang 형식이 올바르지 않습니다'),
})
