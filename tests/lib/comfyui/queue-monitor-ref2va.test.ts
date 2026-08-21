export {}

const mockGetRequestById = vi.fn()
const mockGetReferenceFiles = vi.fn()
const mockUpdateRequest = vi.fn()
const mockClearImageBlobs = vi.fn()

vi.mock('@/lib/database/queue', () => ({
  QueueService: {
    getRequestById: (...args: unknown[]) => mockGetRequestById(...args),
    getReferenceFiles: (...args: unknown[]) => mockGetReferenceFiles(...args),
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
    releaseServer: vi.fn(),
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
    mockClearImageBlobs.mockResolvedValue(undefined)
    mockStartMonitoring.mockResolvedValue(undefined)
  })

  it('uploads mixed references and passes custom resolution to the workflow', async () => {
    mockGetRequestById.mockResolvedValue(makeRequest())
    mockGetReferenceFiles.mockResolvedValue([
      { kind: 'IMAGE', slot: 0, filename: 'ref_img_0.png', blob: new Uint8Array([1]), includeSoundtrack: false, audioPresetName: null },
      { kind: 'VIDEO', slot: 0, filename: 'ref_vid_0.mp4', blob: new Uint8Array([2]), includeSoundtrack: true, audioPresetName: null },
      { kind: 'AUDIO', slot: 0, filename: 'ref_aud_0.wav', blob: new Uint8Array([3]), includeSoundtrack: false, audioPresetName: 'Preset' },
    ])
    const client = makeClient()

    await processRequest('request-ref2va-1', client)

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
    mockGetReferenceFiles.mockResolvedValue([
      { kind: 'IMAGE', slot: 0, filename: 'ref_img_0.png', blob: new Uint8Array([1]), includeSoundtrack: false, audioPresetName: null },
    ])
    const client = makeClient()

    await processRequest('request-ref2va-2', client)

    expect(mockBuildWorkflow).toHaveBeenCalledWith(expect.objectContaining({
      model: 'h3-ref2va',
      resolution: { mode: 'firstImage' },
    }))
  })

  it('fails the request when a reference blob is missing', async () => {
    mockGetRequestById.mockResolvedValue(makeRequest({ id: 'request-ref2va-3' }))
    mockGetReferenceFiles.mockResolvedValue([
      { kind: 'IMAGE', slot: 0, filename: 'ref_img_0.png', blob: null, includeSoundtrack: false, audioPresetName: null },
    ])
    const client = makeClient()

    await processRequest('request-ref2va-3', client)

    expect(mockGetReferenceFiles).toHaveBeenCalledWith('request-ref2va-3')
    expect(mockUpdateRequest).toHaveBeenCalledWith('request-ref2va-3', expect.objectContaining({
      status: 'FAILED',
      error: 'Reference blob missing: ref_img_0.png',
    }))
    expect(mockBuildWorkflow).not.toHaveBeenCalled()
  })

  it('fails the request when no reference rows exist', async () => {
    mockGetRequestById.mockResolvedValue(makeRequest({ id: 'request-ref2va-4' }))
    mockGetReferenceFiles.mockResolvedValue([])
    const client = makeClient()

    await processRequest('request-ref2va-4', client)

    expect(mockGetReferenceFiles).toHaveBeenCalledWith('request-ref2va-4')
    expect(mockUpdateRequest).toHaveBeenCalledWith('request-ref2va-4', expect.objectContaining({
      status: 'FAILED',
      error: 'Reference files not found for reference request',
    }))
    expect(mockBuildWorkflow).not.toHaveBeenCalled()
  })
})
