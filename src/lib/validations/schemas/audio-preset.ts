import { z } from 'zod'

const AUDIO_MIME_TYPES = ['audio/wav', 'audio/mpeg', 'audio/flac', 'audio/ogg', 'audio/x-wav']
const MAX_AUDIO_SIZE = 20 * 1024 * 1024

export const audioFileSchema = z
  .instanceof(File)
  .refine((f) => f.size > 0, '오디오 파일을 업로드해주세요')
  .refine((f) => f.size <= MAX_AUDIO_SIZE, '오디오 파일이 너무 큽니다 (최대 20MB)')
  .refine((f) => AUDIO_MIME_TYPES.includes(f.type), '오디오 형식이어야 합니다 (WAV, MP3, FLAC, OGG)')

export const createAudioPresetSchema = z.object({
  name: z
    .string()
    .min(1, '프리셋 이름은 필수입니다')
    .max(100)
    .transform((s) => s.trim()),
  audio: audioFileSchema,
})

export const updateAudioPresetSchema = z.object({
  name: z
    .string()
    .min(1, '프리셋 이름은 필수입니다')
    .max(100)
    .transform((s) => s.trim()),
  audio: audioFileSchema.optional(),
})

export const reorderAudioPresetsSchema = z.object({
  presetIds: z.array(z.string().min(1)).min(1, '프리셋 ID 배열이 필요합니다').max(100),
})
