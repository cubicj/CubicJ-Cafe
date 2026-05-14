import { createImagePreview } from '@/components/ui/file-upload-preview'

describe('createImagePreview', () => {
  it('reads a file as a data URL preview', async () => {
    const file = new File(['fake-image'], 'start.png', { type: 'image/png' })
    const readAsDataURL = vi.fn(async (input: File) => `data:${input.type};base64,fake-preview`)

    await expect(createImagePreview(file, readAsDataURL)).resolves.toBe('data:image/png;base64,fake-preview')
    expect(readAsDataURL).toHaveBeenCalledWith(file)
  })
})
