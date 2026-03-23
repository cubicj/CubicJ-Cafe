import { z } from 'zod'

const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9_\-\s]+$/

export const createNicknameSchema = z.object({
  nickname: z.string()
    .min(2, '닉네임은 2자 이상이어야 합니다')
    .max(20, '닉네임은 20자 이하여야 합니다')
    .regex(NICKNAME_REGEX, '닉네임에는 한글, 영문, 숫자, _, -, 공백만 사용할 수 있습니다')
    .transform((s) => s.trim()),
})

export const checkNicknameQuerySchema = z.object({
  check: z.string().optional(),
})

export type CreateNicknameInput = z.infer<typeof createNicknameSchema>
