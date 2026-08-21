import { vi } from 'vitest'

const discordClientHandlers = vi.hoisted(() => new Map<string, (...args: unknown[]) => unknown>())
const mockGetRequestById = vi.hoisted(() => vi.fn())
const mockStat = vi.hoisted(() => vi.fn())
const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
}))
const MockDiscordAPIError = vi.hoisted(() => class DiscordAPIError extends Error {
  code: number
  status: number

  constructor(code: number, status: number) {
    super(`Discord API error ${code}`)
    this.code = code
    this.status = status
  }
})

vi.mock('node:fs/promises', () => ({
  stat: (...args: unknown[]) => mockStat(...args),
}))

vi.mock('@/lib/logger', () => ({
  createLogger: () => mockLogger,
}))

vi.mock('@/lib/database/ops-settings', () => ({
  getOpsSetting: () => 30000,
}))

vi.mock('@/lib/database/queue', () => ({
  QueueService: {
    getRequestById: (...args: unknown[]) => mockGetRequestById(...args),
  },
}))

vi.mock('discord.js', () => ({
  AttachmentBuilder: class {
    data: unknown
    options: unknown
    constructor(data: unknown, options?: unknown) {
      this.data = data
      this.options = options
    }
  },
  ButtonBuilder: class {
    customId = ''
    label = ''
    style = 0
    setCustomId(value: string) { this.customId = value; return this }
    setLabel(value: string) { this.label = value; return this }
    setStyle(value: number) { this.style = value; return this }
  },
  ButtonStyle: { Secondary: 2 },
  Client: class {
    guilds = { fetch: vi.fn() }
    isReady = vi.fn().mockReturnValue(false)
    login = vi.fn()
    destroy = vi.fn()
    on = vi.fn((event: string, handler: (...args: unknown[]) => unknown) => {
      discordClientHandlers.set(event, handler)
    })
    once = vi.fn()
    removeAllListeners = vi.fn(() => discordClientHandlers.clear())
  },
  ContainerBuilder: class {
    accentColor = 0
    textComponents: unknown[] = []
    sectionComponents: unknown[] = []
    setAccentColor(value: number) { this.accentColor = value; return this }
    addTextDisplayComponents(...components: unknown[]) { this.textComponents.push(...components); return this }
    addSectionComponents(...components: unknown[]) { this.sectionComponents.push(...components); return this }
  },
  DiscordAPIError: MockDiscordAPIError,
  GatewayIntentBits: { Guilds: 1, GuildMessages: 2 },
  MessageFlags: { Ephemeral: 64, IsComponentsV2: 32768 },
  SectionBuilder: class {
    textComponents: unknown[] = []
    buttonAccessory: unknown = null
    addTextDisplayComponents(...components: unknown[]) { this.textComponents.push(...components); return this }
    setButtonAccessory(button: unknown) { this.buttonAccessory = button; return this }
  },
  TextDisplayBuilder: class {
    content = ''
    setContent(value: string) { this.content = value; return this }
  },
}))

