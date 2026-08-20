import { vi } from 'vitest'

const mockGetProcessingCount = vi.fn().mockResolvedValue(0)
const mockGetRequestById = vi.fn()
const mockUpdateRequest = vi.fn()
const mockClearImageBlobs = vi.fn()
vi.mock('@/lib/database/queue', () => ({
  QueueService: {
    getProcessingCount: (...args: unknown[]) => mockGetProcessingCount(...args),
    getRequestById: (...args: unknown[]) => mockGetRequestById(...args),
    updateRequest: (...args: unknown[]) => mockUpdateRequest(...args),
    clearImageBlobs: (...args: unknown[]) => mockClearImageBlobs(...args),
  },
}))

vi.mock('@/lib/comfyui/comfyui-state', () => ({
  isComfyUIEnabled: () => true,
}))

vi.mock('@/lib/comfyui/queue-pause-state', () => ({
  getQueuePauseAfterPosition: () => null,
}))

const mockStartMonitoring = vi.fn()
vi.mock('@/lib/comfyui/job-monitor', () => ({
  jobMonitor: { startMonitoring: (...args: unknown[]) => mockStartMonitoring(...args) },
}))

const mockPrepareGenerationParams = vi.fn()
vi.mock('@/lib/comfyui/workflows/prepare-params', () => ({
  prepareGenerationParams: (...args: unknown[]) => mockPrepareGenerationParams(...args),
}))

const mockBuildWorkflow = vi.fn()
vi.mock('@/lib/comfyui/workflow-router', () => ({
  buildWorkflow: (...args: unknown[]) => mockBuildWorkflow(...args),
}))

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

const mockUpdateActiveServers = vi.fn().mockResolvedValue(undefined)
const mockSetSlotReleasedListener = vi.fn()
const mockEnableStreaming = vi.fn()
const mockDisableStreaming = vi.fn()
const mockReleaseServer = vi.fn()
const activeServers = [
  {
    id: 'runpod-0',
    client: {},
    name: 'Runpod runpod-0',
    type: 'runpod',
    url: 'https://runpod.example.test',
  },
]

vi.mock('@/lib/comfyui/server-manager', () => ({
  serverManager: {
    setSlotReleasedListener: (...args: unknown[]) => mockSetSlotReleasedListener(...args),
    enableStreaming: (...args: unknown[]) => mockEnableStreaming(...args),
    disableStreaming: (...args: unknown[]) => mockDisableStreaming(...args),
    updateActiveServers: (...args: unknown[]) => mockUpdateActiveServers(...args),
    getMaxConcurrentProcessing: () => 1,
    getAvailableServerCount: () => 0,
    getActiveServers: () => activeServers,
    releaseServer: (...args: unknown[]) => mockReleaseServer(...args),
  },
}))

describe('QueueMonitor orchestration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockUpdateRequest.mockResolvedValue(undefined)
    mockClearImageBlobs.mockResolvedValue(undefined)
    mockStartMonitoring.mockResolvedValue(undefined)
    mockBuildWorkflow.mockResolvedValue({ fake: { class_type: 'FakeNode', inputs: {} } })
    mockPrepareGenerationParams.mockImplementation(async (model, input) => ({ model, ...(input as object) }))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('wires slot release processing and streaming lifecycle on start and stop', async () => {
    const { queueMonitor } = await import('@/lib/comfyui/queue-monitor')

    queueMonitor.start()
    await vi.waitFor(() => expect(mockUpdateActiveServers).toHaveBeenCalledOnce())

    const slotReleasedListener = mockSetSlotReleasedListener.mock.calls[0][0]
    mockUpdateActiveServers.mockClear()
    slotReleasedListener()
    await vi.waitFor(() => expect(mockUpdateActiveServers).toHaveBeenCalledOnce())

    queueMonitor.stop()
    expect(mockEnableStreaming).toHaveBeenCalledOnce()
    expect(mockDisableStreaming).toHaveBeenCalledOnce()
  })

  it('keeps the queue status response shape unchanged', async () => {
    const { queueMonitor } = await import('@/lib/comfyui/queue-monitor')

    expect(queueMonitor.getStatus()).toEqual({
      running: false,
      checkInterval: 5000,
      activeServers: 1,
      currentlyProcessing: 0,
      maxConcurrent: 1,
      serverDetails: [{ name: 'Runpod runpod-0', type: 'runpod' }],
    })
  })

  it('processes an h3-fl2va request with only an end image blob', async () => {
    mockGetRequestById.mockResolvedValue({
      id: 'fake-h3-end-only',
      userId: 41,
      nickname: 'Fake User',
      prompt: 'fake end-only prompt',
      imageFile: null,
      imageBlob: null,
      endImageFile: 'fake-end.png',
      endImageBlob: new Uint8Array([7, 4, 2]),
      audioFile: null,
      audioBlob: null,
      loraPresetData: null,
      isNSFW: false,
      videoModel: 'h3-fl2va',
      videoDuration: 5,
      user: {
        nickname: 'Fake User',
        avatar: null,
        discordId: 'fake-discord-id',
      },
    })
    const client = {
      uploadImage: vi.fn().mockResolvedValue('uploaded-fake-end.png'),
      uploadAudio: vi.fn(),
      submitPrompt: vi.fn().mockResolvedValue({ prompt_id: 'fake-prompt-id' }),
    }
    const { queueMonitor } = await import('@/lib/comfyui/queue-monitor')

    await expect(queueMonitor.processQueueRequestWithServer('fake-h3-end-only', {
      id: 'fake-server-h3',
      client: client as never,
      name: 'Fake H3 Server',
      type: 'local',
      url: 'https://h3.example.test',
    })).resolves.toBeUndefined()

    expect(client.uploadImage).toHaveBeenCalledWith(expect.objectContaining({ name: 'fake-end.png' }))
    expect(mockPrepareGenerationParams).toHaveBeenCalledWith('h3-fl2va', expect.objectContaining({
      inputImage: undefined,
      endImage: 'uploaded-fake-end.png',
    }))
  })

  it('records the missing image data error for a legacy model request', async () => {
    mockGetRequestById.mockResolvedValue({
      id: 'fake-wan-missing-image',
      userId: 42,
      nickname: 'Fake User',
      prompt: 'fake legacy prompt',
      imageFile: 'fake-start.png',
      imageBlob: null,
      endImageFile: null,
      endImageBlob: null,
      audioFile: null,
      audioBlob: null,
      loraPresetData: null,
      isNSFW: false,
      videoModel: 'wan',
      videoDuration: 5,
      user: {
        nickname: 'Fake User',
        avatar: null,
        discordId: 'fake-discord-id',
      },
    })
    const client = {
      uploadImage: vi.fn(),
      uploadAudio: vi.fn(),
      submitPrompt: vi.fn(),
    }
    const { queueMonitor } = await import('@/lib/comfyui/queue-monitor')

    await queueMonitor.processQueueRequestWithServer('fake-wan-missing-image', {
      id: 'fake-server-wan',
      client: client as never,
      name: 'Fake WAN Server',
      type: 'local',
      url: 'https://wan.example.test',
    })

    expect(mockPrepareGenerationParams).not.toHaveBeenCalled()
    expect(mockUpdateRequest).toHaveBeenCalledWith('fake-wan-missing-image', expect.objectContaining({
      status: 'FAILED',
      error: '이미지 데이터가 없습니다.',
    }))
  })
})
