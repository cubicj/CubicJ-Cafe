import { cleanTables } from '@tests/helpers/db'
import { seedH3Fl2va } from '@tests/helpers/h3-fl2va-seed'
import { prisma } from '@/lib/database/prisma'
import { getH3Fl2vaSettings } from '@/lib/database/system-settings'

beforeEach(async () => {
  await cleanTables()
  await seedH3Fl2va()
})

describe('getH3Fl2vaSettings', () => {
  it('returns typed settings from seeded rows', async () => {
    const settings = await getH3Fl2vaSettings()
    expect(settings).toMatchObject({
      unet: 'test-h3-unet.safetensors',
      unetWeightDtype: 'fake-weight-dtype',
      clipName: 'test-h3-clip.safetensors',
      clipType: 'test-clip-type',
      clipDevice: 'fake-clip-device',
      videoVae: 'test-h3-video-vae.safetensors',
      audioVae: 'test-h3-audio-vae.safetensors',
      steps: 4,
      sampler: 'fake-sampler',
      scheduler: 'fake-scheduler',
      shiftVideo: 7,
      shiftAudio: 2,
      sageAttention: 'test-sage-mode',
      sageAllowCompile: false,
      lowVramHeadChunks: 5,
      chunkFeedforwardEnabled: true,
      chunkFeedforwardChunks: 3,
      chunkFeedforwardMinLen: 1024,
      megapixels: 0.61,
      secondPassMegapixels: 0.83,
      splitStep: 6,
      manualSigmas: '0.93, 0.47, 0.02',
      upscalerModel: 'fake-h3-upscaler-z9.pth',
      upscalerAlign: 48,
      upscalerChunking: true,
      upscalerDevice: 'fake-device-x',
      upscalerPrecision: 'fake-precision-y',
      resizeMultipleOf: 16,
      resizeUpscaleMethod: 'fake-resize-method',
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
      rtxQuality: 'fake-quality',
    })
  })

  it('throws when a required key is missing', async () => {
    await prisma.systemSetting.delete({ where: { key: 'h3-fl2va.unet' } })
    await expect(getH3Fl2vaSettings()).rejects.toThrow('h3-fl2va.unet')
  })
})
