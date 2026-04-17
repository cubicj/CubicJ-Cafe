import type { GenerationJob } from '@/types'
import type { WsExecutedData, WsExecutionErrorData } from '@/lib/comfyui/client-types'

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

const mockUpdateRequest = vi.fn()
const mockGetRequestById = vi.fn()
vi.mock('@/lib/database/queue', () => ({
  QueueService: {
    updateRequest: (...args: unknown[]) => mockUpdateRequest(...args),
    getRequestById: (...args: unknown[]) => mockGetRequestById(...args),
  },
}))

vi.mock('@prisma/client', () => ({
  QueueStatus: {
    COMPLETED: 'COMPLETED',
    COMPLETED_WITH_ERROR: 'COMPLETED_WITH_ERROR',
    FAILED: 'FAILED',
    CANCELLED: 'CANCELLED',
  },
}))

const mockUpdateJob = vi.fn()
vi.mock('@/lib/generation-store', () => ({
  generationStore: { updateJob: (...args: unknown[]) => mockUpdateJob(...args) },
}))

const mockReleaseServerJob = vi.fn()
vi.mock('@/lib/comfyui/queue-monitor', () => ({
  queueMonitor: { releaseServerJob: (...args: unknown[]) => mockReleaseServerJob(...args) },
}))

const mockSendVideoToDiscord = vi.fn()
vi.mock('@/lib/comfyui/video-result-sender', () => ({
  sendVideoToDiscord: (...args: unknown[]) => mockSendVideoToDiscord(...args),
}))

const mockOnExecuted = vi.fn()
const mockOnExecutionError = vi.fn()
const mockRemoveCallbacks = vi.fn()
const mockGetServerById = vi.fn()
const mockGetClient = vi.fn()
vi.mock('@/lib/comfyui/server-manager', () => ({
  serverManager: {
    getServerById: (...args: unknown[]) => mockGetServerById(...args),
    getClient: (...args: unknown[]) => mockGetClient(...args),
  },
}))

