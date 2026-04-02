import { vi } from 'vitest'

vi.mock('@/lib/database/system-settings', () => ({
  getLtxSettings: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

import type { LtxGenerationParams } from '@/lib/comfyui/workflows/types'
import type { LoRAPresetData } from '@/types/lora'
import { buildLtxWorkflow } from '@/lib/comfyui/workflows/ltx/builder'
import { getLtxSettings } from '@/lib/database/system-settings'

const mockGetLtxSettings = vi.mocked(getLtxSettings)

function makeSettings(overrides = {}) {
  return {
    unet: 'fake-unet-x7q.safetensors',
    weightDtype: 'fp4',
    unet2nd: 'fake-unet-2nd-k9m.safetensors',
    weightDtype2nd: 'bf8',
    clipGguf: 'fake-clip-r2d.gguf',
    clipEmbeddings: 'fake-embed-z4p.safetensors',
    audioVae: 'fake-audio-vae-w8.safetensors',
    videoVae: 'fake-video-vae-j3.safetensors',
    loraEnabled: true,
    sampler: 'fake_sampler_v2',
    nagScale: 3.5,
    nagAlpha: 0.15,
    nagTau: 1.8,
    nagScale2nd: 4.2,
    nagAlpha2nd: 0.18,
    nagTau2nd: 2.1,
    duration: 6,
    frameRate: 12,
    megapixels: 0.35,
    resizeMultipleOf: 48,
    resizeUpscaleMethod: 'nearest',
    colorMatchEnabled: true,
    colorMatchMethod: 'wavelet',
    colorMatchStrength: 0.45,
    rtxEnabled: true,
    rtxResizeType: 'stretch fit',
    rtxScale: 2.0,
    rtxQuality: 'LOW',
    vfiEnabled: true,
    vfiMethod: 'rife',
    rifeModel: 'fake_rife_model_sim',
    rifePrecision: 'fp16',
    rifeResolutionProfile: 'medium',
    gmfssModel: 'fake_gmfss_union',
    vfiClearCache: 200,
    vfiMultiplier: 3,
    videoCrf: 18,
    videoFormat: 'video/h265-mp4',
    videoPixFmt: 'yuv444p',
    negativePrompt: 'fake test negative',
    idLoraName: 'fake-id-lora-q5.safetensors',
    idLoraStrength: 0.55,
    idLoraStrength2nd: 0.65,
    identityGuidanceScale: 2.5,
    identityStartPercent: 0.05,
    identityEndPercent: 0.75,
    identityGuidanceScale2nd: 1.8,
    identityStartPercent2nd: 0.1,
    identityEndPercent2nd: 0.6,
    schedulerSteps: 6,
    schedulerMaxShift: 1.85,
    schedulerBaseShift: 0.75,
    schedulerStretch: false,
    schedulerTerminal: 0.15,
    sigmas2nd: '0.92, 0.68, 0.35, 0.0',
    upscaleModel: 'fake-upscale-q8.safetensors',
    audioNorm1st: '1,0.8,0.6,1,0.8',
    audioNorm2nd: '1,0.9,0.3,1,0.9',
    ...overrides,
  }
}

const baseParams: LtxGenerationParams = {
  model: 'ltx',
  prompt: 'a cat dancing on the moon',
  inputImage: 'test-image.png',
}

describe('buildLtxWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetLtxSettings.mockResolvedValue(makeSettings())
  })

  describe('settings injection', () => {
    it('sets prompt text in node 5', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['5']!.inputs!.text).toBe('a cat dancing on the moon')
    })

    it('sets input image in node 87', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['87']!.inputs!.image).toBe('test-image.png')
    })

    it('generates random seeds that differ between calls', async () => {
      const w1 = await buildLtxWorkflow(baseParams)
      const w2 = await buildLtxWorkflow(baseParams)
      expect(w1['16']!.inputs!.noise_seed).not.toBe(w2['16']!.inputs!.noise_seed)
    })

    it('sets filename prefix with LTX/ prefix', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['345']!.inputs!.filename_prefix).toBe('LTX/test-image')
    })

    it('strips image extension from filename prefix', async () => {
      const params: LtxGenerationParams = { ...baseParams, inputImage: 'photo.jpg' }
      const workflow = await buildLtxWorkflow(params)
      expect(workflow['345']!.inputs!.filename_prefix).toBe('LTX/photo')
    })

    it('injects model names into correct nodes', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['297']!.inputs!.unet_name).toBe('fake-unet-x7q.safetensors')
      expect(workflow['297']!.inputs!.weight_dtype).toBe('fp4')
      expect(workflow['390']!.inputs!.clip_name1).toBe('fake-clip-r2d.gguf')
      expect(workflow['390']!.inputs!.clip_name2).toBe('fake-embed-z4p.safetensors')
      expect(workflow['1']!.inputs!.vae_name).toBe('fake-audio-vae-w8.safetensors')
      expect(workflow['2']!.inputs!.vae_name).toBe('fake-video-vae-j3.safetensors')
    })

    it('injects 2nd pass UNet into node 450', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['450']!.inputs!.unet_name).toBe('fake-unet-2nd-k9m.safetensors')
      expect(workflow['450']!.inputs!.weight_dtype).toBe('bf8')
    })

    it('injects negative prompt into node 6', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['6']!.inputs!.text).toBe('fake test negative')
    })

    it('injects NAG settings into node 72', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['72']!.inputs!.nag_scale).toBe(3.5)
      expect(workflow['72']!.inputs!.nag_alpha).toBe(0.15)
      expect(workflow['72']!.inputs!.nag_tau).toBe(1.8)
    })

    it('injects NAG_2ND settings into node 453', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['453']!.inputs!.nag_scale).toBe(4.2)
      expect(workflow['453']!.inputs!.nag_alpha).toBe(0.18)
      expect(workflow['453']!.inputs!.nag_tau).toBe(2.1)
    })

    it('injects sampler into node 20', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['20']!.inputs!.sampler_name).toBe('fake_sampler_v2')
    })

    it('injects duration into node 103', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['103']!.inputs!.value).toBe(6)
    })

    it('injects frame rate in node 416', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['416']!.inputs!.number).toBe(12)
    })

    it('injects resize settings into node 86', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['86']!.inputs!.megapixels).toBe(0.35)
      expect(workflow['86']!.inputs!.multiple_of).toBe(48)
      expect(workflow['86']!.inputs!.upscale_method).toBe('nearest')
    })

    it('injects RTX settings into node 322', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['322']!.inputs!.resize_type).toBe('stretch fit')
      expect(workflow['322']!.inputs!['resize_type.scale']).toBe(2.0)
      expect(workflow['322']!.inputs!.quality).toBe('LOW')
    })

    it('injects VFI settings into nodes 444/443/339', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['444']!.inputs!.clear_cache_after_n_frames).toBe(200)
      expect(workflow['443']!.inputs!.model).toBe('fake_rife_model_sim')
      expect(workflow['443']!.inputs!.precision).toBe('fp16')
      expect(workflow['443']!.inputs!.resolution_profile).toBe('medium')
      expect(workflow['339']!.inputs!.value).toBe(3)
    })

    it('injects CRF into node 345', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['345']!.inputs!.crf).toBe(18)
    })

    it('injects scheduler settings into node 403', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['403']!.inputs!.steps).toBe(6)
      expect(workflow['403']!.inputs!.max_shift).toBe(1.85)
      expect(workflow['403']!.inputs!.base_shift).toBe(0.75)
      expect(workflow['403']!.inputs!.stretch).toBe(false)
      expect(workflow['403']!.inputs!.terminal).toBe(0.15)
    })

    it('injects sigmas 2nd into node 431', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['431']!.inputs!.sigmas).toBe('0.92, 0.68, 0.35, 0.0')
    })

    it('injects upscale model into node 421', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['421']!.inputs!.model_name).toBe('fake-upscale-q8.safetensors')
    })

    it('injects color match into node 437', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['437']!.inputs!.method).toBe('wavelet')
      expect(workflow['437']!.inputs!.strength).toBe(0.45)
    })

    it('injects AudioNorm1st into node 457', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['457']!.inputs!.audio_normalization_factors).toBe('1,0.8,0.6,1,0.8')
    })

    it('injects AudioNorm2nd into node 458', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['458']!.inputs!.audio_normalization_factors).toBe('1,0.9,0.3,1,0.9')
    })
  })

  describe('end image handling', () => {
    it('sets end image in node 260 when provided', async () => {
      const params: LtxGenerationParams = { ...baseParams, endImage: 'end-photo.png' }
      const workflow = await buildLtxWorkflow(params)
      expect(workflow['260']!.inputs!.image).toBe('end-photo.png')
    })

    it('keeps two-image mode in both nodes 265 and 417 when endImage provided', async () => {
      const params: LtxGenerationParams = { ...baseParams, endImage: 'end-photo.png' }
      const workflow = await buildLtxWorkflow(params)
      expect(workflow['265']!.inputs!['num_images']).toBe('2')
      expect(workflow['265']!.inputs!['num_images.image_2']).toBeDefined()
      expect(workflow['417']!.inputs!['num_images']).toBe('2')
      expect(workflow['417']!.inputs!['num_images.image_2']).toBeDefined()
    })

    it('switches to single-image mode in both 265 and 417 when no endImage', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['265']!.inputs!['num_images']).toBe('1')
      expect(workflow['265']!.inputs!['num_images.image_2']).toBeUndefined()
      expect(workflow['265']!.inputs!['num_images.index_2']).toBeUndefined()
      expect(workflow['265']!.inputs!['num_images.strength_2']).toBeUndefined()
      expect(workflow['417']!.inputs!['num_images']).toBe('1')
      expect(workflow['417']!.inputs!['num_images.image_2']).toBeUndefined()
      expect(workflow['417']!.inputs!['num_images.index_2']).toBeUndefined()
      expect(workflow['417']!.inputs!['num_images.strength_2']).toBeUndefined()
    })

    it('removes end image nodes when no endImage', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['260']).toBeUndefined()
      expect(workflow['261']).toBeUndefined()
      expect(workflow['264']).toBeUndefined()
    })
  })

  describe('LoRA preset integration', () => {
    it('adds user LoRA to Power LoRA lora_3 slot when preset provided', async () => {
      const loraPreset: LoRAPresetData = {
        presetId: '1',
        presetName: 'test',
        loraItems: [{
          loraFilename: 'LTX\\Custom\\style.safetensors',
          loraName: 'Style',
          strength: 0.7,
          group: 'HIGH',
          order: 0,
        }],
      }
      const params: LtxGenerationParams = { ...baseParams, loraPreset }
      const workflow = await buildLtxWorkflow(params)

      expect(workflow['448']!.inputs!['lora_3']).toEqual({
        on: true,
        lora: 'LTX\\Custom\\style.safetensors',
        strength: 0.7,
      })
      expect(workflow['452']!.inputs!['lora_3']).toEqual({
        on: true,
        lora: 'LTX\\Custom\\style.safetensors',
        strength: 0.7,
      })
    })

    it('does not add lora_3 when no preset', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['448']!.inputs!['lora_3']).toBeUndefined()
      expect(workflow['452']!.inputs!['lora_3']).toBeUndefined()
    })
  })

  describe('structural integrity', () => {
    it('preserves all critical nodes', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      const criticalNodes = [
        '1', '2', '5', '6', '16', '20', '72', '86', '87', '103',
        '265', '297', '298', '322', '333', '339', '340', '345',
        '354', '355', '373', '384', '390', '403', '406',
        '407', '409', '416', '417', '418', '419', '421', '422',
        '431', '437', '443', '444', '448', '449', '450', '451',
        '452', '453', '457', '458',
      ]
      for (const nodeId of criticalNodes) {
        expect(workflow[nodeId], `node ${nodeId} should exist`).toBeDefined()
      }
    })

    it('does not contain removed nodes', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      const removedNodes = [
        '11', '12', '335',
        '19', '47', '59', '61', '82', '317', '319', '334', '336', '337', '362', '378',
      ]
      for (const nodeId of removedNodes) {
        expect(workflow[nodeId], `node ${nodeId} should not exist`).toBeUndefined()
      }
    })

    it('connects 1st pass model chain: PowerLoRA → NAG → AudioNorm → CFGGuider', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['448']!.inputs!.model).toEqual(['354', 0])
      expect(workflow['72']!.inputs!.model).toEqual(['448', 0])
      expect(workflow['457']!.inputs!.model).toEqual(['72', 0])
      expect(workflow['355']!.inputs!.model).toEqual(['457', 0])
    })

    it('connects 2nd pass model chain: PowerLoRA → NAG_2ND → AudioNorm → CFGGuider_2ND', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['452']!.inputs!.model).toEqual(['451', 0])
      expect(workflow['453']!.inputs!.model).toEqual(['452', 0])
      expect(workflow['458']!.inputs!.model).toEqual(['453', 0])
      expect(workflow['407']!.inputs!.model).toEqual(['458', 0])
    })

    it('connects 1st pass sampling chain: Sampler → VRAM → SeparateAV_1st → Upsampler → ImgToVideo_2nd → ConcatAV_2nd', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['17']!.inputs!.guider).toEqual(['355', 0])
      expect(workflow['373']!.inputs!.any_input).toEqual(['17', 0])
      expect(workflow['418']!.inputs!.av_latent).toEqual(['373', 0])
      expect(workflow['422']!.inputs!.samples).toEqual(['418', 0])
      expect(workflow['417']!.inputs!.latent).toEqual(['422', 0])
      expect(workflow['419']!.inputs!.video_latent).toEqual(['417', 0])
      expect(workflow['419']!.inputs!.audio_latent).toEqual(['418', 1])
    })

    it('connects 2nd pass sampling chain: Sampler_2nd → VRAM_2nd → SeparateAV', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['406']!.inputs!.guider).toEqual(['407', 0])
      expect(workflow['406']!.inputs!.sigmas).toEqual(['431', 0])
      expect(workflow['406']!.inputs!.latent_image).toEqual(['419', 0])
      expect(workflow['409']!.inputs!.any_input).toEqual(['406', 0])
      expect(workflow['384']!.inputs!.av_latent).toEqual(['409', 0])
    })

    it('connects output chain: ColorMatch → VFI → RTX', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['437']!.inputs!.image_target).toEqual(['333', 0])
      expect(workflow['444']!.inputs!.frames).toEqual(['437', 0])
      expect(workflow['322']!.inputs!.images).toEqual(['444', 0])
    })

    it('connects VAEDecode and AudioDecode from SeparateAV', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['333']!.inputs!.samples).toEqual(['384', 0])
      expect(workflow['321']!.inputs!.samples).toEqual(['384', 1])
    })

    it('connects ColorMatch image_ref from input image', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['437']!.inputs!.image_ref).toEqual(['87', 0])
    })

    it('connects VideoCombine frame_rate to VFI math expression', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['345']!.inputs!.frame_rate).toEqual(['340', 1])
    })

    it('connects NAG with both video and audio conditioning', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['72']!.inputs!.nag_cond_video).toEqual(['23', 1])
      expect(workflow['72']!.inputs!.nag_cond_audio).toEqual(['23', 1])
    })

    it('connects CFGGuider with conditioning', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['355']!.inputs!.positive).toEqual(['23', 0])
      expect(workflow['355']!.inputs!.negative).toEqual(['23', 1])
    })
  })

  describe('VFI bypass', () => {
    beforeEach(() => {
      mockGetLtxSettings.mockResolvedValue(makeSettings({ vfiEnabled: false }))
    })

    it('removes VFI nodes when disabled', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['444']).toBeUndefined()
      expect(workflow['443']).toBeUndefined()
      expect(workflow['456']).toBeUndefined()
      expect(workflow['339']).toBeUndefined()
      expect(workflow['340']).toBeUndefined()
    })

    it('connects RTX directly to ColorMatch', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['322']!.inputs!.images).toEqual(['437', 0])
    })

    it('connects VideoCombine frame_rate to FRAME_RATE node', async () => {
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['345']!.inputs!.frame_rate).toEqual(['416', 2])
    })
  })

  describe('post-processing', () => {
    it('removes ColorMatch when disabled, VFI connects to VAE_DECODE', async () => {
      mockGetLtxSettings.mockResolvedValue(makeSettings({ colorMatchEnabled: false }))
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['437']).toBeUndefined()
      expect(workflow['444']!.inputs!.frames).toEqual(['333', 0])
    })

    it('removes RTX when disabled, VIDEO_OUTPUT connects to VFI output', async () => {
      mockGetLtxSettings.mockResolvedValue(makeSettings({ rtxEnabled: false }))
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['322']).toBeUndefined()
      expect(workflow['345']!.inputs!.images).toEqual(['444', 0])
    })

    it('uses GMFSS when vfiMethod is gmfss, removes RIFE nodes', async () => {
      mockGetLtxSettings.mockResolvedValue(makeSettings({ vfiMethod: 'gmfss' }))
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['443']).toBeUndefined()
      expect(workflow['444']).toBeUndefined()
      expect(workflow['456']).toBeDefined()
      expect(workflow['456']!.inputs!.ckpt_name).toBe('fake_gmfss_union')
    })

    it('connects VIDEO_OUTPUT directly to VAE_DECODE when all post-processing disabled', async () => {
      mockGetLtxSettings.mockResolvedValue(makeSettings({
        colorMatchEnabled: false,
        vfiEnabled: false,
        rtxEnabled: false,
      }))
      const workflow = await buildLtxWorkflow(baseParams)
      expect(workflow['345']!.inputs!.images).toEqual(['333', 0])
      expect(workflow['345']!.inputs!.frame_rate).toEqual(['416', 2])
    })
  })
})
