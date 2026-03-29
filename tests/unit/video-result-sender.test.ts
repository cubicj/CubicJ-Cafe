import type { VideoFileInfo } from '@/lib/comfyui/client-types'
import type { GenerationJob } from '@/types'

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

const mockSendVideoToDiscord = vi.fn()
vi.mock('@/lib/discord-bot', () => ({
  discordBot: {
    sendVideoToDiscord: (...args: unknown[]) =>
      mockSendVideoToDiscord(...args),
  },
}))

const mockGetRequestById = vi.fn()
vi.mock('@/lib/database/queue', () => ({
  QueueService: {
    getRequestById: (...args: unknown[]) => mockGetRequestById(...args),
  },
}))

const mockGetServerById = vi.fn()
vi.mock('@/lib/comfyui/server-manager', () => ({
  serverManager: {
    getServerById: (...args: unknown[]) => mockGetServerById(...args),
  },
}))

describe('sendVideoToDiscord', () => {
  const baseJob: GenerationJob = {
    id: 'job-1',
    userId: '1',
    promptId: 'prompt-1',
    prompt: 'test prompt',
    status: 'completed',
    createdAt: new Date('2026-03-29T10:00:00Z'),
    updatedAt: new Date('2026-03-29T10:01:00Z'),
    isNSFW: false,
    videoModel: 'wan',
    userInfo: { name: 'TestUser', discordId: 'disc-123', image: 'avatar.png' },
  }

  const videoInfo: VideoFileInfo = {
    filename: 'CubicJ_00001-audio.mp4',
    subfolder: 'wan',
    type: 'temp',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetRequestById.mockResolvedValue({ serverId: 'local' })
    mockGetServerById.mockReturnValue({
      id: 'local',
      url: 'http://127.0.0.1:8188',
    })
    mockSendVideoToDiscord.mockResolvedValue(undefined)
  })

  it('sends video to Discord with exact file info', async () => {
    const { sendVideoToDiscord } = await import(
      '@/lib/comfyui/video-result-sender'
    )
    await sendVideoToDiscord(baseJob, videoInfo)

    expect(mockSendVideoToDiscord).toHaveBeenCalledWith({
      filename: 'CubicJ_00001-audio.mp4',
      subfolder: 'wan',
      fileType: 'temp',
      prompt: 'test prompt',
      username: 'TestUser',
      userAvatar: 'avatar.png',
      processingTime: 60,
      isNSFW: false,
      discordId: 'disc-123',
      comfyUIServerUrl: 'http://127.0.0.1:8188',
      videoModel: 'wan',
    })
  })

  it('skips send when no userInfo', async () => {
    const { sendVideoToDiscord } = await import(
      '@/lib/comfyui/video-result-sender'
    )
    await sendVideoToDiscord({ ...baseJob, userInfo: undefined }, videoInfo)

    expect(mockSendVideoToDiscord).not.toHaveBeenCalled()
  })

  it('handles Discord send failure gracefully', async () => {
    mockSendVideoToDiscord.mockRejectedValue(new Error('Discord API error'))
    const { sendVideoToDiscord } = await import(
      '@/lib/comfyui/video-result-sender'
    )

    await expect(
      sendVideoToDiscord(baseJob, videoInfo)
    ).resolves.toBeUndefined()
  })
})
