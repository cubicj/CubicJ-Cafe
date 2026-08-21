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
  ActionRowBuilder: class {
    components: unknown[] = []
    addComponents(...components: unknown[]) { this.components.push(...components); return this }
  },
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
    url = ''
    setCustomId(value: string) { this.customId = value; return this }
    setLabel(value: string) { this.label = value; return this }
    setStyle(value: number) { this.style = value; return this }
    setURL(value: string) { this.url = value; return this }
  },
  ButtonStyle: { Secondary: 2, Link: 5 },
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
    actionRowComponents: unknown[] = []
    setAccentColor(value: number) { this.accentColor = value; return this }
    addTextDisplayComponents(...components: unknown[]) { this.textComponents.push(...components); return this }
    addSectionComponents(...components: unknown[]) { this.sectionComponents.push(...components); return this }
    addActionRowComponents(...components: unknown[]) { this.actionRowComponents.push(...components); return this }
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
    vi.stubEnv('DISCORD_NSFW_CHANNEL_ID', '')
    vi.stubEnv('APP_URL', 'https://cafe.invalid')
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

  it('adds the NSFW move button after a SFW video message is sent', async () => {
    vi.stubEnv('DISCORD_NSFW_CHANNEL_ID', 'nsfw-channel-1')
    const { discordBot } = await import('@/lib/discord-bot')
    const edit = vi.fn().mockResolvedValue(undefined)
    const cardMessage = { id: 'card-message-1', edit }
    const videoMessage = { id: 'video-message-1' }
    const send = vi.fn((message: { files?: unknown[] }) => (
      Promise.resolve(message.files ? videoMessage : cardMessage)
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

    await bot.sendVideoToDiscord({
      videoPath: '/tmp/video.mp4',
      prompt: 'test prompt',
      username: 'TestUser',
      requestId: 'request-1',
      processingTime: 47,
    })

    expect(edit).toHaveBeenCalledTimes(1)
    const editedCard = edit.mock.calls[0][0]
    const container = editedCard.components[0]
    const moveButton = container.actionRowComponents[0].components[0]
    expect(moveButton.label).toBe('NSFW 채널로 이동')
    expect(moveButton.style).toBe(2)
    expect(moveButton.customId).toBe('move_nsfw:video-message-1:request-1')
    expect(container.sectionComponents[0].buttonAccessory.customId).toBe('show_prompt:request-1')
    expect(editedCard.flags).toEqual([32768])
  })

  it('does not add the NSFW move button to an NSFW-origin card', async () => {
    vi.stubEnv('DISCORD_NSFW_CHANNEL_ID', 'nsfw-channel-1')
    const { discordBot } = await import('@/lib/discord-bot')
    const edit = vi.fn().mockResolvedValue(undefined)
    const send = vi.fn((message: { files?: unknown[] }) => Promise.resolve(
      message.files ? { id: 'video-message-1' } : { id: 'card-message-1', edit }
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

    await bot.sendVideoToDiscord({
      videoPath: '/tmp/video.mp4',
      prompt: 'test prompt',
      username: 'TestUser',
      requestId: 'request-1',
      isNSFW: true,
    })

    expect(edit).not.toHaveBeenCalled()
  })

  it('does not add the NSFW move button when the video attachment is skipped', async () => {
    vi.stubEnv('DISCORD_NSFW_CHANNEL_ID', 'nsfw-channel-1')
    mockStat.mockResolvedValue({ size: 10 * 1024 * 1024 })
    const { discordBot } = await import('@/lib/discord-bot')
    const edit = vi.fn().mockResolvedValue(undefined)
    const cardMessage = { id: 'card-message-1', edit }
    const send = vi.fn().mockResolvedValue(cardMessage)
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

    expect(edit).not.toHaveBeenCalled()
    expect(send.mock.calls.filter(([message]) => message.files)).toHaveLength(0)
  })

  it('moves a result card and video to the NSFW channel in order', async () => {
    const { discordBot } = await import('@/lib/discord-bot')
    const nsfwCardDelete = vi.fn().mockResolvedValue(undefined)
    const nsfwCardMessage = { id: 'nsfw-card-1', delete: nsfwCardDelete }
    const nsfwSend = vi.fn().mockResolvedValue(nsfwCardMessage)
    const nsfwChannel = {
      id: 'nsfw-channel-1',
      guild: { id: 'guild-1' },
      send: nsfwSend,
    }
    const forward = vi.fn().mockResolvedValue({ id: 'forwarded-video-1' })
    const deleteVideo = vi.fn().mockResolvedValue(undefined)
    const videoMessage = {
      id: 'video-message-1',
      attachments: new Map([['attachment-1', {}]]),
      forward,
      delete: deleteVideo,
    }
    const fetchVideo = vi.fn().mockResolvedValue(videoMessage)
    const deferUpdate = vi.fn().mockResolvedValue(undefined)
    const followUp = vi.fn().mockResolvedValue(undefined)
    const editReply = vi.fn().mockResolvedValue(undefined)
    mockGetRequestById.mockResolvedValue({
      id: 'request-1',
      videoModel: 'ltx-wan',
      startedAt: new Date('2026-08-21T10:00:00Z'),
      completedAt: new Date('2026-08-21T10:05:00Z'),
      user: { discordId: 'requester-1' },
    })
    const bot = discordBot as unknown as { getChannel: ReturnType<typeof vi.fn> }
    bot.getChannel = vi.fn().mockResolvedValue(nsfwChannel)
    const handler = discordClientHandlers.get('interactionCreate')

    await handler?.({
      isButton: () => true,
      customId: 'move_nsfw:video-message-1:request-1',
      deferUpdate,
      channel: { messages: { fetch: fetchVideo } },
      followUp,
      editReply,
      user: { id: 'mover-1' },
      guildId: 'guild-1',
    })

    expect(deferUpdate.mock.invocationCallOrder[0]).toBeLessThan(fetchVideo.mock.invocationCallOrder[0])
    expect(nsfwSend.mock.invocationCallOrder[0]).toBeLessThan(forward.mock.invocationCallOrder[0])
    expect(forward.mock.invocationCallOrder[0]).toBeLessThan(deleteVideo.mock.invocationCallOrder[0])
    expect(deleteVideo.mock.invocationCallOrder[0]).toBeLessThan(editReply.mock.invocationCallOrder[0])
    expect(forward).toHaveBeenCalledWith(nsfwChannel)
    expect(deleteVideo).toHaveBeenCalledTimes(1)

    const nsfwCard = nsfwSend.mock.calls[0][0]
    const nsfwContainer = nsfwCard.components[0]
    expect(nsfwCard.allowedMentions).toEqual({ parse: [] })
    expect(nsfwContainer.actionRowComponents).toHaveLength(0)
    expect(nsfwContainer.sectionComponents[0].buttonAccessory.customId).toBe('show_prompt:request-1')
    expect(nsfwContainer.sectionComponents[0].textComponents[0].content).toBe('> <@requester-1> · 300초')

    const originalCardUpdate = editReply.mock.calls[0][0]
    const noticeContainer = originalCardUpdate.components[0]
    expect(originalCardUpdate.allowedMentions).toEqual({ parse: [] })
    expect(noticeContainer.textComponents[0].content).toBe(
      '## [CubicJ Cafe I2V - LTX 2.3 + WAN 2.2](https://cafe.invalid)'
    )
    expect(noticeContainer.textComponents[1].content).toBe(
      '해당 영상은 <@mover-1>님이 NSFW 채널로 이동했습니다.'
    )
    expect(noticeContainer.sectionComponents).toHaveLength(0)
    const linkButton = noticeContainer.actionRowComponents[0].components[0]
    expect(linkButton.label).toBe('NSFW 채널에서 보기')
    expect(linkButton.style).toBe(5)
    expect(linkButton.url).toBe(
      'https://discord.com/channels/guild-1/nsfw-channel-1/nsfw-card-1'
    )
    expect(followUp).not.toHaveBeenCalled()
    expect(nsfwCardDelete).not.toHaveBeenCalled()
  })

  it('cleans up the rebuilt card without touching originals when forwarding fails', async () => {
    const { discordBot } = await import('@/lib/discord-bot')
    const nsfwCardDelete = vi.fn().mockResolvedValue(undefined)
    const nsfwCardMessage = { id: 'nsfw-card-1', delete: nsfwCardDelete }
    const nsfwChannel = {
      id: 'nsfw-channel-1',
      guild: { id: 'guild-1' },
      send: vi.fn().mockResolvedValue(nsfwCardMessage),
    }
    const forward = vi.fn().mockRejectedValue(new Error('forward unavailable'))
    const deleteVideo = vi.fn().mockResolvedValue(undefined)
    const fetchVideo = vi.fn().mockResolvedValue({
      id: 'video-message-1',
      attachments: new Map([['attachment-1', {}]]),
      forward,
      delete: deleteVideo,
    })
    const followUp = vi.fn().mockResolvedValue(undefined)
    const editReply = vi.fn().mockResolvedValue(undefined)
    mockGetRequestById.mockResolvedValue({
      id: 'request-1',
      videoModel: 'wan',
      startedAt: new Date('2026-08-21T10:00:00Z'),
      completedAt: new Date('2026-08-21T10:01:00Z'),
      user: { discordId: 'requester-1' },
    })
    const bot = discordBot as unknown as { getChannel: ReturnType<typeof vi.fn> }
    bot.getChannel = vi.fn().mockResolvedValue(nsfwChannel)
    const handler = discordClientHandlers.get('interactionCreate')

    await handler?.({
      isButton: () => true,
      customId: 'move_nsfw:video-message-1:request-1',
      deferUpdate: vi.fn().mockResolvedValue(undefined),
      channel: { messages: { fetch: fetchVideo } },
      followUp,
      editReply,
      user: { id: 'mover-1' },
      guildId: 'guild-1',
    })

    expect(nsfwCardDelete).toHaveBeenCalledTimes(1)
    expect(deleteVideo).not.toHaveBeenCalled()
    expect(editReply).not.toHaveBeenCalled()
    expect(followUp).toHaveBeenCalledWith({
      content: '영상을 NSFW 채널로 이동하지 못했습니다. 다시 시도해주세요.',
      flags: 64,
    })
  })

  it('aborts the NSFW move when another bot process already acknowledged it', async () => {
    await import('@/lib/discord-bot')
    const ackError = new MockDiscordAPIError(40060, 400)
    const deferUpdate = vi.fn().mockRejectedValue(ackError)
    const fetchVideo = vi.fn()
    const followUp = vi.fn()
    const handler = discordClientHandlers.get('interactionCreate')

    await handler?.({
      isButton: () => true,
      customId: 'move_nsfw:video-message-1:request-1',
      deferUpdate,
      channel: { messages: { fetch: fetchVideo } },
      followUp,
    })

    expect(deferUpdate).toHaveBeenCalledTimes(1)
    expect(fetchVideo).not.toHaveBeenCalled()
    expect(mockGetRequestById).not.toHaveBeenCalled()
    expect(followUp).not.toHaveBeenCalled()
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'NSFW move interaction was lost or already handled by another process',
      expect.objectContaining({ code: 40060 })
    )
  })

  it('reports an already moved video when the original message is gone', async () => {
    await import('@/lib/discord-bot')
    const fetchVideo = vi.fn().mockRejectedValue(new MockDiscordAPIError(10008, 404))
    const followUp = vi.fn().mockResolvedValue(undefined)
    const handler = discordClientHandlers.get('interactionCreate')

    await handler?.({
      isButton: () => true,
      customId: 'move_nsfw:video-message-1:request-1',
      deferUpdate: vi.fn().mockResolvedValue(undefined),
      channel: { messages: { fetch: fetchVideo } },
      followUp,
    })

    expect(mockGetRequestById).not.toHaveBeenCalled()
    expect(followUp).toHaveBeenCalledWith({
      content: '이미 이동되었거나 찾을 수 없는 영상입니다.',
      flags: 64,
    })
  })

  it('reports a missing queue request without moving the video', async () => {
    await import('@/lib/discord-bot')
    const forward = vi.fn()
    const deleteVideo = vi.fn()
    const fetchVideo = vi.fn().mockResolvedValue({
      id: 'video-message-1',
      attachments: new Map([['attachment-1', {}]]),
      forward,
      delete: deleteVideo,
    })
    const followUp = vi.fn().mockResolvedValue(undefined)
    mockGetRequestById.mockResolvedValue(null)
    const handler = discordClientHandlers.get('interactionCreate')

    await handler?.({
      isButton: () => true,
      customId: 'move_nsfw:video-message-1:request-1',
      deferUpdate: vi.fn().mockResolvedValue(undefined),
      channel: { messages: { fetch: fetchVideo } },
      followUp,
    })

    expect(mockGetRequestById).toHaveBeenCalledWith('request-1')
    expect(forward).not.toHaveBeenCalled()
    expect(deleteVideo).not.toHaveBeenCalled()
    expect(followUp).toHaveBeenCalledWith({
      content: '요청 정보를 찾을 수 없습니다.',
      flags: 64,
    })
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
