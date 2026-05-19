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

describe('QueueMonitor LTXA params', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBuildWorkflow.mockResolvedValue({ prompt: { class_type: 'TestNode', inputs: {} } })
    mockUpdateRequest.mockResolvedValue(undefined)
    mockClearImageBlobs.mockResolvedValue(undefined)
    mockStartMonitoring.mockResolvedValue(undefined)
  })

  it('passes request isNSFW to LTXA workflow params', async () => {
    mockGetRequestById.mockResolvedValue({
      id: 'request-1',
      userId: 1,
      prompt: 'fake prompt',
      imageFile: 'fake-start.png',
      imageBlob: new Uint8Array([1, 2, 3]),
      endImageFile: null,
      endImageBlob: null,
      audioFile: null,
      audioBlob: null,
      loraPresetData: null,
      isNSFW: true,
      videoModel: 'ltxa',
      videoDuration: 4,
      user: {
        nickname: 'Tester',
        avatar: null,
        discordId: 'discord-1',
      },
    })

    const client = {
      uploadImage: vi.fn().mockResolvedValue('uploaded-start.png'),
      uploadAudio: vi.fn(),
      submitPrompt: vi.fn().mockResolvedValue({ prompt_id: 'prompt-1' }),
    }

    const { queueMonitor } = await import('@/lib/comfyui/queue-monitor')
    await queueMonitor.processQueueRequestWithServer('request-1', {
      client: client as never,
      name: 'Local',
      type: 'local',
      url: 'http://127.0.0.1:8188',
    })

    expect(mockBuildWorkflow).toHaveBeenCalledWith(expect.objectContaining({
      model: 'ltxa',
      isNSFW: true,
      inputImage: 'uploaded-start.png',
    }))
  })
})