describe('ComfyUIJobMonitor', () => {
  let jobMonitor: typeof import('@/lib/comfyui/job-monitor')['jobMonitor']

  const baseJob: GenerationJob = {
    id: 'job-1',
    userId: '1',
    promptId: 'prompt-1',
    prompt: 'test prompt',
    status: 'processing',
    createdAt: new Date(),
    updatedAt: new Date(),
    isNSFW: false,
    videoModel: 'wan',
    userInfo: { name: 'TestUser' },
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    vi.useFakeTimers()

    mockGetRequestById.mockResolvedValue({ serverId: 'local', status: 'PROCESSING' })
    mockGetServerById.mockReturnValue({ id: 'local', url: 'http://127.0.0.1:8188' })
    mockGetClient.mockReturnValue({
      onExecuted: mockOnExecuted,
      onExecutionError: mockOnExecutionError,
      removeCallbacks: mockRemoveCallbacks,
      isWebSocketConnected: () => true,
    })
    mockUpdateRequest.mockResolvedValue(undefined)
    mockSendVideoToDiscord.mockResolvedValue(undefined)

    const module = await import('@/lib/comfyui/job-monitor')
    jobMonitor = module.jobMonitor
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('registers WebSocket callbacks on startMonitoring', async () => {
    await jobMonitor.startMonitoring(baseJob)

    expect(mockOnExecuted).toHaveBeenCalledWith('prompt-1', expect.any(Function))
    expect(mockOnExecutionError).toHaveBeenCalledWith('prompt-1', expect.any(Function))
  })

  it('skips monitoring if no promptId', async () => {
    await jobMonitor.startMonitoring({ ...baseJob, promptId: undefined })
    expect(mockOnExecuted).not.toHaveBeenCalled()
  })

  it('prevents duplicate monitoring for same promptId', async () => {
    await jobMonitor.startMonitoring(baseJob)
    await jobMonitor.startMonitoring(baseJob)
    expect(mockOnExecuted).toHaveBeenCalledTimes(1)
  })

  it('handles executed callback with gifs output', async () => {
    await jobMonitor.startMonitoring(baseJob)

    const executedCallback = mockOnExecuted.mock.calls[0][1]
    const eventData: WsExecutedData = {
      node: '64',
      output: { gifs: [{ filename: 'test.mp4', subfolder: 'wan', type: 'temp' }] },
      prompt_id: 'prompt-1',
    }

    await executedCallback(eventData)

    expect(mockUpdateRequest).toHaveBeenCalledWith('job-1', expect.objectContaining({ status: 'COMPLETED' }))
    expect(mockSendVideoToDiscord).toHaveBeenCalledWith(baseJob, { filename: 'test.mp4', subfolder: 'wan', type: 'temp' })
    expect(mockReleaseServerJob).toHaveBeenCalledWith('job-1')
    expect(mockRemoveCallbacks).toHaveBeenCalledWith('prompt-1')
  })

  it('ignores executed callback without gifs output (non-video node)', async () => {
    await jobMonitor.startMonitoring(baseJob)

    const executedCallback = mockOnExecuted.mock.calls[0][1]
    const eventData: WsExecutedData = {
      node: '10',
      output: {},
      prompt_id: 'prompt-1',
    }

    await executedCallback(eventData)

    expect(mockUpdateRequest).not.toHaveBeenCalled()
    expect(mockSendVideoToDiscord).not.toHaveBeenCalled()
  })

  it('handles execution_error callback', async () => {
    await jobMonitor.startMonitoring(baseJob)

    const errorCallback = mockOnExecutionError.mock.calls[0][1]
    const errorData: WsExecutionErrorData = {
      prompt_id: 'prompt-1',
      node_id: '64',
      node_type: 'VHS_VideoCombine',
      exception_message: 'OOM',
      exception_type: 'RuntimeError',
    }

    await errorCallback(errorData)

    expect(mockUpdateRequest).toHaveBeenCalledWith('job-1', expect.objectContaining({ status: 'FAILED' }))
    expect(mockReleaseServerJob).toHaveBeenCalledWith('job-1')
    expect(mockRemoveCallbacks).toHaveBeenCalledWith('prompt-1')
  })

  it('skips handling if job is cancelled', async () => {
    mockGetRequestById.mockResolvedValue({ serverId: 'local', status: 'CANCELLED' })
    await jobMonitor.startMonitoring(baseJob)

    const executedCallback = mockOnExecuted.mock.calls[0][1]
    await executedCallback({
      node: '64',
      output: { gifs: [{ filename: 'test.mp4', subfolder: 'wan', type: 'temp' }] },
      prompt_id: 'prompt-1',
    })

    expect(mockReleaseServerJob).toHaveBeenCalledWith('job-1')
    expect(mockRemoveCallbacks).toHaveBeenCalledWith('prompt-1')
    expect(mockSendVideoToDiscord).not.toHaveBeenCalled()
  })

  it('fails job on timeout', async () => {
    await jobMonitor.startMonitoring(baseJob)

    await vi.advanceTimersByTimeAsync(30 * 60 * 1000)

    expect(mockUpdateRequest).toHaveBeenCalledWith('job-1', expect.objectContaining({ status: 'FAILED' }))
    expect(mockRemoveCallbacks).toHaveBeenCalledWith('prompt-1')
  })

  it('marks COMPLETED_WITH_ERROR when Discord send fails', async () => {
    mockSendVideoToDiscord.mockRejectedValue(new Error('Discord error'))
    await jobMonitor.startMonitoring(baseJob)

    const executedCallback = mockOnExecuted.mock.calls[0][1]
    await executedCallback({
      node: '64',
      output: { gifs: [{ filename: 'test.mp4', subfolder: 'wan', type: 'temp' }] },
      prompt_id: 'prompt-1',
    })

    expect(mockUpdateRequest).toHaveBeenCalledTimes(2)
    const secondCall = mockUpdateRequest.mock.calls[1]
    expect(secondCall[1]).toEqual(expect.objectContaining({ status: 'COMPLETED_WITH_ERROR' }))
  })
})
