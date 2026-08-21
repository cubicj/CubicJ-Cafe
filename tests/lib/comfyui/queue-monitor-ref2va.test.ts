export {}

const mockGetRequestById = vi.fn()
const mockGetRequestStatus = vi.fn()
const mockGetReferenceFileRows = vi.fn()
const mockGetReferenceFileBlob = vi.fn()
const mockUpdateRequest = vi.fn()
const mockMarkRequestFailedIfProcessing = vi.fn()
const mockClearImageBlobs = vi.fn()
const mockReleaseServer = vi.fn()

vi.mock('@/lib/database/queue', () => ({
  QueueService: {
    getRequestById: (...args: unknown[]) => mockGetRequestById(...args),
    getRequestStatus: (...args: unknown[]) => mockGetRequestStatus(...args),
    getReferenceFileRows: (...args: unknown[]) => mockGetReferenceFileRows(...args),
    getReferenceFileBlob: (...args: unknown[]) => mockGetReferenceFileBlob(...args),
    updateRequest: (...args: unknown[]) => mockUpdateRequest(...args),
    markRequestFailedIfProcessing: (...args: unknown[]) => mockMarkRequestFailedIfProcessing(...args),
    clearImageBlobs: (...args: unknown[]) => mockClearImageBlobs(...args),
    invalidateCache: vi.fn(),
  },
}))

