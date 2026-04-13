import { vi } from 'vitest'

vi.mock('@/lib/database/system-settings', () => ({
  getWanSettings: vi.fn().mockResolvedValue({
    unetHigh: 'test-unet-high.safetensors',
    unetLow: 'test-unet-low.safetensors',
    clip: 'test-clip.safetensors',
    vae: 'test-vae.safetensors',
    loraEnabled: false,
    megapixels: 0.5,
    shift: 5,
    nagScale: 5,
    nagAlpha: 0.25,
    nagTau: 2.373,
    stepsHigh: 3,
    stepsLow: 3,
    moeScheduler: 'beta',
    moeBoundary: 0.9,
    moeInterval: 0.01,
    moeDenoise: 1,
    sampler: 'euler',
    negativePrompt: 'test negative prompt',
    resizeMultipleOf: 16,
    resizeUpscaleMethod: 'lanczos',
    vfiEnabled: true,
    vfiMethod: 'rife',
    vfiClearCache: 300,
    vfiMultiplier: 2,
    rifeModel: 'test-rife-model',
    rifePrecision: 'fp32',
    rifeResolutionProfile: 'custom',
    rifeCustomMinDim: 704,
    rifeCustomOptDim: 960,
    rifeCustomMaxDim: 1280,
    gmfssModel: 'test-gmfss-model.pth',
    colorMatchEnabled: true,
    colorMatchMethod: 'mkl',
    colorMatchStrength: 0.1,
    rtxEnabled: true,
    rtxResizeType: 'scale by multiplier',
    rtxScale: 1.5,
    rtxQuality: 'ULTRA',
    frameRate: 32,
    videoCrf: 20,
    videoFormat: 'video/h264-mp4',
    videoPixFmt: 'yuv420p',
  }),
}))

vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}))

import type { WanGenerationParams } from '@/lib/comfyui/workflows/types'
import { buildWanWorkflow } from '@/lib/comfyui/workflows/wan/builder'

const baseParams: WanGenerationParams = {
  model: 'wan',
  prompt: 'a dragon flying through clouds',
  inputImage: 'dragon-input.png',
  videoDuration: 5,
}

