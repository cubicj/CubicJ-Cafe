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
      sageAttention: 'test-sage-mode',
      sageAllowCompile: false,
      lowVramHeadChunks: 5,
      chunkFeedforwardEnabled: true,
      chunkFeedforwardChunks: 3,
      chunkFeedforwardMinLen: 1024,
      megapixels: 0.5,
      megapixelsVideo: 0.3,
      refVideoForceRate: 12,
      refVideoFormat: 'test-format',
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
      noVideoUnet: 'test-h3r-nv-unet.safetensors',
      noVideoSteps: 9,
      noVideoSampler: 'test-nv-sampler',
      noVideoScheduler: 'test-nv-scheduler',
      noVideoMegapixels: 0.4,
      noVideoChunkFeedforwardEnabled: true,
      noVideoChunkFeedforwardChunks: 5,
      noVideoChunkFeedforwardMinLen: 512,
      noVideoSplitStep: 6,
      noVideoManualSigmas: '0.9, 0.5, 0.1, 0.0',
      noVideoUpscalerModel: 'test-nv-upscaler.pth',
      noVideoSecondPassMegapixels: 0.7,
      noVideoUpscalerAlign: 8,
      noVideoUpscalerChunking: false,
      noVideoUpscalerDevice: 'test-device',
      noVideoUpscalerPrecision: 'test-precision',
      noVideoClipName: 'test-h3r-nv-clip.safetensors',
      noVideoVideoVae: 'test-h3r-nv-video-vae.safetensors',
    })
  })

  it('throws when a required key is missing', async () => {
    await prisma.systemSetting.delete({ where: { key: 'h3-ref2va.unet' } })
    await expect(getH3Ref2vaSettings()).rejects.toThrow('h3-ref2va.unet')
  })
})