describe('discordBot singleton', () => {
  beforeEach(() => {
    vi.stubEnv('DISCORD_GUILD_ID', 'guild-1')
    vi.stubEnv('DISCORD_CHANNEL_ID', 'channel-1')
    mockStat.mockResolvedValue({ size: 1024 })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
    vi.resetModules()
    delete globalThis.__discordBot
    discordClientHandlers.clear()
    mockGetRequestById.mockReset()
    mockStat.mockReset()
    vi.clearAllMocks()
  })

  it('refreshes the prototype of an existing global singleton after hot reload', async () => {
    const existing = {
      isInitialized: false,
      client: {
        isReady: vi.fn().mockReturnValue(false),
        on: vi.fn((event: string, handler: (...args: unknown[]) => unknown) => {
          discordClientHandlers.set(event, handler)
        }),
        removeAllListeners: vi.fn(() => discordClientHandlers.clear()),
      },
    }
    globalThis.__discordBot = existing as never

    const { discordBot } = await import('@/lib/discord-bot')

    expect(discordBot).toBe(existing)
    expect(typeof discordBot.sendDebugVideoResultMessage).toBe('function')
    expect(existing.client.removeAllListeners).toHaveBeenCalled()
    expect(discordClientHandlers.has('interactionCreate')).toBe(true)
  })

  it('puts mention and generation time in the same section as the prompt button', async () => {
    const { discordBot } = await import('@/lib/discord-bot')
    const send = vi.fn().mockResolvedValue(undefined)
    const bot = discordBot as unknown as {
      isInitialized: boolean
      client: { isReady: ReturnType<typeof vi.fn> }
      getChannel: ReturnType<typeof vi.fn>
      sendDebugVideoResultMessage: typeof discordBot.sendDebugVideoResultMessage
    }
    bot.isInitialized = true
    bot.client.isReady.mockReturnValue(true)
    bot.getChannel = vi.fn().mockResolvedValue({ send, guild: { premiumTier: 0 } })

    await bot.sendDebugVideoResultMessage({
      requestId: 'request-1',
      discordId: 'user-1',
      videoModel: 'ltxa',
      processingTime: 60,
    })

    const message = send.mock.calls[0][0]
    const container = message.components[0]
    const section = container.sectionComponents[0]
    expect(section.textComponents[0].content).toBe('> <@user-1> · 60초')
    expect(section.buttonAccessory.customId).toBe('show_prompt:request-1')
  })

  it('does not resend the result card when the video file send retries', async () => {
    vi.useFakeTimers()
    const { discordBot } = await import('@/lib/discord-bot')
    let fileSendAttempts = 0
    const send = vi.fn((message: { files?: unknown[] }) => {
      if (message.files) {
        fileSendAttempts += 1
        if (fileSendAttempts === 1) {
          return Promise.reject(new Error('payload too large'))
        }
      }

      return Promise.resolve(undefined)
    })
    const bot = discordBot as unknown as {
      isInitialized: boolean
      client: { isReady: ReturnType<typeof vi.fn> }
      getChannel: ReturnType<typeof vi.fn>
      sendVideoToDiscord: typeof discordBot.sendVideoToDiscord
    }
    bot.isInitialized = true
    bot.client.isReady.mockReturnValue(true)
    bot.getChannel = vi.fn().mockResolvedValue({ send, guild: { premiumTier: 0 } })

    const sendPromise = bot.sendVideoToDiscord({
      videoPath: '/tmp/video.mp4',
      prompt: 'test prompt',
      username: 'TestUser',
      requestId: 'request-1',
    })

    await vi.runAllTimersAsync()
    await sendPromise

    const cardSends = send.mock.calls.filter(([message]) => !message.files)
    const fileSends = send.mock.calls.filter(([message]) => message.files)
    expect(cardSends).toHaveLength(1)
    expect(fileSends).toHaveLength(2)
  })

  it('sends the result card and a notice without uploading an oversized video', async () => {
    mockStat.mockResolvedValue({ size: 10 * 1024 * 1024 })
    const { discordBot } = await import('@/lib/discord-bot')
    const send = vi.fn().mockResolvedValue(undefined)
    const bot = discordBot as unknown as {
      isInitialized: boolean
      client: { isReady: ReturnType<typeof vi.fn> }
      getChannel: ReturnType<typeof vi.fn>
      sendVideoToDiscord: typeof discordBot.sendVideoToDiscord
    }
    bot.isInitialized = true
    bot.client.isReady.mockReturnValue(true)
    bot.getChannel = vi.fn().mockResolvedValue({ send, guild: { premiumTier: 0 } })

    await bot.sendVideoToDiscord({
      videoPath: '/tmp/oversized-video.mp4',
      prompt: 'test prompt',
      username: 'TestUser',
      requestId: 'request-1',
    })

    expect(send).toHaveBeenCalledTimes(2)
    expect(send.mock.calls[0][0].files).toBeUndefined()
    expect(send.mock.calls[1][0]).toEqual({
      content: '영상 파일이 Discord 업로드 제한을 초과해 업로드하지 못했습니다. (10.0MB)',
    })
    expect(mockLogger.warn).toHaveBeenCalledWith('Video exceeds Discord upload limit', expect.objectContaining({
      sizeBytes: 10 * 1024 * 1024,
      premiumTier: 0,
    }))
  })

  it.each([
    [2, 40],
    [3, 80],
  ])('allows a video within guild premium tier %s upload limit', async (premiumTier, sizeMB) => {
    mockStat.mockResolvedValue({ size: sizeMB * 1024 * 1024 })
    const { discordBot } = await import('@/lib/discord-bot')
    const send = vi.fn().mockResolvedValue(undefined)
    const bot = discordBot as unknown as {
      isInitialized: boolean
      client: { isReady: ReturnType<typeof vi.fn> }
      getChannel: ReturnType<typeof vi.fn>
      sendVideoToDiscord: typeof discordBot.sendVideoToDiscord
    }
    bot.isInitialized = true
    bot.client.isReady.mockReturnValue(true)
    bot.getChannel = vi.fn().mockResolvedValue({ send, guild: { premiumTier } })

    await bot.sendVideoToDiscord({
      videoPath: '/tmp/tier-video.mp4',
      prompt: 'test prompt',
      username: 'TestUser',
      requestId: 'request-1',
    })

    expect(send.mock.calls.filter(([message]) => message.files)).toHaveLength(1)
  })

  it.each([
    [40005, 400],
    [50000, 413],
  ])('does not retry a Discord upload failure with code %s and status %s', async (code, status) => {
    const { discordBot } = await import('@/lib/discord-bot')
    const uploadError = new MockDiscordAPIError(code, status)
    const send = vi.fn((message: { files?: unknown[] }) => (
      message.files ? Promise.reject(uploadError) : Promise.resolve(undefined)
    ))
    const bot = discordBot as unknown as {
      isInitialized: boolean
      client: { isReady: ReturnType<typeof vi.fn> }
      getChannel: ReturnType<typeof vi.fn>
      sendVideoToDiscord: typeof discordBot.sendVideoToDiscord
    }
    bot.isInitialized = true
    bot.client.isReady.mockReturnValue(true)
    bot.getChannel = vi.fn().mockResolvedValue({ send, guild: { premiumTier: 0 } })

    await expect(bot.sendVideoToDiscord({
      videoPath: '/tmp/video.mp4',
      prompt: 'test prompt',
      username: 'TestUser',
      requestId: 'request-1',
    })).rejects.toBe(uploadError)

    expect(send.mock.calls.filter(([message]) => message.files)).toHaveLength(1)
  })

  it('includes request metadata when replying with a short prompt', async () => {
    await import('@/lib/discord-bot')
    mockGetRequestById.mockResolvedValue({
      id: 'request-1',
      prompt: 'test prompt',
      audioFile: 'reference.wav',
      videoDuration: 7,
      videoDurationSeconds: 2.4,
    })
    const reply = vi.fn().mockResolvedValue(undefined)
    const handler = discordClientHandlers.get('interactionCreate')

    await handler?.({
      isButton: () => true,
      customId: 'show_prompt:request-1',
      reply,
    })

    expect(reply).toHaveBeenCalledWith({
      content: [
        '**레퍼런스 오디오:** 사용',
        '**영상 길이:** 2.4초',
        '```',
        'test prompt',
        '```',
      ].join('\n'),
      flags: 64,
    })
  })

  it('keeps request metadata when attaching a long prompt', async () => {
    await import('@/lib/discord-bot')
    mockGetRequestById.mockResolvedValue({
      id: 'request-1',
      prompt: 'a'.repeat(1801),
      audioFile: null,
      videoDuration: 5,
      videoDurationSeconds: null,
    })
    const reply = vi.fn().mockResolvedValue(undefined)
    const handler = discordClientHandlers.get('interactionCreate')

    await handler?.({
      isButton: () => true,
      customId: 'show_prompt:request-1',
      reply,
    })

    expect(reply).toHaveBeenCalledWith(expect.objectContaining({
      content: [
        '**레퍼런스 오디오:** 없음',
        '**영상 길이:** 5초',
      ].join('\n'),
      flags: 64,
    }))
    expect(reply.mock.calls[0][0].files[0].options).toEqual({
      name: 'prompt-request-1.txt',
    })
  })

  it.each([10062, 40060])('does not send a fallback reply for handled interaction error %s', async (code) => {
    await import('@/lib/discord-bot')
    mockGetRequestById.mockResolvedValue({
      id: 'request-1',
      prompt: 'test prompt',
    })
    const replyError = new MockDiscordAPIError(code, 400)
    const reply = vi.fn().mockRejectedValue(replyError)
    const handler = discordClientHandlers.get('interactionCreate')

    await handler?.({
      isButton: () => true,
      customId: 'show_prompt:request-1',
      replied: false,
      deferred: false,
      reply,
    })

    expect(reply).toHaveBeenCalledTimes(1)
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Prompt button interaction was lost or already handled by another process',
      expect.objectContaining({ requestId: 'request-1', code })
    )
  })

  it('swallows a failed fallback reply', async () => {
    await import('@/lib/discord-bot')
    mockGetRequestById.mockRejectedValue(new Error('database unavailable'))
    const reply = vi.fn().mockRejectedValue(new Error('reply unavailable'))
    const handler = discordClientHandlers.get('interactionCreate')

    await expect(handler?.({
      isButton: () => true,
      customId: 'show_prompt:request-1',
      replied: false,
      deferred: false,
      reply,
    })).resolves.toBeUndefined()

    expect(reply).toHaveBeenCalledTimes(1)
    expect(mockLogger.error).toHaveBeenCalledWith('Failed to send prompt button error reply', expect.objectContaining({
      requestId: 'request-1',
      error: 'reply unavailable',
    }))
  })
})