describe('buildWanWorkflow', () => {
  it('produces a valid workflow object', async () => {
    const workflow = await buildWanWorkflow(baseParams)
    expect(workflow).toBeDefined()
    expect(workflow).not.toBeNull()
    expect(typeof workflow).toBe('object')
  })

  it('sets random seed in node 3', async () => {
    const w1 = await buildWanWorkflow(baseParams)
    const w2 = await buildWanWorkflow(baseParams)

    expect(typeof w1['3']!.inputs!.noise_seed).toBe('number')
    expect(w1['3']!.inputs!.noise_seed).not.toBe(w2['3']!.inputs!.noise_seed)
  })

  it('sets filename prefix with WAN/ prefix based on inputImage', async () => {
    const workflow = await buildWanWorkflow(baseParams)
    expect(workflow['64']!.inputs!.filename_prefix).toBe('WAN/dragon-input')
  })

  it('strips image extension from filename prefix', async () => {
    const params: WanGenerationParams = { ...baseParams, inputImage: 'photo.jpeg' }
    const workflow = await buildWanWorkflow(params)
    expect(workflow['64']!.inputs!.filename_prefix).toBe('WAN/photo')
  })

  it('sets prompt in node 10', async () => {
    const workflow = await buildWanWorkflow(baseParams)
    expect(workflow['10']!.inputs!.text).toBe('a dragon flying through clouds')
  })

  it('sets start image in node 5', async () => {
    const workflow = await buildWanWorkflow(baseParams)
    expect(workflow['5']!.inputs!.image).toBe('dragon-input.png')
  })

  it('uses computed frame length in WanFirstLastFrameToVideo nodes when endImage provided', async () => {
    const params: WanGenerationParams = { ...baseParams, endImage: 'end.png' }
    const workflow = await buildWanWorkflow(params)
    expect(workflow['31']!.inputs!.length).toBe(81)
    expect(workflow['30']!.inputs!.length).toBe(81)
  })

  it('sets end image when provided', async () => {
    const params: WanGenerationParams = { ...baseParams, endImage: 'end.png' }
    const workflow = await buildWanWorkflow(params)
    expect(workflow['11']!.inputs!.image).toBe('end.png')
  })

  it('removes end image nodes when no end image', async () => {
    const workflow = await buildWanWorkflow(baseParams)
    expect(workflow['11']).toBeUndefined()
    expect(workflow['18']).toBeUndefined()
  })

  it('removes end_image from WanFirstLastFrameToVideo when no end image', async () => {
    const workflow = await buildWanWorkflow(baseParams)
    expect(workflow['30']!.inputs!.end_image).toBeUndefined()
    expect(workflow['31']!.inputs!.end_image).toBeUndefined()
  })

  describe('settings injection', () => {
    it('injects negative prompt into node 41', async () => {
      const workflow = await buildWanWorkflow(baseParams)
      expect(workflow['41']!.inputs!.text).toBe('test negative prompt')
    })

    it('injects NAG settings into both pass nodes', async () => {
      const workflow = await buildWanWorkflow(baseParams)
      expect(workflow['20']!.inputs!.nag_scale).toBe(5)
      expect(workflow['19']!.inputs!.nag_scale).toBe(5)
    })

    it('injects megapixels into resize node', async () => {
      const workflow = await buildWanWorkflow(baseParams)
      expect(workflow['25']!.inputs!.megapixels).toBe(0.5)
    })

    it('injects shift into both ModelSamplingSD3 nodes', async () => {
      const workflow = await buildWanWorkflow(baseParams)
      expect(workflow['32']!.inputs!.shift).toBe(5)
      expect(workflow['33']!.inputs!.shift).toBe(5)
    })

    it('injects settings into WanMoEScheduler node', async () => {
      const workflow = await buildWanWorkflow(baseParams)
      expect(workflow['70']!.inputs!.scheduler).toBe('beta')
      expect(workflow['70']!.inputs!.steps_high).toBe(3)
      expect(workflow['70']!.inputs!.steps_low).toBe(3)
      expect(workflow['70']!.inputs!.boundary).toBe(0.9)
      expect(workflow['70']!.inputs!.interval).toBe(0.01)
      expect(workflow['70']!.inputs!.denoise).toBe(1)
    })

    it('injects sampler into node 14', async () => {
      const workflow = await buildWanWorkflow(baseParams)
      expect(workflow['14']!.inputs!.sampler_name).toBe('euler')
    })

    it('injects frame length into WanFirstLastFrameToVideo nodes', async () => {
      const params: WanGenerationParams = { ...baseParams, endImage: 'end.png' }
      const workflow = await buildWanWorkflow(params)
      expect(workflow['31']!.inputs!.length).toBe(81)
      expect(workflow['30']!.inputs!.length).toBe(81)
    })
  })

  describe('post-processing', () => {
    it('includes ColorMatch node when enabled', async () => {
      const workflow = await buildWanWorkflow(baseParams)
      expect(workflow['74']).toBeDefined()
      expect(workflow['74']!.inputs!.method).toBe('mkl')
      expect(workflow['74']!.inputs!.strength).toBe(0.1)
      expect(workflow['74']!.inputs!.image_ref).toEqual(['5', 0])
    })

    it('removes ColorMatch node when disabled', async () => {
      const { getWanSettings } = await import('@/lib/database/system-settings')
      vi.mocked(getWanSettings).mockResolvedValueOnce({
        ...await getWanSettings(),
        colorMatchEnabled: false,
      })
      const workflow = await buildWanWorkflow(baseParams)
      expect(workflow['74']).toBeUndefined()
    })

    it('uses RIFE nodes when vfiMethod is rife', async () => {
      const workflow = await buildWanWorkflow(baseParams)
      expect(workflow['71']).toBeDefined()
      expect(workflow['72']).toBeDefined()
      expect(workflow['75']).toBeUndefined()
    })

    it('uses GMFSS node when vfiMethod is gmfss', async () => {
      const { getWanSettings } = await import('@/lib/database/system-settings')
      vi.mocked(getWanSettings).mockResolvedValueOnce({
        ...await getWanSettings(),
        vfiMethod: 'gmfss',
      })
      const workflow = await buildWanWorkflow(baseParams)
      expect(workflow['75']).toBeDefined()
      expect(workflow['75']!.inputs!.ckpt_name).toBe('test-gmfss-model.pth')
      expect(workflow['71']).toBeUndefined()
      expect(workflow['72']).toBeUndefined()
      expect(workflow['73']).toBeUndefined()
    })

    it('removes all VFI nodes when disabled', async () => {
      const { getWanSettings } = await import('@/lib/database/system-settings')
      vi.mocked(getWanSettings).mockResolvedValueOnce({
        ...await getWanSettings(),
        vfiEnabled: false,
      })
      const workflow = await buildWanWorkflow(baseParams)
      expect(workflow['71']).toBeUndefined()
      expect(workflow['72']).toBeUndefined()
      expect(workflow['73']).toBeUndefined()
      expect(workflow['75']).toBeUndefined()
    })

    it('includes CustomResolutionConfig when profile is custom', async () => {
      const workflow = await buildWanWorkflow(baseParams)
      expect(workflow['73']).toBeDefined()
      expect(workflow['73']!.inputs!.min_dim).toBe(704)
      expect(workflow['73']!.inputs!.opt_dim).toBe(960)
      expect(workflow['73']!.inputs!.max_dim).toBe(1280)
      expect(workflow['72']!.inputs!.custom_config).toEqual(['73', 0])
    })

    it('removes CustomResolutionConfig when profile is not custom', async () => {
      const { getWanSettings } = await import('@/lib/database/system-settings')
      vi.mocked(getWanSettings).mockResolvedValueOnce({
        ...await getWanSettings(),
        rifeResolutionProfile: '720p',
      })
      const workflow = await buildWanWorkflow(baseParams)
      expect(workflow['73']).toBeUndefined()
    })

    it('includes RTX node when enabled', async () => {
      const workflow = await buildWanWorkflow(baseParams)
      expect(workflow['42']).toBeDefined()
      expect(workflow['42']!.inputs!.quality).toBe('ULTRA')
    })

    it('removes RTX node when disabled', async () => {
      const { getWanSettings } = await import('@/lib/database/system-settings')
      vi.mocked(getWanSettings).mockResolvedValueOnce({
        ...await getWanSettings(),
        rtxEnabled: false,
      })
      const workflow = await buildWanWorkflow(baseParams)
      expect(workflow['42']).toBeUndefined()
    })

    it('wires full chain: ColorMatch → RIFE → VRAM_DEBUG → RTX', async () => {
      const workflow = await buildWanWorkflow(baseParams)
      expect(workflow['74']!.inputs!.image_target).toEqual(['38', 0])
      expect(workflow['71']!.inputs!.frames).toEqual(['74', 0])
      expect(workflow['45']!.inputs!.anything).toEqual(['71', 0])
      expect(workflow['42']!.inputs!.images).toEqual(['45', 0])
    })

    it('wires GMFSS chain when vfiMethod is gmfss', async () => {
      const { getWanSettings } = await import('@/lib/database/system-settings')
      vi.mocked(getWanSettings).mockResolvedValueOnce({
        ...await getWanSettings(),
        vfiMethod: 'gmfss',
      })
      const workflow = await buildWanWorkflow(baseParams)
      expect(workflow['75']!.inputs!.frames).toEqual(['74', 0])
      expect(workflow['45']!.inputs!.anything).toEqual(['75', 0])
    })

    it('wires Video Combine to VRAM_DEBUG_VFI when RTX disabled', async () => {
      const { getWanSettings } = await import('@/lib/database/system-settings')
      vi.mocked(getWanSettings).mockResolvedValueOnce({
        ...await getWanSettings(),
        rtxEnabled: false,
      })
      const workflow = await buildWanWorkflow(baseParams)
      expect(workflow['64']!.inputs!.images).toEqual(['45', 0])
    })

    it('bypasses ColorMatch and VFI when both disabled', async () => {
      const { getWanSettings } = await import('@/lib/database/system-settings')
      vi.mocked(getWanSettings).mockResolvedValueOnce({
        ...await getWanSettings(),
        colorMatchEnabled: false,
        vfiEnabled: false,
      })
      const workflow = await buildWanWorkflow(baseParams)
      expect(workflow['74']).toBeUndefined()
      expect(workflow['71']).toBeUndefined()
      expect(workflow['45']!.inputs!.anything).toEqual(['38', 0])
    })
  })

  describe('structural integrity', () => {
    it('preserves all critical nodes in start-only mode', async () => {
      const workflow = await buildWanWorkflow(baseParams)
      const criticalNodes = ['1', '2', '3', '5', '10', '13', '14', '20', '25', '26', '30', '31', '32', '33', '41', '42', '64', '70']
      for (const nodeId of criticalNodes) {
        expect(workflow[nodeId], `node ${nodeId} should exist`).toBeDefined()
      }
    })

    it('preserves end image nodes in start+end mode', async () => {
      const params: WanGenerationParams = { ...baseParams, endImage: 'end.png' }
      const workflow = await buildWanWorkflow(params)
      expect(workflow['11']).toBeDefined()
      expect(workflow['18']).toBeDefined()
    })
  })
})
