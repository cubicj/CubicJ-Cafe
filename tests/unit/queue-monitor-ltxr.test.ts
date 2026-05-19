export {}

const mockGetRequestById = vi.fn()
const mockUpdateRequest = vi.fn()
const mockClearImageBlobs = vi.fn()

vi.mock('@/lib/database/queue', () => ({
  QueueService: {
    getRequestById: (...args: unknown[]) => mockGetRequestById(...args),
    updateRequest: (...args: unknown[]) => mockUpdateRequest(...args),
    clearImageBlobs: (...args: unknown[]) => mockClearImageBlobs(...args),
    invalidateCache: vi.fn(),
  },
}))

vi.mock('@prisma/client', () => ({
  QueueStatus: {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    FAILED: 'FAILED',
  },
}))

vi.mock('@/lib/database/ops-settings', () => ({
  getOpsSetting: () => 1800000,
}))

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

vi.mock('@/lib/comfyui/comfyui-state', () => ({
  isComfyUIEnabled: () => true,
}))

vi.mock('@/lib/comfyui/queue-pause-state', () => ({
  getQueuePauseAfterPosition: () => null,
}))

vi.mock('@/lib/comfyui/server-manager', () => ({
  serverManager: {
    getServerById: vi.fn(),
    getServerStats: () => ({ servers: [] }),
    getClient: vi.fn(),
    checkServerHealth: vi.fn(),
    selectBestServer: vi.fn(),
  },
}))

const mockGetLtxrSettings = vi.fn()
vi.mock('@/lib/database/system-settings', () => ({
  getLtxrSettings: (...args: unknown[]) => mockGetLtxrSettings(...args),
}))

const mockGetWatermarkAssetBlob = vi.fn()
vi.mock('@/lib/database/watermark-assets', () => ({
  getWatermarkAssetBlob: (...args: unknown[]) => mockGetWatermarkAssetBlob(...args),
}))

const mockBuildWorkflow = vi.fn()
vi.mock('@/lib/comfyui/workflow-router', () => ({
  buildWorkflow: (...args: unknown[]) => mockBuildWorkflow(...args),
}))

const mockStartMonitoring = vi.fn()
vi.mock('@/lib/comfyui/job-monitor', () => ({
  jobMonitor: {
    startMonitoring: (...args: unknown[]) => mockStartMonitoring(...args),
  },
}))

function mockLtxrSettings(overrides: Record<string, unknown> = {}) {
  mockGetLtxrSettings.mockResolvedValue({
    watermarkEnabled: false,
    watermarkImageAssetId: null,
    watermarkPosition: 'center',
    watermarkScale: 80,
    watermarkTransparency: 50,
    ...overrides,
  })
}

describe('QueueMonitor LTXR params', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBuildWorkflow.mockResolvedValue({ prompt: { class_type: 'TestNode', inputs: {} } })
    mockUpdateRequest.mockResolvedValue(undefined)
    mockClearImageBlobs.mockResolvedValue(undefined)
    mockStartMonitoring.mockResolvedValue(undefined)
    mockLtxrSettings()
  })

  it('forces SFW params for LTXR workflow requests', async () => {
    mockGetRequestById.mockResolvedValue({
      id: 'request-ltxr-1',
      userId: 1,
      prompt: 'fake prompt',
      imageFile: 'fake-start.png',
      imageBlob: new Uint8Array([1, 2, 3]),
      endImageFile: null,
      endImageBlob: null,
      audioFile: 'fake-audio.wav',
      audioBlob: new Uint8Array([4, 5, 6]),
      loraPresetData: null,
      isNSFW: true,
      videoModel: 'ltxr',
      videoDuration: 5,
      user: {
        nickname: 'Tester',
        avatar: null,
        discordId: 'discord-1',
      },
    })

    const client = {
      uploadImage: vi.fn().mockResolvedValue('uploaded-start.png'),
      uploadAudio: vi.fn().mockResolvedValue('uploaded-audio.wav'),
      submitPrompt: vi.fn().mockResolvedValue({ prompt_id: 'prompt-1' }),
    }

    const { queueMonitor } = await import('@/lib/comfyui/queue-monitor')
    await queueMonitor.processQueueRequestWithServer('request-ltxr-1', {
      client: client as never,
      name: 'Local',
      type: 'local',
      url: 'http://127.0.0.1:8188',
    })

    expect(mockBuildWorkflow).toHaveBeenCalledWith(expect.objectContaining({
      model: 'ltxr',
      isNSFW: false,
      inputImage: 'uploaded-start.png',
      referenceAudio: 'uploaded-audio.wav',
    }))
    expect(mockStartMonitoring).toHaveBeenCalledWith(expect.objectContaining({
      id: 'request-ltxr-1',
      isNSFW: false,
      videoModel: 'ltxr',
    }))
  })

  it('uploads configured LTXR watermark asset and passes it to workflow params', async () => {
    mockLtxrSettings({
      watermarkEnabled: true,
      watermarkImageAssetId: 'watermark-asset-1',
    })
    mockGetWatermarkAssetBlob.mockResolvedValue({
      filename: 'fake-watermark.png',
      mimeType: 'image/png',
      imageBlob: new Uint8Array([9, 8, 7]),
    })
    mockGetRequestById.mockResolvedValue({
      id: 'request-ltxr-2',
      userId: 1,
      prompt: 'fake prompt',
      imageFile: 'fake-start.png',
      imageBlob: new Uint8Array([1, 2, 3]),
      endImageFile: null,
      endImageBlob: null,
      audioFile: null,
      audioBlob: null,
      loraPresetData: null,
      isNSFW: false,
      videoModel: 'ltxr',
      videoDuration: 5,
      user: {
        nickname: 'Tester',
        avatar: null,
        discordId: 'discord-1',
      },
    })

    const client = {
      uploadImage: vi.fn()
        .mockResolvedValueOnce('uploaded-start.png')
        .mockResolvedValueOnce('uploaded-watermark.png'),
      uploadAudio: vi.fn(),
      submitPrompt: vi.fn().mockResolvedValue({ prompt_id: 'prompt-2' }),
    }

    const { queueMonitor } = await import('@/lib/comfyui/queue-monitor')
    await queueMonitor.processQueueRequestWithServer('request-ltxr-2', {
      client: client as never,
      name: 'Local',
      type: 'local',
      url: 'http://127.0.0.1:8188',
    })

    expect(mockGetWatermarkAssetBlob).toHaveBeenCalledWith('watermark-asset-1')
    expect(client.uploadImage).toHaveBeenCalledTimes(2)
    expect(client.uploadImage).toHaveBeenNthCalledWith(2, expect.objectContaining({
      name: 'fake-watermark.png',
      type: 'image/png',
    }))
    expect(mockBuildWorkflow).toHaveBeenCalledWith(expect.objectContaining({
      model: 'ltxr',
      inputImage: 'uploaded-start.png',
      watermarkImage: 'uploaded-watermark.png',
    }))
  })
})