vi.mock('@prisma/client', () => ({
  QueueStatus: {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    FAILED: 'FAILED',
    CANCELLED: 'CANCELLED',
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
    releaseServer: (...args: unknown[]) => mockReleaseServer(...args),
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

function makeRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: 'request-ref2va-1',
    userId: 1,
    prompt: 'fake reference prompt',
    imageFile: null,
    imageBlob: null,
    endImageFile: null,
    endImageBlob: null,
    audioFile: null,
    audioBlob: null,
    loraPresetData: null,
    isNSFW: false,
    videoModel: 'h3-ref2va',
    videoDuration: 7,
    resolutionMode: 'custom',
    aspectWidth: 16,
    aspectHeight: 9,
    user: {
      nickname: 'Tester',
      avatar: null,
      discordId: 'discord-1',
    },
    ...overrides,
  }
}

function makeClient() {
  return {
    uploadImage: vi.fn().mockResolvedValue('up_img.png'),
    uploadVideo: vi.fn().mockResolvedValue('up_vid.mp4'),
    uploadAudio: vi.fn().mockResolvedValue('up_aud.wav'),
    submitPrompt: vi.fn().mockResolvedValue({ prompt_id: 'prompt-r1' }),
  }
}

async function processRequest(requestId: string, client: ReturnType<typeof makeClient>) {
  const { queueMonitor } = await import('@/lib/comfyui/queue-monitor')
  await queueMonitor.processQueueRequestWithServer(requestId, {
    id: 'local',
    client: client as never,
    name: 'Local',
    type: 'local',
    url: 'http://127.0.0.1:8188',
  })
}

describe('QueueMonitor H3 Ref2VA references', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBuildWorkflow.mockResolvedValue({ prompt: { class_type: 'TestNode', inputs: {} } })
    mockUpdateRequest.mockResolvedValue(undefined)
    mockGetRequestStatus.mockResolvedValue('PROCESSING')
    mockMarkRequestFailedIfProcessing.mockResolvedValue(1)
    mockClearImageBlobs.mockResolvedValue(undefined)
    mockStartMonitoring.mockResolvedValue(undefined)
  })

  it('uploads mixed references and passes custom resolution to the workflow', async () => {
    mockGetRequestById.mockResolvedValue(makeRequest())
    mockGetReferenceFileRows.mockResolvedValue([
      { id: 'image-1', kind: 'IMAGE', slot: 0, filename: 'ref_img_0.png', includeSoundtrack: false, audioPresetName: null },
      { id: 'video-1', kind: 'VIDEO', slot: 0, filename: 'ref_vid_0.mp4', includeSoundtrack: true, audioPresetName: null },
      { id: 'audio-1', kind: 'AUDIO', slot: 0, filename: 'ref_aud_0.wav', includeSoundtrack: false, audioPresetName: 'Preset' },
    ])
    const events: string[] = []
    const blobs: Record<string, Uint8Array> = {
      'image-1': new Uint8Array([1]),
      'video-1': new Uint8Array([2]),
      'audio-1': new Uint8Array([3]),
    }
    mockGetReferenceFileBlob.mockImplementation(async (id: string) => {
      events.push(`load:${id}`)
      return blobs[id]
    })
    const client = makeClient()
    client.uploadImage.mockImplementation(async () => {
      events.push('upload:image-1')
      return 'up_img.png'
    })
    client.uploadVideo.mockImplementation(async () => {
      events.push('upload:video-1')
      return 'up_vid.mp4'
    })
    client.uploadAudio.mockImplementation(async () => {
      events.push('upload:audio-1')
      return 'up_aud.wav'
    })

    await processRequest('request-ref2va-1', client)

    expect(events).toEqual([
      'load:image-1',
      'upload:image-1',
      'load:video-1',
      'upload:video-1',
      'load:audio-1',
      'upload:audio-1',
    ])
    expect(client.uploadImage).toHaveBeenCalledTimes(1)
    expect(client.uploadVideo).toHaveBeenCalledTimes(1)
    expect(client.uploadAudio).toHaveBeenCalledTimes(1)
    expect(mockBuildWorkflow).toHaveBeenCalledWith(expect.objectContaining({
      model: 'h3-ref2va',
      refImages: ['up_img.png'],
      refVideos: [{ name: 'up_vid.mp4', includeSoundtrack: true }],
      refAudios: ['up_aud.wav'],
      resolution: { mode: 'custom', aspectWidth: 16, aspectHeight: 9 },
    }))
    expect(mockClearImageBlobs).toHaveBeenCalledWith('request-ref2va-1')
  })

  it('maps first_image resolution mode to firstImage', async () => {
    mockGetRequestById.mockResolvedValue(makeRequest({
      id: 'request-ref2va-2',
      resolutionMode: 'first_image',
      aspectWidth: null,
      aspectHeight: null,
    }))
    mockGetReferenceFileRows.mockResolvedValue([
      { id: 'image-2', kind: 'IMAGE', slot: 0, filename: 'ref_img_0.png', includeSoundtrack: false, audioPresetName: null },
    ])
    mockGetReferenceFileBlob.mockResolvedValue(new Uint8Array([1]))
    const client = makeClient()

    await processRequest('request-ref2va-2', client)

    expect(mockBuildWorkflow).toHaveBeenCalledWith(expect.objectContaining({
      model: 'h3-ref2va',
      resolution: { mode: 'firstImage' },
    }))
  })

  it('fails the request when a reference blob is missing', async () => {
    mockGetRequestById.mockResolvedValue(makeRequest({ id: 'request-ref2va-3' }))
    mockGetReferenceFileRows.mockResolvedValue([
      { id: 'image-3', kind: 'IMAGE', slot: 0, filename: 'ref_img_0.png', includeSoundtrack: false, audioPresetName: null },
    ])
    mockGetReferenceFileBlob.mockResolvedValue(null)
    const client = makeClient()

    await processRequest('request-ref2va-3', client)

    expect(mockGetReferenceFileRows).toHaveBeenCalledWith('request-ref2va-3')
    expect(mockGetReferenceFileBlob).toHaveBeenCalledWith('image-3')
    expect(mockMarkRequestFailedIfProcessing).toHaveBeenCalledWith('request-ref2va-3', expect.objectContaining({
      error: 'Reference blob missing: ref_img_0.png',
    }))
    expect(mockBuildWorkflow).not.toHaveBeenCalled()
  })

  it('fails the request when no reference rows exist', async () => {
    mockGetRequestById.mockResolvedValue(makeRequest({ id: 'request-ref2va-4' }))
    mockGetReferenceFileRows.mockResolvedValue([])
    const client = makeClient()

    await processRequest('request-ref2va-4', client)

    expect(mockGetReferenceFileRows).toHaveBeenCalledWith('request-ref2va-4')
    expect(mockMarkRequestFailedIfProcessing).toHaveBeenCalledWith('request-ref2va-4', expect.objectContaining({
      error: 'Reference files not found for reference request',
    }))
    expect(mockBuildWorkflow).not.toHaveBeenCalled()
  })

  it('does not submit or overwrite CANCELLED when cancellation clears a blob before reference loading', async () => {
    mockGetRequestById.mockResolvedValue(makeRequest({ id: 'request-ref2va-cancel-before-load' }))
    mockGetReferenceFileRows.mockResolvedValue([
      { id: 'image-cancelled', kind: 'IMAGE', slot: 0, filename: 'cancelled.png', includeSoundtrack: false, audioPresetName: null },
    ])
    mockGetReferenceFileBlob.mockResolvedValue(null)
    mockMarkRequestFailedIfProcessing.mockResolvedValue(0)
    const client = makeClient()

    await processRequest('request-ref2va-cancel-before-load', client)

    expect(client.submitPrompt).not.toHaveBeenCalled()
    expect(mockMarkRequestFailedIfProcessing).toHaveBeenCalledWith(
      'request-ref2va-cancel-before-load',
      expect.objectContaining({ error: 'Reference blob missing: cancelled.png' }),
    )
    expect(mockUpdateRequest).not.toHaveBeenCalledWith(
      'request-ref2va-cancel-before-load',
      expect.objectContaining({ status: 'FAILED' }),
    )
  })

  it('does not submit or overwrite CANCELLED when cancellation happens between upload and submit', async () => {
    mockGetRequestById.mockResolvedValue(makeRequest({ id: 'request-ref2va-cancel-before-submit' }))
    mockGetReferenceFileRows.mockResolvedValue([
      { id: 'image-uploaded', kind: 'IMAGE', slot: 0, filename: 'uploaded.png', includeSoundtrack: false, audioPresetName: null },
    ])
    mockGetReferenceFileBlob.mockResolvedValue(new Uint8Array([4]))
    mockGetRequestStatus.mockResolvedValue('CANCELLED')
    const client = makeClient()

    await processRequest('request-ref2va-cancel-before-submit', client)

    expect(client.uploadImage).toHaveBeenCalledOnce()
    expect(mockGetRequestStatus).toHaveBeenCalledWith('request-ref2va-cancel-before-submit')
    expect(client.submitPrompt).not.toHaveBeenCalled()
    expect(mockMarkRequestFailedIfProcessing).not.toHaveBeenCalled()
    expect(mockUpdateRequest).not.toHaveBeenCalledWith(
      'request-ref2va-cancel-before-submit',
      expect.objectContaining({ status: 'FAILED' }),
    )
    expect(mockReleaseServer).toHaveBeenCalledWith('request-ref2va-cancel-before-submit')
  })
})
