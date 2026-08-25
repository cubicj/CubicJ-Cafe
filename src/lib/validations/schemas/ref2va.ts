import { z } from 'zod'

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.mkv', '.avi', '.m4v', '.mpg', '.mpeg', '.wmv', '.flv', '.3gp', '.gif', '.ogv', '.ts', '.mts', '.m2ts'] as const
const AUDIO_EXTENSIONS = ['.wav', '.mp3', '.flac', '.ogg'] as const

const hasExtension = (file: File, extensions: readonly string[]): boolean =>
  extensions.some((ext) => file.name.toLowerCase().endsWith(ext))

const optionalFileSchema = (options: { maxSize: number; typePrefixes: readonly string[]; extensions: readonly string[]; label: string }) =>
  z.instanceof(File)
    .transform((file) => (file.size === 0 ? undefined : file))
    .pipe(
      z.instanceof(File)
        .refine((file) => file.size <= options.maxSize, `${options.label} 파일이 너무 큽니다 (최대 ${Math.round(options.maxSize / 1024 / 1024)}MB)`)
        .refine((file) => file.type === '' || options.typePrefixes.some((prefix) => file.type.startsWith(prefix)), `${options.label} 형식이어야 합니다`)
        .refine((file) => hasExtension(file, options.extensions), `${options.label} 확장자는 ${options.extensions.join(', ')} 중 하나여야 합니다`)
        .optional()
    )
    .optional()

const refImageSchema = optionalFileSchema({ maxSize: 10 * 1024 * 1024, typePrefixes: ['image/'], extensions: IMAGE_EXTENSIONS, label: '이미지' })
const refVideoSchema = optionalFileSchema({ maxSize: 64 * 1024 * 1024, typePrefixes: ['video/', 'image/gif'], extensions: VIDEO_EXTENSIONS, label: '비디오' })
const refAudioSchema = optionalFileSchema({ maxSize: 20 * 1024 * 1024, typePrefixes: ['audio/'], extensions: AUDIO_EXTENSIONS, label: '오디오' })

const formBoolean = z.enum(['true', 'false']).default('false').transform((value) => value === 'true')

export interface Ref2vaVideoInput {
  file: File
  includeSoundtrack: boolean
}

export type Ref2vaAudioInput = { file: File; presetId?: undefined } | { presetId: string; file?: undefined }

export const ref2vaSchema = z.strictObject({
  prompt: z.string().trim().min(1, '프롬프트를 입력해주세요').max(5000, '프롬프트가 너무 깁니다 (최대 5000자)'),
  model: z.literal('h3-ref2va'),
  isNSFW: formBoolean,
  videoDuration: z.coerce.number().int().positive(),
  resolutionMode: z.enum(['first_image', 'custom']),
  aspectWidth: z.coerce.number().int().min(1).max(100).optional(),
  aspectHeight: z.coerce.number().int().min(1).max(100).optional(),
  refImage_0: refImageSchema,
  refImage_1: refImageSchema,
  refImage_2: refImageSchema,
  refImage_3: refImageSchema,
  refImage_4: refImageSchema,
  refImage_5: refImageSchema,
  refImage_6: refImageSchema,
  refImage_7: refImageSchema,
  refImage_8: refImageSchema,
  refVideo_0: refVideoSchema,
  refVideo_1: refVideoSchema,
  refVideo_2: refVideoSchema,
  refVideoSoundtrack_0: formBoolean,
  refVideoSoundtrack_1: formBoolean,
  refVideoSoundtrack_2: formBoolean,
  refAudioFile_0: refAudioSchema,
  refAudioFile_1: refAudioSchema,
  refAudioFile_2: refAudioSchema,
  refAudioPresetId_0: z.string().min(1).optional(),
  refAudioPresetId_1: z.string().min(1).optional(),
  refAudioPresetId_2: z.string().min(1).optional(),
}).transform((data, ctx) => {
  const imageFields = [
    data.refImage_0, data.refImage_1, data.refImage_2,
    data.refImage_3, data.refImage_4, data.refImage_5,
    data.refImage_6, data.refImage_7, data.refImage_8,
  ]
  const images = imageFields.filter((file): file is File => !!file)

  const videoFields = [
    { file: data.refVideo_0, includeSoundtrack: data.refVideoSoundtrack_0 },
    { file: data.refVideo_1, includeSoundtrack: data.refVideoSoundtrack_1 },
    { file: data.refVideo_2, includeSoundtrack: data.refVideoSoundtrack_2 },
  ]
  const videos: Ref2vaVideoInput[] = []
  for (const [slot, entry] of videoFields.entries()) {
    if (!entry.file && entry.includeSoundtrack) {
      ctx.addIssue({ code: 'custom', path: [`refVideoSoundtrack_${slot}`], message: '비디오 없이 사운드트랙을 포함할 수 없습니다' })
      return z.NEVER
    }
    if (entry.file) videos.push({ file: entry.file, includeSoundtrack: entry.includeSoundtrack })
  }

  const audioFields = [
    { file: data.refAudioFile_0, presetId: data.refAudioPresetId_0 },
    { file: data.refAudioFile_1, presetId: data.refAudioPresetId_1 },
    { file: data.refAudioFile_2, presetId: data.refAudioPresetId_2 },
  ]
  const audios: Ref2vaAudioInput[] = []
  for (const [slot, entry] of audioFields.entries()) {
    if (entry.file && entry.presetId) {
      ctx.addIssue({ code: 'custom', path: [`refAudioFile_${slot}`], message: '오디오 슬롯에는 파일과 프리셋 중 하나만 지정할 수 있습니다' })
      return z.NEVER
    }
    if (entry.file) audios.push({ file: entry.file })
    else if (entry.presetId) audios.push({ presetId: entry.presetId })
  }

  if (images.length + videos.length + audios.length === 0) {
    ctx.addIssue({ code: 'custom', path: ['refImage_0'], message: '레퍼런스를 1개 이상 업로드해주세요' })
    return z.NEVER
  }
  if (data.resolutionMode === 'first_image' && images.length === 0) {
    ctx.addIssue({ code: 'custom', path: ['resolutionMode'], message: '첫 이미지 비율 모드에는 레퍼런스 이미지가 필요합니다' })
    return z.NEVER
  }
  if (data.resolutionMode === 'custom' && (!data.aspectWidth || !data.aspectHeight)) {
    ctx.addIssue({ code: 'custom', path: ['aspectWidth'], message: '커스텀 비율 모드에는 가로/세로 비율이 필요합니다' })
    return z.NEVER
  }

  const resolution = data.resolutionMode === 'custom'
    ? { mode: 'custom' as const, aspectWidth: data.aspectWidth!, aspectHeight: data.aspectHeight! }
    : { mode: 'firstImage' as const }

  return {
    prompt: data.prompt,
    model: data.model,
    isNSFW: data.isNSFW,
    videoDuration: data.videoDuration,
    resolution,
    images,
    videos,
    audios,
  }
})
