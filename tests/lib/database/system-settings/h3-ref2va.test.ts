import { cleanTables } from '@tests/helpers/db'
import { seedH3Ref2va } from '@tests/helpers/h3-ref2va-seed'
import { prisma } from '@/lib/database/prisma'
import { getH3Ref2vaSettings } from '@/lib/database/system-settings'

beforeEach(async () => {
  await cleanTables()
  await seedH3Ref2va()
})

describe('getH3Ref2vaSettings', () => {
  it('returns typed settings from seeded rows', async () => {
    const settings = await getH3Ref2vaSettings()
    expect(settings).toMatchObject({
      unet: 'test-h3r-unet.safetensors',
      unetWeightDtype: 'fake-weight-dtype',
      clipName: 'test-h3r-clip.safetensors',
      clipType: 'test-clip-type',
      clipDevice: 'fake-clip-device',
      videoVae: 'test-h3r-video-vae.safetensors',
      audioVae: 'test-h3r-audio-vae.safetensors',
      turboLora: 'test-h3r-lora.safetensors',
      turboLoraStrength: 0.9,
      steps: 4,
      sampler: 'fake-sampler',
      scheduler: 'fake-scheduler',
      shiftVideo: 7,
      shiftAudio: 2,
      attentionBackend: 'test attention',
      fusedModulation: true,
      chunkFeedforwardEnabled: true,
      chunkFeedforwardChunks: 3,
      chunkFeedforwardMinTokens: 1024,
      solAttnEnabled: false,
      solAttnTauStart: 1.1,
      solAttnTauEnd: 0.7,
      solAttnCurve: 'test-curve',
      solAttnMinTokens: 2048,
      solAttnStrict: false,
      solAttnDensePercent: 0.5,
      solAttnThreshType: 'test-thresh',
      solAttnInt8Qk: true,
      solAttnInt8Pv: false,
      solAttnSinkConditioning: 'test-sink',
      solAttnDenseBlocks: '',
      megapixels: 0.5,
      resizeMultipleOf: 16,
      resizeUpscaleMethod: 'fake-resize-method',
      refImageSize: 'test-match',
      durationOptions: [5, 7],
      framesPerStep: 10,
      frameBase: 3,
      frameRate: 10,
      videoCrf: 18,
      videoFormat: 'fake-video-format',
      videoPixFmt: 'fake-pix-format',
      rtxEnabled: true,
      rtxResizeType: 'fake-resize-type',
      rtxScale: 1.7,
      rtxQuality: 'HIGH',
    })
  })

  it('throws when a required key is missing', async () => {
    await prisma.systemSetting.delete({ where: { key: 'h3-ref2va.unet' } })
    await expect(getH3Ref2vaSettings()).rejects.toThrow('h3-ref2va.unet')
  })

  it('allows empty dense_blocks', async () => {
    const settings = await getH3Ref2vaSettings()
    expect(settings.solAttnDenseBlocks).toBe('')
  })
})
