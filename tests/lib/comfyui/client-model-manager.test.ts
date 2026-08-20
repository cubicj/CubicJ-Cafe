import { ComfyUIModelManager } from '@/lib/comfyui/client-model-manager'

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

describe('ComfyUIModelManager', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reuses one Runpod scan for LoRA data and path normalization', async () => {
    const checkActiveRunpodServers = vi.fn().mockResolvedValue(['https://fake.runpod.test'])
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      LoraLoader: {
        input: {
          required: {
            lora_name: [['WAN\\High\\fake.safetensors']],
          },
        },
      },
    }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const manager = new ComfyUIModelManager(
      'http://127.0.0.1:8188',
      10000,
      false,
      { checkActiveRunpodServers },
    )

    await expect(manager.getLoRAList('wan')).resolves.toEqual([
      'WAN/High/fake.safetensors',
    ])
    expect(checkActiveRunpodServers).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
