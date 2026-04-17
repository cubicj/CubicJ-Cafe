import { vi } from 'vitest'

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

import { i2vSchema } from '@/lib/validations/schemas/i2v'

describe('i2vSchema image validation', () => {
  function makeFormData(image: File, endImage?: File): FormData {
    const fd = new FormData()
    fd.set('prompt', 'test prompt')
    fd.set('image', image)
    if (endImage) fd.set('endImage', endImage)
    return fd
  }

  it('rejects image with disallowed extension despite valid MIME', () => {
    const file = new File(['fake content'], 'malicious.exe', { type: 'image/jpeg' })
    const result = i2vSchema.safeParse(Object.fromEntries(makeFormData(file).entries()))
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('확장자'))).toBe(true)
    }
  })

  it('accepts image with allowed .jpg extension and valid MIME', () => {
    const file = new File(['fake content'], 'photo.jpg', { type: 'image/jpeg' })
    const result = i2vSchema.safeParse(Object.fromEntries(makeFormData(file).entries()))
    expect(result.success).toBe(true)
  })

  it('accepts image with allowed .webp extension', () => {
    const file = new File(['fake content'], 'photo.webp', { type: 'image/webp' })
    const result = i2vSchema.safeParse(Object.fromEntries(makeFormData(file).entries()))
    expect(result.success).toBe(true)
  })

  it('rejects file with double extension where the actual one is bad', () => {
    const file = new File(['fake content'], 'photo.jpg.exe', { type: 'image/jpeg' })
    const result = i2vSchema.safeParse(Object.fromEntries(makeFormData(file).entries()))
    expect(result.success).toBe(false)
  })
})
