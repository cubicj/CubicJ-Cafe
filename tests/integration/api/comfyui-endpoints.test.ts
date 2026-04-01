import { vi } from 'vitest'
import { buildRequest, noContext } from '../../helpers/auth'

vi.mock('@/lib/comfyui/comfyui-state', () => ({
  isComfyUIEnabled: vi.fn(() => true),
}))

const mockGetSamplerList = vi.fn(() => Promise.resolve(['euler', 'dpmpp_2m']))
const mockGetModelList = vi.fn(() => Promise.resolve({
  diffusionModels: ['model1.safetensors'],
  textEncoders: ['enc1.safetensors'],
  vaes: ['vae1.safetensors'],
  upscaleModels: [],
  clipVisions: [],
  ggufClips: [],
  clipEmbeddings: [],
  kjVaes: [],
  latentUpscalers: [],
  rifeModels: [],
}))

vi.mock('@/lib/comfyui/client', () => {
  const MockClient = function(this: Record<string, unknown>) {
    this.getSamplerList = mockGetSamplerList
    this.getModelList = mockGetModelList
  }
  return { ComfyUIClient: MockClient }
})

vi.mock('@/lib/comfyui/server-manager', () => ({
  serverManager: {
    checkServerHealth: vi.fn(() => Promise.resolve()),
    selectBestServer: vi.fn(() => ({ id: 'local', type: 'local', url: 'http://127.0.0.1:8188', healthy: true })),
    getClient: vi.fn(() => ({
      getLoRAList: vi.fn(() => Promise.resolve(['WAN\\High\\lora1.safetensors', 'WAN\\Low\\lora2.safetensors'])),
    })),
  },
}))

import { GET as getSamplers } from '@/app/api/comfyui/samplers/route'
import { GET as getModels } from '@/app/api/comfyui/models/route'
import { GET as getLoras } from '@/app/api/comfyui/loras/route'
import { isComfyUIEnabled } from '@/lib/comfyui/comfyui-state'
import { serverManager } from '@/lib/comfyui/server-manager'

beforeEach(() => {
  vi.mocked(isComfyUIEnabled).mockReturnValue(true)
  mockGetSamplerList.mockReset().mockResolvedValue(['euler', 'dpmpp_2m'])
  mockGetModelList.mockReset().mockResolvedValue({
    diffusionModels: ['model1.safetensors'],
    textEncoders: ['enc1.safetensors'],
    vaes: ['vae1.safetensors'],
    upscaleModels: [],
    clipVisions: [],
    ggufClips: [],
    clipEmbeddings: [],
    kjVaes: [],
    latentUpscalers: [],
    rifeModels: [],
  })
  vi.mocked(serverManager.selectBestServer).mockReturnValue(
    { id: 'local', type: 'local', url: 'http://127.0.0.1:8188', healthy: true } as any
  )
  vi.mocked(serverManager.getClient).mockReturnValue({
    getLoRAList: vi.fn(() => Promise.resolve(['WAN\\High\\lora1.safetensors', 'WAN\\Low\\lora2.safetensors'])),
  } as any)
})

describe('GET /api/comfyui/samplers', () => {
  it('returns samplers when enabled', async () => {
    const res = await getSamplers(buildRequest('/api/comfyui/samplers'), noContext)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.samplers).toEqual(['euler', 'dpmpp_2m'])
  })

  it('returns empty with enabled:false when disabled', async () => {
    vi.mocked(isComfyUIEnabled).mockReturnValue(false)

    const res = await getSamplers(buildRequest('/api/comfyui/samplers'), noContext)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.enabled).toBe(false)
    expect(body.samplers).toEqual([])
  })

  it('returns 503 on connection error', async () => {
    mockGetSamplerList.mockRejectedValue(new Error('Connection refused'))

    const res = await getSamplers(buildRequest('/api/comfyui/samplers'), noContext)
    const body = await res.json()

    expect(res.status).toBe(503)
    expect(body.error).toBeDefined()
    expect(body.samplers).toEqual([])
  })
})

describe('GET /api/comfyui/models', () => {
  it('returns models when enabled', async () => {
    const res = await getModels(buildRequest('/api/comfyui/models'), noContext)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.models.diffusionModels).toEqual(['model1.safetensors'])
    expect(body.models.textEncoders).toEqual(['enc1.safetensors'])
    expect(body.models.vaes).toEqual(['vae1.safetensors'])
  })

  it('returns empty models structure when disabled', async () => {
    vi.mocked(isComfyUIEnabled).mockReturnValue(false)

    const res = await getModels(buildRequest('/api/comfyui/models'), noContext)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.enabled).toBe(false)
    expect(body.models.diffusionModels).toEqual([])
    expect(body.models.textEncoders).toEqual([])
    expect(body.models.vaes).toEqual([])
  })

  it('returns 503 on connection error', async () => {
    mockGetModelList.mockRejectedValue(new Error('Connection refused'))

    const res = await getModels(buildRequest('/api/comfyui/models'), noContext)
    const body = await res.json()

    expect(res.status).toBe(503)
    expect(body.error).toBeDefined()
    expect(body.models.diffusionModels).toEqual([])
  })
})

describe('GET /api/comfyui/loras', () => {
  it('returns loras with categorization for WAN model', async () => {
    const res = await getLoras(buildRequest('/api/comfyui/loras?model=wan'), noContext)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.loras).toEqual(['WAN\\High\\lora1.safetensors', 'WAN\\Low\\lora2.safetensors'])
    expect(body.count).toBe(2)
    expect(body.categorized.high).toEqual(['WAN\\High\\lora1.safetensors'])
    expect(body.categorized.low).toEqual(['WAN\\Low\\lora2.safetensors'])
    expect(body.categorized.safetensors).toEqual(['WAN\\High\\lora1.safetensors', 'WAN\\Low\\lora2.safetensors'])
    expect(body.serverInfo.id).toBe('local')
  })

  it('returns enabled:false response when disabled', async () => {
    vi.mocked(isComfyUIEnabled).mockReturnValue(false)

    const res = await getLoras(buildRequest('/api/comfyui/loras'), noContext)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.enabled).toBe(false)
    expect(body.loras).toEqual([])
    expect(body.count).toBe(0)
  })

  it('returns 503 when no server available', async () => {
    vi.mocked(serverManager.selectBestServer).mockReturnValue(null as any)

    const res = await getLoras(buildRequest('/api/comfyui/loras'), noContext)
    const body = await res.json()

    expect(res.status).toBe(503)
    expect(body.error).toBeDefined()
    expect(body.loras).toEqual([])
  })

  it('passes model query param correctly', async () => {
    const mockGetLoRAList = vi.fn(() => Promise.resolve([]))
    vi.mocked(serverManager.getClient).mockReturnValue({
      getLoRAList: mockGetLoRAList,
    } as any)

    await getLoras(buildRequest('/api/comfyui/loras?model=ltx'), noContext)

    expect(mockGetLoRAList).toHaveBeenCalledWith('ltx')
  })
})
