import { vi } from 'vitest'

const mockGetProcessingCount = vi.fn().mockResolvedValue(0)
vi.mock('@/lib/database/queue', () => ({
  QueueService: {
    getProcessingCount: (...args: unknown[]) => mockGetProcessingCount(...args),
  },
}))

vi.mock('@/lib/comfyui/comfyui-state', () => ({
  isComfyUIEnabled: () => true,
}))

vi.mock('@/lib/comfyui/queue-pause-state', () => ({
  getQueuePauseAfterPosition: () => null,
}))

vi.mock('@/lib/comfyui/job-monitor', () => ({
  jobMonitor: { startMonitoring: vi.fn() },
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
  },
}))

describe('QueueMonitor orchestration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
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
})
