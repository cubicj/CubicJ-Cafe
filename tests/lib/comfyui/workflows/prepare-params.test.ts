import { vi } from 'vitest'

const mockGetLtxrSettings = vi.fn()
const mockGetWatermarkAssetBlob = vi.fn()

vi.mock('@/lib/database/system-settings', () => ({
  getLtxrSettings: (...args: unknown[]) => mockGetLtxrSettings(...args),
}))

vi.mock('@/lib/database/watermark-assets', () => ({
  getWatermarkAssetBlob: (...args: unknown[]) => mockGetWatermarkAssetBlob(...args),
}))

import { prepareGenerationParams } from '@/lib/comfyui/workflows/prepare-params'

describe('generation param preparation', () => {
  const request = {
    prompt: 'fake prompt',
    videoDuration: 6,
    isNSFW: true,
  }
  const client = {
    uploadImage: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('prepares WAN params', async () => {
    await expect(prepareGenerationParams('wan', {
      request,
      inputImage: 'start.png',
      endImage: 'end.png',
      referenceAudio: 'audio.wav',
      client: client as never,
    })).resolves.toEqual({
      model: 'wan',
      prompt: 'fake prompt',
      inputImage: 'start.png',
      videoDuration: 6,
      isNSFW: true,
      endImage: 'end.png',
    })
  })

  it('prepares LTXA params', async () => {
    await expect(prepareGenerationParams('ltxa', {
      request,
      inputImage: 'start.png',
      endImage: 'end.png',
      referenceAudio: 'audio.wav',
      client: client as never,
    })).resolves.toEqual({
      model: 'ltxa',
      prompt: 'fake prompt',
      inputImage: 'start.png',
      videoDuration: 6,
      isNSFW: true,
      referenceAudio: 'audio.wav',
    })
  })

  it('prepares LTX-WAN params', async () => {
    await expect(prepareGenerationParams('ltx-wan', {
      request,
      inputImage: 'start.png',
      endImage: 'end.png',
      referenceAudio: 'audio.wav',
      client: client as never,
    })).resolves.toEqual({
      model: 'ltx-wan',
      prompt: 'fake prompt',
      inputImage: 'start.png',
      videoDuration: 6,
      isNSFW: true,
      endImage: 'end.png',
      referenceAudio: 'audio.wav',
    })
  })

  it('loads LTXR settings and uploads its configured watermark', async () => {
    const settings = {
      watermarkEnabled: true,
      watermarkImageAssetId: 'asset-1',
    }
    mockGetLtxrSettings.mockResolvedValue(settings)
    mockGetWatermarkAssetBlob.mockResolvedValue({
      filename: 'watermark.png',
      mimeType: 'image/png',
      imageBlob: new Uint8Array([1, 2, 3]),
    })
    client.uploadImage.mockResolvedValue('uploaded-watermark.png')

    await expect(prepareGenerationParams('ltxr', {
      request: { ...request, isNSFW: false },
      inputImage: 'start.png',
      endImage: 'end.png',
      referenceAudio: 'audio.wav',
      client: client as never,
    })).resolves.toEqual({
      model: 'ltxr',
      prompt: 'fake prompt',
      inputImage: 'start.png',
      videoDuration: 6,
      isNSFW: false,
      endImage: 'end.png',
      referenceAudio: 'audio.wav',
      watermarkImage: 'uploaded-watermark.png',
      settings,
    })
    expect(mockGetWatermarkAssetBlob).toHaveBeenCalledWith('asset-1')
    expect(client.uploadImage).toHaveBeenCalledWith(expect.objectContaining({
      name: 'watermark.png',
      type: 'image/png',
    }))
  })

  it('rejects unsupported model strings', async () => {
    await expect(prepareGenerationParams('unknown', {
      request,
      inputImage: 'start.png',
      client: client as never,
    })).rejects.toThrow('Unsupported video model: unknown')
  })

  it('prepares H3 FL2VA params with only an end image', async () => {
    await expect(prepareGenerationParams('h3-fl2va', {
      request,
      endImage: 'end.png',
      client: client as never,
    })).resolves.toEqual({
      model: 'h3-fl2va',
      prompt: 'fake prompt',
      inputImage: undefined,
      videoDuration: 6,
      isNSFW: true,
      endImage: 'end.png',
    })
  })

  it('rejects H3 FL2VA params without an image', async () => {
    await expect(prepareGenerationParams('h3-fl2va', {
      request,
      client: client as never,
    })).rejects.toThrow('H3 FL2VA requires at least one image')
  })

  it('rejects existing models without a start image', async () => {
    await expect(prepareGenerationParams('wan', {
      request,
      inputImage: undefined,
      client: client as never,
    })).rejects.toThrow('Start image is required')
  })
})
