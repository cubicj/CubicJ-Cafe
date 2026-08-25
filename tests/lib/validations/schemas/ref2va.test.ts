import { ref2vaSchema } from '@/lib/validations/schemas/ref2va'

function makeFile(name: string, type: string, size = 4): File {
  return new File([new Uint8Array(size)], name, { type })
}

function baseFields(overrides: Record<string, unknown> = {}) {
  return {
    prompt: 'a prompt',
    model: 'h3-ref2va',
    isNSFW: 'false',
    videoDuration: '7',
    resolutionMode: 'first_image',
    refImage_0: makeFile('a.png', 'image/png'),
    ...overrides,
  }
}

describe('ref2vaSchema', () => {
  it('compacts reference files into ordered arrays', () => {
    const result = ref2vaSchema.safeParse(baseFields({
      refImage_1: makeFile('b.png', 'image/png'),
      refVideo_0: makeFile('v.mp4', 'video/mp4'),
      refVideoSoundtrack_0: 'true',
      refAudioFile_0: makeFile('a.wav', 'audio/wav'),
      refAudioPresetId_1: 'preset-1',
    }))
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.images.map((f) => f.name)).toEqual(['a.png', 'b.png'])
    expect(result.data.videos).toEqual([{ file: expect.objectContaining({ name: 'v.mp4' }), includeSoundtrack: true }])
    expect(result.data.audios).toEqual([
      { file: expect.objectContaining({ name: 'a.wav' }) },
      { presetId: 'preset-1' },
    ])
    expect(result.data.resolution).toEqual({ mode: 'firstImage' })
  })

  it('rejects an empty reference set', () => {
    const result = ref2vaSchema.safeParse({
      prompt: 'a prompt',
      model: 'h3-ref2va',
      isNSFW: 'false',
      videoDuration: '7',
      resolutionMode: 'custom',
      aspectWidth: '16',
      aspectHeight: '9',
    })
    expect(result.success).toBe(false)
  })

  it('rejects first_image mode without images', () => {
    const result = ref2vaSchema.safeParse({
      prompt: 'a prompt',
      model: 'h3-ref2va',
      isNSFW: 'false',
      videoDuration: '7',
      resolutionMode: 'first_image',
      refAudioPresetId_0: 'preset-1',
    })
    expect(result.success).toBe(false)
  })

  it('rejects custom mode without aspect values', () => {
    const result = ref2vaSchema.safeParse(baseFields({ resolutionMode: 'custom' }))
    expect(result.success).toBe(false)
  })

  it('parses custom mode with aspect values', () => {
    const result = ref2vaSchema.safeParse(baseFields({ resolutionMode: 'custom', aspectWidth: '4', aspectHeight: '3' }))
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.resolution).toEqual({ mode: 'custom', aspectWidth: 4, aspectHeight: 3 })
  })

  it('rejects an audio slot with both file and preset', () => {
    const result = ref2vaSchema.safeParse(baseFields({
      refAudioFile_0: makeFile('a.wav', 'audio/wav'),
      refAudioPresetId_0: 'preset-1',
    }))
    expect(result.success).toBe(false)
  })

  it('rejects a soundtrack flag without a video in the same slot', () => {
    const result = ref2vaSchema.safeParse(baseFields({
      refVideoSoundtrack_1: 'true',
    }))
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: ['refVideoSoundtrack_1'] }),
    ]))
  })

  it('rejects a whitespace-only prompt', () => {
    const result = ref2vaSchema.safeParse(baseFields({ prompt: '   \t\n  ' }))
    expect(result.success).toBe(false)
  })

  it('rejects an oversized video', () => {
    const result = ref2vaSchema.safeParse(baseFields({
      refVideo_0: makeFile('big.mp4', 'video/mp4', 64 * 1024 * 1024 + 1),
    }))
    expect(result.success).toBe(false)
  })

  it('rejects a video with a bad extension', () => {
    const result = ref2vaSchema.safeParse(baseFields({
      refVideo_0: makeFile('v.txt', 'video/mp4'),
    }))
    expect(result.success).toBe(false)
  })

  it.each([
    ['v.mkv', 'video/x-matroska'],
    ['v.avi', 'video/x-msvideo'],
    ['v.flv', ''],
    ['v.gif', 'image/gif'],
    ['v.m2ts', ''],
  ])('accepts video %s with type %s', (name, type) => {
    const result = ref2vaSchema.safeParse(baseFields({
      refVideo_0: makeFile(name, type),
    }))
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.videos).toEqual([{ file: expect.objectContaining({ name }), includeSoundtrack: false }])
  })

  it('rejects a video with a non-video MIME type', () => {
    const result = ref2vaSchema.safeParse(baseFields({
      refVideo_0: makeFile('v.mp4', 'text/plain'),
    }))
    expect(result.success).toBe(false)
  })

  it.each([
    ['refImage_9', makeFile('overflow.png', 'image/png')],
    ['refVideo_3', makeFile('overflow.mp4', 'video/mp4')],
    ['refAudioFile_3', makeFile('overflow.wav', 'audio/wav')],
    ['refAudioPresetId_3', 'preset-overflow'],
    ['unexpectedField', 'unexpected-value'],
  ])('rejects unknown field %s', (field, value) => {
    const result = ref2vaSchema.safeParse(baseFields({ [field]: value }))
    expect(result.success).toBe(false)
  })
})
