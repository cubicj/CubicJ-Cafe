import { vi } from 'vitest'

type MockDiscordClient = {
  ws: { destroyed: boolean }
  isReady: ReturnType<typeof vi.fn>
  login: ReturnType<typeof vi.fn>
  destroy: ReturnType<typeof vi.fn>
  removeAllListeners: ReturnType<typeof vi.fn>
}

const discordClientHandlers = vi.hoisted(() => new Map<string, (...args: unknown[]) => unknown>())
const mockGetRequestById = vi.hoisted(() => vi.fn())
const mockUpdateDiscordMessageIds = vi.hoisted(() => vi.fn())
const mockStat = vi.hoisted(() => vi.fn())
const mockFetch = vi.hoisted(() => vi.fn())
const mockDiscordClientConstructor = vi.hoisted(() => vi.fn())
const mockDiscordClients = vi.hoisted(() => [] as MockDiscordClient[])
const mockDiscordClientSetups = vi.hoisted(
  () => [] as Array<(client: MockDiscordClient) => void>
)
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
    updateDiscordMessageIds: (...args: unknown[]) => mockUpdateDiscordMessageIds(...args),
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
    ws = { destroyed: false }
    isReady = vi.fn().mockReturnValue(false)
    login = vi.fn()
    destroy = vi.fn(() => {
      this.ws.destroyed = true
      this.isReady.mockReturnValue(false)
    })
    constructor(options: unknown) {
      mockDiscordClientConstructor(options)
      mockDiscordClients.push(this)
      mockDiscordClientSetups.shift()?.(this)
    }
    on = vi.fn((event: string, handler: (...args: unknown[]) => unknown) => {
      discordClientHandlers.set(event, handler)
    })
    once = vi.fn((event: string, handler: (...args: unknown[]) => unknown) => {
      discordClientHandlers.set(event, handler)
    })
    removeListener = vi.fn((event: string, handler: (...args: unknown[]) => unknown) => {
      if (discordClientHandlers.get(event) === handler) discordClientHandlers.delete(event)
    })
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

function createPromptInteraction(customId: string, overrides: Record<string, unknown> = {}) {
  return {
    isButton: () => true,
    customId,
    createdTimestamp: Date.now(),
    guildId: 'guild-1',
    channelId: 'channel-1',
    deferReply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
    reply: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

describe('discordBot singleton', () => {
  beforeEach(() => {
    mockDiscordClients.length = 0
    mockDiscordClientSetups.length = 0
    vi.stubEnv('DISCORD_GUILD_ID', 'guild-1')
    vi.stubEnv('DISCORD_CHANNEL_ID', 'channel-1')
    vi.stubEnv('DISCORD_NSFW_CHANNEL_ID', '')
    vi.stubEnv('APP_URL', 'https://cafe.invalid')
    vi.stubGlobal('fetch', mockFetch)
    mockStat.mockResolvedValue({ size: 1024 })
    mockUpdateDiscordMessageIds.mockResolvedValue(undefined)
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      arrayBuffer: vi.fn().mockResolvedValue(Uint8Array.from([1, 2, 3]).buffer),
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.resetModules()
    delete globalThis.__discordBot
    discordClientHandlers.clear()
    mockGetRequestById.mockReset()
    mockUpdateDiscordMessageIds.mockReset()
    mockStat.mockReset()
    mockFetch.mockReset()
    mockDiscordClientConstructor.mockReset()
    mockDiscordClients.length = 0
    mockDiscordClientSetups.length = 0
    vi.clearAllMocks()
  })

  it('refreshes the prototype of an existing global singleton after hot reload', async () => {
    const existing = {
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

  it('configures the Discord REST request timeout', async () => {
    await import('@/lib/discord-bot')

    expect(mockDiscordClientConstructor).toHaveBeenCalledWith(expect.objectContaining({
      rest: { timeout: 120000 },
    }))
    expect(discordClientHandlers.has('clientReady')).toBe(true)
    expect(discordClientHandlers.has('ready')).toBe(false)
    expect(discordClientHandlers.has('disconnect')).toBe(false)
    expect(discordClientHandlers.has('reconnecting')).toBe(false)
    expect(discordClientHandlers.has('shardReconnecting')).toBe(true)
    expect(discordClientHandlers.has('shardResume')).toBe(true)
  })

  it.each([
    'show_prompt:request-1',
    'move_video:request-1',
  ])('ignores %s interactions from a different guild', async (customId) => {
    await import('@/lib/discord-bot')
    const deferReply = vi.fn()
    const deferUpdate = vi.fn()
    const editReply = vi.fn()
    const reply = vi.fn()
    const followUp = vi.fn()
    const handler = discordClientHandlers.get('interactionCreate')

    await handler?.({
      isButton: () => true,
      customId,
      guildId: 'other-guild',
      deferReply,
      deferUpdate,
      editReply,
      reply,
      followUp,
    })

    expect(deferReply).not.toHaveBeenCalled()
    expect(deferUpdate).not.toHaveBeenCalled()
    expect(mockGetRequestById).not.toHaveBeenCalled()
    expect(editReply).not.toHaveBeenCalled()
    expect(reply).not.toHaveBeenCalled()
    expect(followUp).not.toHaveBeenCalled()
  })

  it('puts mention and generation time in the same section as the prompt button', async () => {
    const { discordBot } = await import('@/lib/discord-bot')
    const send = vi.fn().mockResolvedValue(undefined)
    const bot = discordBot as unknown as {
      client: { isReady: ReturnType<typeof vi.fn> }
      getChannel: ReturnType<typeof vi.fn>
      sendDebugVideoResultMessage: typeof discordBot.sendDebugVideoResultMessage
    }
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

      return Promise.resolve({ id: message.files ? 'video-message-1' : 'card-message-1' })
    })
    const bot = discordBot as unknown as {
      client: { isReady: ReturnType<typeof vi.fn> }
      getChannel: ReturnType<typeof vi.fn>
      sendVideoToDiscord: typeof discordBot.sendVideoToDiscord
    }
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
    const send = vi.fn().mockResolvedValue({ id: 'card-message-1' })
    const bot = discordBot as unknown as {
      client: { isReady: ReturnType<typeof vi.fn> }
      getChannel: ReturnType<typeof vi.fn>
      sendVideoToDiscord: typeof discordBot.sendVideoToDiscord
    }
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
    const send = vi.fn((message: { files?: unknown[] }) => Promise.resolve({
      id: message.files ? 'video-message-1' : 'card-message-1',
    }))
    const bot = discordBot as unknown as {
      client: { isReady: ReturnType<typeof vi.fn> }
      getChannel: ReturnType<typeof vi.fn>
      sendVideoToDiscord: typeof discordBot.sendVideoToDiscord
    }
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

  it('persists Discord message ids after a SFW video is sent without editing the card', async () => {
    const { discordBot } = await import('@/lib/discord-bot')
    const edit = vi.fn().mockResolvedValue(undefined)
    const cardMessage = { id: 'card-message-1', edit }
    const videoMessage = { id: 'video-message-1' }
    const send = vi.fn((message: {
      files?: unknown[]
      components?: Array<{
        actionRowComponents: unknown[]
        sectionComponents: Array<{ buttonAccessory: { customId: string } }>
      }>
    }) => (
      Promise.resolve(message.files ? videoMessage : cardMessage)
    ))
    const bot = discordBot as unknown as {
      client: { isReady: ReturnType<typeof vi.fn> }
      getChannel: ReturnType<typeof vi.fn>
      sendVideoToDiscord: typeof discordBot.sendVideoToDiscord
    }
    bot.client.isReady.mockReturnValue(true)
    bot.getChannel = vi.fn().mockResolvedValue({ send, guild: { premiumTier: 0 } })

    await bot.sendVideoToDiscord({
      videoPath: '/tmp/video.mp4',
      prompt: 'test prompt',
      username: 'TestUser',
      requestId: 'request-1',
      processingTime: 47,
    })

    expect(edit).not.toHaveBeenCalled()
    const container = send.mock.calls[0][0].components![0]
    expect(container.actionRowComponents).toHaveLength(0)
    expect(container.sectionComponents[0].buttonAccessory.customId).toBe('show_prompt:request-1')
    expect(mockUpdateDiscordMessageIds).toHaveBeenCalledWith(
      'request-1',
      'card-message-1',
      'video-message-1'
    )
  })

  it('persists Discord message ids after an NSFW video is sent without editing the card', async () => {
    const { discordBot } = await import('@/lib/discord-bot')
    const edit = vi.fn().mockResolvedValue(undefined)
    const send = vi.fn((message: { files?: unknown[] }) => Promise.resolve(
      message.files ? { id: 'video-message-1' } : { id: 'card-message-1', edit }
    ))
    const bot = discordBot as unknown as {
      client: { isReady: ReturnType<typeof vi.fn> }
      getChannel: ReturnType<typeof vi.fn>
      sendVideoToDiscord: typeof discordBot.sendVideoToDiscord
    }
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
    expect(mockUpdateDiscordMessageIds).toHaveBeenCalledWith(
      'request-1',
      'card-message-1',
      'video-message-1'
    )
  })

  it('persists only the card id when the video attachment is skipped', async () => {
    vi.stubEnv('DISCORD_NSFW_CHANNEL_ID', 'nsfw-channel-1')
    mockStat.mockResolvedValue({ size: 10 * 1024 * 1024 })
    const { discordBot } = await import('@/lib/discord-bot')
    const edit = vi.fn().mockResolvedValue(undefined)
    const cardMessage = { id: 'card-message-1', edit }
    const send = vi.fn().mockResolvedValue(cardMessage)
    const bot = discordBot as unknown as {
      client: { isReady: ReturnType<typeof vi.fn> }
      getChannel: ReturnType<typeof vi.fn>
      sendVideoToDiscord: typeof discordBot.sendVideoToDiscord
    }
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
    expect(mockUpdateDiscordMessageIds).toHaveBeenCalledWith(
      'request-1',
      'card-message-1',
      null
    )
  })

  it('downloads and re-uploads a SFW video to the NSFW channel in order', async () => {
    vi.stubEnv('DISCORD_NSFW_CHANNEL_ID', 'nsfw-channel-1')
    const { discordBot } = await import('@/lib/discord-bot')
    const nsfwCardDelete = vi.fn().mockResolvedValue(undefined)
    const nsfwCardMessage = { id: 'nsfw-card-1', delete: nsfwCardDelete }
    const nsfwSend = vi.fn()
      .mockResolvedValueOnce(nsfwCardMessage)
      .mockResolvedValueOnce({ id: 'uploaded-video-1' })
    const nsfwChannel = {
      id: 'nsfw-channel-1',
      guild: { id: 'guild-1' },
      send: nsfwSend,
    }
    const deleteVideo = vi.fn().mockResolvedValue(undefined)
    const videoMessage = {
      id: 'video-message-1',
      attachments: {
        size: 1,
        first: () => ({
          url: 'https://cdn.invalid/video-1.mp4',
          name: 'video-1.mp4',
        }),
      },
      delete: deleteVideo,
    }
    const deleteCard = vi.fn().mockResolvedValue(undefined)
    const editCard = vi.fn().mockResolvedValue(undefined)
    const cardMessage = { id: 'card-message-1', delete: deleteCard, edit: editCard }
    const sourceSend = vi.fn().mockResolvedValue({ id: 'notice-message-1' })
    const fetchMessage = vi.fn((messageId: string) => Promise.resolve(
      messageId === 'video-message-1' ? videoMessage : cardMessage
    ))
    const deferUpdate = vi.fn().mockResolvedValue(undefined)
    const followUp = vi.fn().mockResolvedValue(undefined)
    const editReply = vi.fn().mockResolvedValue(undefined)
    mockGetRequestById.mockResolvedValue({
      id: 'request-1',
      videoModel: 'ltx-wan',
      startedAt: new Date('2026-08-21T10:00:00Z'),
      completedAt: new Date('2026-08-21T10:05:00Z'),
      isNSFW: false,
      discordCardMessageId: 'card-message-1',
      discordVideoMessageId: 'video-message-1',
      user: { discordId: 'requester-1' },
    })
    const bot = discordBot as unknown as { getChannel: ReturnType<typeof vi.fn> }
    bot.getChannel = vi.fn().mockResolvedValue(nsfwChannel)
    const handler = discordClientHandlers.get('interactionCreate')

    await handler?.({
      isButton: () => true,
      customId: 'move_video:request-1',
      deferUpdate,
      channelId: 'channel-1',
      channel: { messages: { fetch: fetchMessage }, send: sourceSend },
      followUp,
      editReply,
      user: { id: 'mover-1' },
      guildId: 'guild-1',
    })

    expect(deferUpdate.mock.invocationCallOrder[0]).toBeLessThan(fetchMessage.mock.invocationCallOrder[0])
    expect(nsfwSend.mock.invocationCallOrder[0]).toBeLessThan(mockFetch.mock.invocationCallOrder[0])
    expect(mockFetch.mock.invocationCallOrder[0]).toBeLessThan(nsfwSend.mock.invocationCallOrder[1])
    expect(nsfwSend.mock.invocationCallOrder[1]).toBeLessThan(deleteVideo.mock.invocationCallOrder[0])
    expect(deleteVideo.mock.invocationCallOrder[0]).toBeLessThan(deleteCard.mock.invocationCallOrder[0])
    expect(deleteCard.mock.invocationCallOrder[0]).toBeLessThan(sourceSend.mock.invocationCallOrder[0])
    expect(sourceSend.mock.invocationCallOrder[0]).toBeLessThan(editReply.mock.invocationCallOrder[0])
    expect(mockFetch).toHaveBeenCalledWith('https://cdn.invalid/video-1.mp4', {
      method: 'GET',
      signal: expect.any(AbortSignal),
    })
    expect(nsfwSend).toHaveBeenCalledTimes(2)
    expect(nsfwSend.mock.calls[1][0]).toEqual({
      files: [expect.objectContaining({
        data: expect.any(Buffer),
        options: { name: 'video-1.mp4' },
      })],
    })
    expect(deleteVideo).toHaveBeenCalledTimes(1)
    expect(fetchMessage).toHaveBeenNthCalledWith(1, 'video-message-1')
    expect(fetchMessage).toHaveBeenNthCalledWith(2, 'card-message-1')

    const nsfwCard = nsfwSend.mock.calls[0][0]
    const nsfwContainer = nsfwCard.components[0]
    expect(nsfwCard.allowedMentions).toEqual({ parse: [] })
    expect(nsfwContainer.accentColor).toBe(0xff6b6b)
    expect(nsfwContainer.textComponents[0].content).toContain(' NSFW]')
    expect(nsfwContainer.actionRowComponents).toHaveLength(0)
    expect(nsfwContainer.sectionComponents[0].buttonAccessory.customId).toBe('show_prompt:request-1')
    expect(nsfwContainer.sectionComponents[0].textComponents[0].content).toBe('> <@requester-1> · 300초')

    const noticeMessage = sourceSend.mock.calls[0][0]
    const noticeContainer = noticeMessage.components[0]
    expect(noticeMessage.allowedMentions).toEqual({ parse: [] })
    expect(noticeContainer.accentColor).toBe(0x10b981)
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
    expect(editReply).toHaveBeenCalledWith({ components: [] })
    expect(deleteCard).toHaveBeenCalledTimes(1)
    expect(editCard).not.toHaveBeenCalled()
    expect(mockUpdateDiscordMessageIds).toHaveBeenCalledWith(
      'request-1',
      'nsfw-card-1',
      'uploaded-video-1'
    )
    expect(followUp).not.toHaveBeenCalled()
    expect(nsfwCardDelete).not.toHaveBeenCalled()
  })

  it('downloads and re-uploads an NSFW video to the main channel with channel-specific styling', async () => {
    vi.stubEnv('DISCORD_NSFW_CHANNEL_ID', 'nsfw-channel-1')
    const { discordBot } = await import('@/lib/discord-bot')
    const targetCardMessage = {
      id: 'main-card-1',
      delete: vi.fn().mockResolvedValue(undefined),
    }
    const mainSend = vi.fn()
      .mockResolvedValueOnce(targetCardMessage)
      .mockResolvedValueOnce({ id: 'main-video-1' })
    const mainChannel = {
      id: 'channel-1',
      guild: { id: 'guild-1', premiumTier: 0 },
      send: mainSend,
    }
    const deleteVideo = vi.fn().mockResolvedValue(undefined)
    const videoMessage = {
      id: 'video-message-2',
      attachments: {
        size: 1,
        first: () => ({
          url: 'https://cdn.invalid/video-2.mp4',
          name: 'video-2.mp4',
        }),
      },
      delete: deleteVideo,
    }
    const deleteCard = vi.fn().mockResolvedValue(undefined)
    const editCard = vi.fn().mockResolvedValue(undefined)
    const originalCard = { id: 'card-message-2', delete: deleteCard, edit: editCard }
    const sourceSend = vi.fn().mockResolvedValue({ id: 'notice-message-2' })
    const fetchMessage = vi.fn((messageId: string) => Promise.resolve(
      messageId === 'video-message-2' ? videoMessage : originalCard
    ))
    const followUp = vi.fn().mockResolvedValue(undefined)
    const editReply = vi.fn().mockResolvedValue(undefined)
    mockGetRequestById.mockResolvedValue({
      id: 'request-2',
      videoModel: 'wan',
      startedAt: new Date('2026-08-21T11:00:00Z'),
      completedAt: new Date('2026-08-21T11:02:00Z'),
      isNSFW: true,
      discordCardMessageId: 'card-message-2',
      discordVideoMessageId: 'video-message-2',
      user: { discordId: 'requester-2' },
    })
    const bot = discordBot as unknown as { getChannel: ReturnType<typeof vi.fn> }
    bot.getChannel = vi.fn().mockResolvedValue(mainChannel)
    const handler = discordClientHandlers.get('interactionCreate')

    await handler?.({
      isButton: () => true,
      customId: 'move_video:request-2',
      deferUpdate: vi.fn().mockResolvedValue(undefined),
      channelId: 'nsfw-channel-1',
      channel: { messages: { fetch: fetchMessage }, send: sourceSend },
      followUp,
      editReply,
      user: { id: 'mover-2' },
      guildId: 'guild-1',
    })

    expect(bot.getChannel).toHaveBeenCalledWith(false)
    expect(mainSend).toHaveBeenCalledTimes(2)
    expect(mockFetch).toHaveBeenCalledWith('https://cdn.invalid/video-2.mp4', {
      method: 'GET',
      signal: expect.any(AbortSignal),
    })
    expect(mainSend.mock.invocationCallOrder[1]).toBeLessThan(deleteVideo.mock.invocationCallOrder[0])
    expect(deleteVideo.mock.invocationCallOrder[0]).toBeLessThan(deleteCard.mock.invocationCallOrder[0])
    expect(deleteCard.mock.invocationCallOrder[0]).toBeLessThan(sourceSend.mock.invocationCallOrder[0])
    const rebuiltContainer = mainSend.mock.calls[0][0].components[0]
    expect(rebuiltContainer.accentColor).toBe(0x10b981)
    expect(rebuiltContainer.textComponents[0].content).not.toContain(' NSFW]')
    expect(mainSend.mock.calls[0][0].allowedMentions).toEqual({ parse: [] })

    const noticeContainer = sourceSend.mock.calls[0][0].components[0]
    expect(noticeContainer.accentColor).toBe(0xff6b6b)
    expect(noticeContainer.textComponents[0].content).toContain(' NSFW]')
    expect(noticeContainer.textComponents[1].content).toBe(
      '해당 영상은 <@mover-2>님이 일반 채널로 이동했습니다.'
    )
    const linkButton = noticeContainer.actionRowComponents[0].components[0]
    expect(linkButton.label).toBe('일반 채널에서 보기')
    expect(linkButton.url).toBe(
      'https://discord.com/channels/guild-1/channel-1/main-card-1'
    )
    expect(editReply).toHaveBeenCalledWith({ components: [] })
    expect(deleteCard).toHaveBeenCalledTimes(1)
    expect(editCard).not.toHaveBeenCalled()
    expect(mockUpdateDiscordMessageIds).toHaveBeenCalledWith(
      'request-2',
      'main-card-1',
      'main-video-1'
    )
    expect(followUp).not.toHaveBeenCalled()
  })

  it('continues the successful move when deleting the original card fails', async () => {
    vi.stubEnv('DISCORD_NSFW_CHANNEL_ID', 'nsfw-channel-1')
    const { discordBot } = await import('@/lib/discord-bot')
    const targetCardMessage = {
      id: 'target-card-1',
      delete: vi.fn().mockResolvedValue(undefined),
    }
    const targetSend = vi.fn()
      .mockResolvedValueOnce(targetCardMessage)
      .mockResolvedValueOnce({ id: 'target-video-1' })
    const targetChannel = {
      id: 'nsfw-channel-1',
      guild: { id: 'guild-1', premiumTier: 0 },
      send: targetSend,
    }
    const deleteVideo = vi.fn().mockResolvedValue(undefined)
    const videoMessage = {
      id: 'source-video-1',
      attachments: {
        size: 1,
        first: () => ({
          url: 'https://cdn.invalid/source-video.mp4',
          name: 'source-video.mp4',
        }),
      },
      delete: deleteVideo,
    }
    const deleteCard = vi.fn().mockRejectedValue(new Error('card delete failed'))
    const editCard = vi.fn()
    const cardMessage = { id: 'source-card-1', delete: deleteCard, edit: editCard }
    const fetchMessage = vi.fn((messageId: string) => Promise.resolve(
      messageId === 'source-video-1' ? videoMessage : cardMessage
    ))
    const sourceSend = vi.fn().mockResolvedValue({ id: 'notice-message-1' })
    const editReply = vi.fn().mockResolvedValue(undefined)
    const followUp = vi.fn().mockResolvedValue(undefined)
    mockGetRequestById.mockResolvedValue({
      id: 'request-delete-failure',
      videoModel: 'wan',
      isNSFW: false,
      discordCardMessageId: 'source-card-1',
      discordVideoMessageId: 'source-video-1',
      user: { discordId: 'requester-1' },
    })
    const bot = discordBot as unknown as { getChannel: ReturnType<typeof vi.fn> }
    bot.getChannel = vi.fn().mockResolvedValue(targetChannel)
    const handler = discordClientHandlers.get('interactionCreate')

    await handler?.({
      isButton: () => true,
      customId: 'move_video:request-delete-failure',
      deferUpdate: vi.fn().mockResolvedValue(undefined),
      channelId: 'channel-1',
      channel: { messages: { fetch: fetchMessage }, send: sourceSend },
      followUp,
      editReply,
      user: { id: 'mover-1' },
      guildId: 'guild-1',
    })

    expect(deleteVideo).toHaveBeenCalledTimes(1)
    expect(deleteCard).toHaveBeenCalledTimes(1)
    expect(editCard).not.toHaveBeenCalled()
    expect(sourceSend).toHaveBeenCalledTimes(1)
    expect(editReply).toHaveBeenCalledWith({ components: [] })
    expect(mockUpdateDiscordMessageIds).toHaveBeenCalledWith(
      'request-delete-failure',
      'target-card-1',
      'target-video-1'
    )
    expect(followUp).not.toHaveBeenCalled()
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to delete original card after video move',
      expect.objectContaining({
        requestId: 'request-delete-failure',
        cardMessageId: 'source-card-1',
      })
    )
  })

  it('moves a relocated result back using the newly persisted message ids', async () => {
    vi.stubEnv('DISCORD_NSFW_CHANNEL_ID', 'nsfw-channel-1')
    const { discordBot } = await import('@/lib/discord-bot')
    const currentRequest = {
      id: 'roundtrip-request-1',
      videoModel: 'wan',
      startedAt: new Date('2026-08-21T12:00:00Z'),
      completedAt: new Date('2026-08-21T12:01:00Z'),
      isNSFW: false,
      discordCardMessageId: 'source-card-1',
      discordVideoMessageId: 'source-video-1',
      user: { discordId: 'requester-1' },
    }
    mockGetRequestById.mockImplementation(async () => ({ ...currentRequest }))
    mockUpdateDiscordMessageIds.mockImplementation(async (
      _requestId: string,
      cardMessageId: string,
      videoMessageId: string
    ) => {
      currentRequest.discordCardMessageId = cardMessageId
      currentRequest.discordVideoMessageId = videoMessageId
    })

    const sourceVideoDelete = vi.fn().mockResolvedValue(undefined)
    const sourceVideo = {
      id: 'source-video-1',
      attachments: {
        size: 1,
        first: () => ({ url: 'https://cdn.invalid/source.mp4', name: 'source.mp4' }),
      },
      delete: sourceVideoDelete,
    }
    const sourceCardDelete = vi.fn().mockResolvedValue(undefined)
    const sourceCardEdit = vi.fn().mockResolvedValue(undefined)
    const sourceCard = { id: 'source-card-1', delete: sourceCardDelete, edit: sourceCardEdit }
    const sourceNoticeSend = vi.fn().mockResolvedValue({ id: 'source-notice-1' })
    const sourceFetch = vi.fn((messageId: string) => Promise.resolve(
      messageId === 'source-video-1' ? sourceVideo : sourceCard
    ))

    const nsfwCardEdit = vi.fn().mockResolvedValue(undefined)
    const nsfwCard = {
      id: 'nsfw-card-1',
      edit: nsfwCardEdit,
      delete: vi.fn().mockResolvedValue(undefined),
    }
    const nsfwNoticeSend = vi.fn().mockResolvedValue({ id: 'nsfw-notice-1' })
    const nsfwVideoDelete = vi.fn().mockResolvedValue(undefined)
    const nsfwVideo = {
      id: 'nsfw-video-1',
      attachments: {
        size: 1,
        first: () => ({ url: 'https://cdn.invalid/nsfw.mp4', name: 'nsfw.mp4' }),
      },
      delete: nsfwVideoDelete,
    }
    const nsfwSend = vi.fn()
      .mockResolvedValueOnce(nsfwCard)
      .mockResolvedValueOnce(nsfwVideo)
    const nsfwChannel = {
      id: 'nsfw-channel-1',
      guild: { id: 'guild-1', premiumTier: 0 },
      send: nsfwSend,
    }
    const nsfwFetch = vi.fn((messageId: string) => Promise.resolve(
      messageId === 'nsfw-video-1' ? nsfwVideo : nsfwCard
    ))

    const mainCard = {
      id: 'main-card-1',
      delete: vi.fn().mockResolvedValue(undefined),
    }
    const mainVideo = { id: 'main-video-1' }
    const mainSend = vi.fn()
      .mockResolvedValueOnce(mainCard)
      .mockResolvedValueOnce(mainVideo)
    const mainChannel = {
      id: 'channel-1',
      guild: { id: 'guild-1', premiumTier: 0 },
      send: mainSend,
    }

    const bot = discordBot as unknown as { getChannel: ReturnType<typeof vi.fn> }
    bot.getChannel = vi.fn((isNSFW: boolean) => Promise.resolve(
      isNSFW ? nsfwChannel : mainChannel
    ))
    const handler = discordClientHandlers.get('interactionCreate')

    await handler?.({
      isButton: () => true,
      customId: 'move_video:roundtrip-request-1',
      deferUpdate: vi.fn().mockResolvedValue(undefined),
      channelId: 'channel-1',
      channel: { messages: { fetch: sourceFetch }, send: sourceNoticeSend },
      followUp: vi.fn().mockResolvedValue(undefined),
      editReply: vi.fn().mockResolvedValue(undefined),
      user: { id: 'mover-1' },
      guildId: 'guild-1',
    })

    expect(mockUpdateDiscordMessageIds).toHaveBeenNthCalledWith(
      1,
      'roundtrip-request-1',
      'nsfw-card-1',
      'nsfw-video-1'
    )
    expect(sourceCardDelete).toHaveBeenCalledTimes(1)
    expect(sourceCardEdit).not.toHaveBeenCalled()
    expect(sourceNoticeSend).toHaveBeenCalledTimes(1)

    await handler?.({
      isButton: () => true,
      customId: 'move_video:roundtrip-request-1',
      deferUpdate: vi.fn().mockResolvedValue(undefined),
      channelId: 'nsfw-channel-1',
      channel: { messages: { fetch: nsfwFetch }, send: nsfwNoticeSend },
      followUp: vi.fn().mockResolvedValue(undefined),
      editReply: vi.fn().mockResolvedValue(undefined),
      user: { id: 'mover-2' },
      guildId: 'guild-1',
    })

    expect(nsfwFetch).toHaveBeenNthCalledWith(1, 'nsfw-video-1')
    expect(nsfwFetch).toHaveBeenNthCalledWith(2, 'nsfw-card-1')
    expect(nsfwVideoDelete).toHaveBeenCalledTimes(1)
    expect(nsfwCard.delete).toHaveBeenCalledTimes(1)
    expect(nsfwCardEdit).not.toHaveBeenCalled()
    expect(nsfwNoticeSend).toHaveBeenCalledTimes(1)
    expect(mockUpdateDiscordMessageIds).toHaveBeenNthCalledWith(
      2,
      'roundtrip-request-1',
      'main-card-1',
      'main-video-1'
    )
    expect(bot.getChannel).toHaveBeenNthCalledWith(1, true)
    expect(bot.getChannel).toHaveBeenNthCalledWith(2, false)
  })

  it('cleans up the rebuilt card without touching originals when upload fails', async () => {
    vi.stubEnv('DISCORD_NSFW_CHANNEL_ID', 'nsfw-channel-1')
    const { discordBot } = await import('@/lib/discord-bot')
    const nsfwCardDelete = vi.fn().mockResolvedValue(undefined)
    const nsfwCardMessage = { id: 'nsfw-card-1', delete: nsfwCardDelete }
    const nsfwChannel = {
      id: 'nsfw-channel-1',
      guild: { id: 'guild-1', premiumTier: 0 },
      send: vi.fn()
        .mockResolvedValueOnce(nsfwCardMessage)
        .mockRejectedValueOnce(new Error('upload unavailable')),
    }
    const deleteVideo = vi.fn().mockResolvedValue(undefined)
    const fetchVideo = vi.fn().mockResolvedValue({
      id: 'video-message-1',
      attachments: {
        size: 1,
        first: () => ({
          url: 'https://cdn.invalid/video-1.mp4',
          name: 'video-1.mp4',
        }),
      },
      delete: deleteVideo,
    })
    const followUp = vi.fn().mockResolvedValue(undefined)
    const editReply = vi.fn().mockResolvedValue(undefined)
    mockGetRequestById.mockResolvedValue({
      id: 'request-1',
      videoModel: 'wan',
      startedAt: new Date('2026-08-21T10:00:00Z'),
      completedAt: new Date('2026-08-21T10:01:00Z'),
      isNSFW: false,
      discordCardMessageId: 'card-message-1',
      discordVideoMessageId: 'video-message-1',
      user: { discordId: 'requester-1' },
    })
    const bot = discordBot as unknown as { getChannel: ReturnType<typeof vi.fn> }
    bot.getChannel = vi.fn().mockResolvedValue(nsfwChannel)
    const handler = discordClientHandlers.get('interactionCreate')

    await handler?.({
      isButton: () => true,
      customId: 'move_video:request-1',
      deferUpdate: vi.fn().mockResolvedValue(undefined),
      channelId: 'channel-1',
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
      content: '영상을 대상 채널로 이동하지 못했습니다. 다시 시도해주세요.',
      flags: 64,
    })
  })

  it('cleans up the rebuilt card when the downloaded video exceeds the target limit', async () => {
    vi.stubEnv('DISCORD_NSFW_CHANNEL_ID', 'nsfw-channel-1')
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(10 * 1024 * 1024)),
    })
    const { discordBot } = await import('@/lib/discord-bot')
    const targetCardDelete = vi.fn().mockResolvedValue(undefined)
    const targetCardMessage = { id: 'nsfw-card-1', delete: targetCardDelete }
    const targetSend = vi.fn().mockResolvedValue(targetCardMessage)
    const targetChannel = {
      id: 'nsfw-channel-1',
      guild: { id: 'guild-1', premiumTier: 0 },
      send: targetSend,
    }
    const deleteVideo = vi.fn().mockResolvedValue(undefined)
    const fetchVideo = vi.fn().mockResolvedValue({
      id: 'video-message-1',
      attachments: {
        size: 1,
        first: () => ({
          url: 'https://cdn.invalid/large-video.mp4',
          name: 'large-video.mp4',
        }),
      },
      delete: deleteVideo,
    })
    const followUp = vi.fn().mockResolvedValue(undefined)
    const editReply = vi.fn().mockResolvedValue(undefined)
    mockGetRequestById.mockResolvedValue({
      id: 'request-1',
      videoModel: 'wan',
      startedAt: new Date('2026-08-21T10:00:00Z'),
      completedAt: new Date('2026-08-21T10:01:00Z'),
      isNSFW: false,
      discordCardMessageId: 'card-message-1',
      discordVideoMessageId: 'video-message-1',
      user: { discordId: 'requester-1' },
    })
    const bot = discordBot as unknown as { getChannel: ReturnType<typeof vi.fn> }
    bot.getChannel = vi.fn().mockResolvedValue(targetChannel)
    const handler = discordClientHandlers.get('interactionCreate')

    await handler?.({
      isButton: () => true,
      customId: 'move_video:request-1',
      deferUpdate: vi.fn().mockResolvedValue(undefined),
      channelId: 'channel-1',
      channel: { messages: { fetch: fetchVideo } },
      followUp,
      editReply,
      user: { id: 'mover-1' },
      guildId: 'guild-1',
    })

    expect(targetSend).toHaveBeenCalledTimes(1)
    expect(targetCardDelete).toHaveBeenCalledTimes(1)
    expect(deleteVideo).not.toHaveBeenCalled()
    expect(editReply).not.toHaveBeenCalled()
    expect(followUp).toHaveBeenCalledWith({
      content: '영상 파일이 대상 채널의 Discord 업로드 제한을 초과했습니다.',
      flags: 64,
    })
  })

  it('aborts the video move when another bot process already acknowledged it', async () => {
    await import('@/lib/discord-bot')
    const ackError = new MockDiscordAPIError(40060, 400)
    const deferUpdate = vi.fn().mockRejectedValue(ackError)
    const fetchVideo = vi.fn()
    const followUp = vi.fn()
    const handler = discordClientHandlers.get('interactionCreate')

    await handler?.({
      isButton: () => true,
      customId: 'move_video:request-1',
      guildId: 'guild-1',
      deferUpdate,
      channel: { messages: { fetch: fetchVideo } },
      followUp,
    })

    expect(deferUpdate).toHaveBeenCalledTimes(1)
    expect(fetchVideo).not.toHaveBeenCalled()
    expect(mockGetRequestById).not.toHaveBeenCalled()
    expect(followUp).not.toHaveBeenCalled()
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Video move interaction was lost or already handled by another process',
      expect.objectContaining({ code: 40060 })
    )
  })

  it('reports an already moved video when the original message is gone', async () => {
    await import('@/lib/discord-bot')
    const fetchVideo = vi.fn().mockRejectedValue(new MockDiscordAPIError(10008, 404))
    const followUp = vi.fn().mockResolvedValue(undefined)
    mockGetRequestById.mockResolvedValue({
      discordCardMessageId: 'card-message-1',
      discordVideoMessageId: 'video-message-1',
    })
    const handler = discordClientHandlers.get('interactionCreate')

    await handler?.({
      isButton: () => true,
      customId: 'move_video:request-1',
      guildId: 'guild-1',
      deferUpdate: vi.fn().mockResolvedValue(undefined),
      channel: { messages: { fetch: fetchVideo } },
      followUp,
    })

    expect(mockGetRequestById).toHaveBeenCalledWith('request-1')
    expect(fetchVideo).toHaveBeenCalledWith('video-message-1')
    expect(followUp).toHaveBeenCalledWith({
      content: '이미 이동되었거나 찾을 수 없는 영상입니다.',
      flags: 64,
    })
  })

  it('reports an unavailable video when stored Discord message ids are missing', async () => {
    await import('@/lib/discord-bot')
    const fetchMessage = vi.fn()
    const followUp = vi.fn().mockResolvedValue(undefined)
    mockGetRequestById.mockResolvedValue({
      discordCardMessageId: 'card-message-1',
      discordVideoMessageId: null,
    })
    const handler = discordClientHandlers.get('interactionCreate')

    await handler?.({
      isButton: () => true,
      customId: 'move_video:request-1',
      guildId: 'guild-1',
      deferUpdate: vi.fn().mockResolvedValue(undefined),
      channel: { messages: { fetch: fetchMessage } },
      followUp,
    })

    expect(fetchMessage).not.toHaveBeenCalled()
    expect(followUp).toHaveBeenCalledWith({
      content: '이미 이동되었거나 찾을 수 없는 영상입니다.',
      flags: 64,
    })
  })

  it('reports a missing queue request without moving the video', async () => {
    await import('@/lib/discord-bot')
    const deleteVideo = vi.fn()
    const fetchVideo = vi.fn().mockResolvedValue({
      id: 'video-message-1',
      attachments: {
        size: 1,
        first: () => ({
          url: 'https://cdn.invalid/video-1.mp4',
          name: 'video-1.mp4',
        }),
      },
      delete: deleteVideo,
    })
    const followUp = vi.fn().mockResolvedValue(undefined)
    mockGetRequestById.mockResolvedValue(null)
    const handler = discordClientHandlers.get('interactionCreate')

    await handler?.({
      isButton: () => true,
      customId: 'move_video:request-1',
      guildId: 'guild-1',
      deferUpdate: vi.fn().mockResolvedValue(undefined),
      channel: { messages: { fetch: fetchVideo } },
      followUp,
    })

    expect(mockGetRequestById).toHaveBeenCalledWith('request-1')
    expect(fetchVideo).not.toHaveBeenCalled()
    expect(mockFetch).not.toHaveBeenCalled()
    expect(deleteVideo).not.toHaveBeenCalled()
    expect(followUp).toHaveBeenCalledWith({
      content: '요청 정보를 찾을 수 없습니다.',
      flags: 64,
    })
  })

  it('rejects a concurrent move for the same request while one is in flight', async () => {
    await import('@/lib/discord-bot')
    let resolveFirstFetch: ((message: unknown) => void) | undefined
    const firstFetch = vi.fn(() => new Promise((resolve) => {
      resolveFirstFetch = resolve
    }))
    const firstFollowUp = vi.fn().mockResolvedValue(undefined)
    const secondFetch = vi.fn()
    const secondFollowUp = vi.fn().mockResolvedValue(undefined)
    mockGetRequestById.mockResolvedValue({
      discordCardMessageId: 'card-message-1',
      discordVideoMessageId: 'video-message-1',
    })
    const handler = discordClientHandlers.get('interactionCreate')

    const firstMove = Promise.resolve(handler?.({
      isButton: () => true,
      customId: 'move_video:request-1',
      guildId: 'guild-1',
      deferUpdate: vi.fn().mockResolvedValue(undefined),
      channel: { messages: { fetch: firstFetch } },
      followUp: firstFollowUp,
    }))
    await vi.waitFor(() => expect(firstFetch).toHaveBeenCalledWith('video-message-1'))

    await handler?.({
      isButton: () => true,
      customId: 'move_video:request-1',
      guildId: 'guild-1',
      deferUpdate: vi.fn().mockResolvedValue(undefined),
      channel: { messages: { fetch: secondFetch } },
      followUp: secondFollowUp,
    })

    expect(secondFetch).not.toHaveBeenCalled()
    expect(secondFollowUp).toHaveBeenCalledWith({
      content: '이미 처리 중이거나 이동된 영상입니다.',
      flags: 64,
    })

    resolveFirstFetch?.({
      id: 'video-message-1',
      attachments: new Map(),
    })
    await firstMove

    const thirdFetch = vi.fn().mockResolvedValue({
      id: 'video-message-1',
      attachments: new Map(),
    })
    await handler?.({
      isButton: () => true,
      customId: 'move_video:request-1',
      guildId: 'guild-1',
      deferUpdate: vi.fn().mockResolvedValue(undefined),
      channel: { messages: { fetch: thirdFetch } },
      followUp: vi.fn().mockResolvedValue(undefined),
    })
    expect(thirdFetch).toHaveBeenCalledWith('video-message-1')
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
      client: { isReady: ReturnType<typeof vi.fn> }
      getChannel: ReturnType<typeof vi.fn>
      sendVideoToDiscord: typeof discordBot.sendVideoToDiscord
    }
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

  it('defers a legacy extended prompt interaction before lookup and edits the reply', async () => {
    vi.stubEnv('DISCORD_NSFW_CHANNEL_ID', 'nsfw-channel-1')
    await import('@/lib/discord-bot')
    mockGetRequestById.mockResolvedValue({
      id: 'request-1',
      prompt: 'test prompt',
      videoModel: 'ltxa',
      audioFile: 'reference.wav',
      videoDuration: 7,
      videoDurationSeconds: 2.4,
      discordVideoMessageId: 'stored-video-message-1',
    })
    const interaction = createPromptInteraction('show_prompt:request-1:video-message-1')
    const handler = discordClientHandlers.get('interactionCreate')

    await handler?.(interaction)

    expect(interaction.deferReply).toHaveBeenCalledWith({ flags: 64 })
    expect(interaction.deferReply.mock.invocationCallOrder[0]).toBeLessThan(
      mockGetRequestById.mock.invocationCallOrder[0]
    )
    expect(interaction.editReply).toHaveBeenCalledWith(expect.objectContaining({
      content: [
        '**레퍼런스 오디오:** 사용',
        '**영상 길이:** 2.4초',
        '```',
        'test prompt',
        '```',
      ].join('\n'),
    }))
    expect(interaction.reply).not.toHaveBeenCalled()
    const moveButton = interaction.editReply.mock.calls[0][0].components[0].components[0]
    expect(mockGetRequestById).toHaveBeenCalledWith('request-1')
    expect(moveButton.label).toBe('NSFW 채널로 이동')
    expect(moveButton.style).toBe(2)
    expect(moveButton.customId).toBe(
      'move_video:request-1'
    )
  })

  it('labels the prompt move button for the main channel on an NSFW-origin card', async () => {
    vi.stubEnv('DISCORD_NSFW_CHANNEL_ID', 'nsfw-channel-1')
    await import('@/lib/discord-bot')
    mockGetRequestById.mockResolvedValue({
      id: 'request-2',
      prompt: 'test prompt',
      videoModel: 'ltxr',
      audioFile: null,
      videoDuration: 5,
      videoDurationSeconds: null,
      discordVideoMessageId: 'stored-video-message-2',
    })
    const interaction = createPromptInteraction('show_prompt:request-2:video-message-2', {
      channelId: 'nsfw-channel-1',
    })
    const handler = discordClientHandlers.get('interactionCreate')

    await handler?.(interaction)

    const moveButton = interaction.editReply.mock.calls[0][0].components[0].components[0]
    expect(moveButton.label).toBe('일반 채널로 이동')
    expect(moveButton.customId).toBe(
      'move_video:request-2'
    )
  })

  it('includes the NSFW move button when attaching a long prompt', async () => {
    vi.stubEnv('DISCORD_NSFW_CHANNEL_ID', 'nsfw-channel-1')
    await import('@/lib/discord-bot')
    mockGetRequestById.mockResolvedValue({
      id: 'request-1',
      prompt: 'a'.repeat(1801),
      videoModel: 'ltx-wan',
      audioFile: null,
      videoDuration: 5,
      videoDurationSeconds: null,
      discordVideoMessageId: 'stored-video-message-1',
    })
    const interaction = createPromptInteraction('show_prompt:request-1:video-message-1')
    const handler = discordClientHandlers.get('interactionCreate')

    await handler?.(interaction)

    expect(interaction.editReply).toHaveBeenCalledWith(expect.objectContaining({
      content: [
        '**레퍼런스 오디오:** 없음',
        '**영상 길이:** 5초',
      ].join('\n'),
    }))
    expect(interaction.editReply.mock.calls[0][0].files[0].options).toEqual({
      name: 'prompt-request-1.txt',
    })
    const moveButton = interaction.editReply.mock.calls[0][0].components[0].components[0]
    expect(moveButton.customId).toBe(
      'move_video:request-1'
    )
  })

  it('keeps old prompt button ids working without a move button', async () => {
    vi.stubEnv('DISCORD_NSFW_CHANNEL_ID', 'nsfw-channel-1')
    await import('@/lib/discord-bot')
    mockGetRequestById.mockResolvedValue({
      id: 'legacy-request-1',
      prompt: 'legacy prompt',
      videoModel: 'h3-fl2va',
      audioFile: null,
      videoDuration: 6,
      videoDurationSeconds: null,
      discordCardMessageId: null,
      discordVideoMessageId: null,
    })
    const interaction = createPromptInteraction('show_prompt:legacy-request-1')
    const handler = discordClientHandlers.get('interactionCreate')

    await handler?.(interaction)

    expect(mockGetRequestById).toHaveBeenCalledWith('legacy-request-1')
    expect(interaction.editReply).toHaveBeenCalledWith({
      content: [
        '**영상 길이:** 6초',
        '```',
        'legacy prompt',
        '```',
      ].join('\n'),
    })
  })

  it('omits the move button when the NSFW channel is not configured', async () => {
    await import('@/lib/discord-bot')
    mockGetRequestById.mockResolvedValue({
      id: 'request-1',
      prompt: 'test prompt',
      videoModel: 'wan',
      audioFile: null,
      videoDuration: 5,
      videoDurationSeconds: null,
      discordVideoMessageId: 'stored-video-message-1',
    })
    const interaction = createPromptInteraction('show_prompt:request-1:video-message-1')
    const handler = discordClientHandlers.get('interactionCreate')

    await handler?.(interaction)

    expect(interaction.editReply).toHaveBeenCalledWith({
      content: [
        '**영상 길이:** 5초',
        '```',
        'test prompt',
        '```',
      ].join('\n'),
    })
  })

  it('shows reference composition and omits zero-count kinds for h3-ref2va', async () => {
    await import('@/lib/discord-bot')
    mockGetRequestById.mockResolvedValue({
      id: 'request-1',
      prompt: 'reference prompt',
      videoModel: 'h3-ref2va',
      videoDuration: 7,
      referenceFiles: [
        { kind: 'IMAGE' },
        { kind: 'AUDIO' },
        { kind: 'IMAGE' },
      ],
    })
    const interaction = createPromptInteraction('show_prompt:request-1')
    const handler = discordClientHandlers.get('interactionCreate')

    await handler?.(interaction)

    expect(interaction.editReply).toHaveBeenCalledWith({
      content: [
        '**레퍼런스:** 이미지 2 · 오디오 1',
        '**영상 길이:** 7초',
        '```',
        'reference prompt',
        '```',
      ].join('\n'),
    })
  })

  it('omits the reference line when h3-ref2va has no reference rows', async () => {
    await import('@/lib/discord-bot')
    mockGetRequestById.mockResolvedValue({
      id: 'request-1',
      prompt: 'reference prompt',
      videoModel: 'h3-ref2va',
      videoDuration: 7,
      referenceFiles: [],
    })
    const interaction = createPromptInteraction('show_prompt:request-1')
    const handler = discordClientHandlers.get('interactionCreate')

    await handler?.(interaction)

    expect(interaction.editReply).toHaveBeenCalledWith({
      content: [
        '**영상 길이:** 7초',
        '```',
        'reference prompt',
        '```',
      ].join('\n'),
    })
  })

  it.each([10062, 40060])('stops when deferReply fails with handled interaction error %s', async (code) => {
    await import('@/lib/discord-bot')
    const interaction = createPromptInteraction('show_prompt:request-1', {
      deferReply: vi.fn().mockRejectedValue(new MockDiscordAPIError(code, 400)),
    })
    const handler = discordClientHandlers.get('interactionCreate')

    await handler?.(interaction)

    expect(interaction.deferReply).toHaveBeenCalledWith({ flags: 64 })
    expect(mockGetRequestById).not.toHaveBeenCalled()
    expect(interaction.editReply).not.toHaveBeenCalled()
    expect(interaction.reply).not.toHaveBeenCalled()
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Prompt button interaction was lost or already handled by another process',
      expect.objectContaining({ requestId: 'request-1', code })
    )
  })

  it('edits the deferred reply with failure text when prompt lookup fails', async () => {
    await import('@/lib/discord-bot')
    mockGetRequestById.mockRejectedValue(new Error('database unavailable'))
    const interaction = createPromptInteraction('show_prompt:request-1')
    const handler = discordClientHandlers.get('interactionCreate')

    await handler?.(interaction)

    expect(interaction.deferReply).toHaveBeenCalledWith({ flags: 64 })
    expect(interaction.editReply).toHaveBeenCalledWith({ content: 'Failed to load prompt.' })
    expect(interaction.reply).not.toHaveBeenCalled()
  })

  it('warns when prompt acknowledgement latency exceeds 1500ms', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(5001)
    await import('@/lib/discord-bot')
    mockGetRequestById.mockResolvedValue(null)
    const interaction = createPromptInteraction('show_prompt:request-1', {
      createdTimestamp: 3000,
    })
    const handler = discordClientHandlers.get('interactionCreate')

    await handler?.(interaction)

    expect(mockLogger.debug).toHaveBeenCalledWith(
      'Prompt button acknowledgement latency',
      { requestId: 'request-1', ackLatencyMs: 2001 }
    )
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Prompt button acknowledgement was delayed',
      { requestId: 'request-1', ackLatencyMs: 2001 }
    )
  })

  it('swallows a failed edit of the deferred error reply', async () => {
    await import('@/lib/discord-bot')
    mockGetRequestById.mockRejectedValue(new Error('database unavailable'))
    const interaction = createPromptInteraction('show_prompt:request-1', {
      editReply: vi.fn().mockRejectedValue(new Error('reply unavailable')),
    })
    const handler = discordClientHandlers.get('interactionCreate')

    await expect(handler?.(interaction)).resolves.toBeUndefined()

    expect(interaction.editReply).toHaveBeenCalledTimes(1)
    expect(mockLogger.error).toHaveBeenCalledWith('Failed to send prompt button error reply', expect.objectContaining({
      requestId: 'request-1',
      error: 'reply unavailable',
    }))
  })

  it('does not log in again after a shard error while the client remains ready', async () => {
    const { discordBot } = await import('@/lib/discord-bot')
    const send = vi.fn().mockResolvedValue(undefined)
    const bot = discordBot as unknown as {
      client: {
        isReady: ReturnType<typeof vi.fn>
        login: ReturnType<typeof vi.fn>
      }
      getChannel: ReturnType<typeof vi.fn>
      sendDebugVideoResultMessage: typeof discordBot.sendDebugVideoResultMessage
    }
    bot.client.isReady.mockReturnValue(true)
    bot.getChannel = vi.fn().mockResolvedValue({ send })

    await discordClientHandlers.get('shardError')?.(new Error('gateway failure'))
    await bot.sendDebugVideoResultMessage({ requestId: 'request-1' })

    expect(bot.client.login).not.toHaveBeenCalled()
    expect(send).toHaveBeenCalledTimes(1)
  })

  it('shares one login across two concurrent initialize calls', async () => {
    vi.stubEnv('DISCORD_BOT_TOKEN', 'test-discord-bot-value')
    const { discordBot } = await import('@/lib/discord-bot')
    let resolveLogin: ((value: string) => void) | undefined
    const loginPending = new Promise<string>((resolve) => {
      resolveLogin = resolve
    })
    const bot = discordBot as unknown as {
      client: {
        isReady: ReturnType<typeof vi.fn>
        login: ReturnType<typeof vi.fn>
      }
      initialize: typeof discordBot.initialize
    }
    bot.client.login.mockReturnValue(loginPending)

    const firstInitialize = bot.initialize()
    const secondInitialize = bot.initialize()

    expect(bot.client.login).toHaveBeenCalledTimes(1)
    bot.client.isReady.mockReturnValue(true)
    resolveLogin?.('test-discord-bot-value')
    await Promise.all([firstInitialize, secondInitialize])

    expect(bot.client.login).toHaveBeenCalledTimes(1)
  })

  it('replaces a client destroyed by a failed login before the next initialize', async () => {
    vi.stubEnv('DISCORD_BOT_TOKEN', 'test-discord-bot-value')
    const { discordBot } = await import('@/lib/discord-bot')
    const firstClient = mockDiscordClients[0]
    firstClient.login.mockImplementation(async () => {
      firstClient.ws.destroyed = true
      throw new Error('login failed')
    })

    await expect(discordBot.initialize()).rejects.toThrow('login failed')

    mockDiscordClientSetups.push((client) => {
      client.login.mockImplementation(async () => {
        client.isReady.mockReturnValue(true)
        return 'test-discord-bot-value'
      })
    })
    await discordBot.initialize()

    expect(mockDiscordClients).toHaveLength(2)
    expect(mockDiscordClients[1].login).toHaveBeenCalledTimes(1)
    expect(firstClient.login).toHaveBeenCalledTimes(1)
  })

  it('reconnects with exponential backoff and resets the delay after success', async () => {
    vi.useFakeTimers()
    vi.stubEnv('DISCORD_BOT_TOKEN', 'test-discord-bot-value')
    await import('@/lib/discord-bot')
    const firstClient = mockDiscordClients[0]
    firstClient.isReady.mockReturnValue(true)
    const configureFailure = () => {
      mockDiscordClientSetups.push((client) => {
        client.login.mockImplementation(async () => {
          client.ws.destroyed = true
          throw new Error('login failed')
        })
      })
    }
    const configureSuccess = () => {
      mockDiscordClientSetups.push((client) => {
        client.login.mockImplementation(async () => {
          client.isReady.mockReturnValue(true)
          await discordClientHandlers.get('clientReady')?.(client)
          return 'test-discord-bot-value'
        })
      })
    }

    configureFailure()
    await discordClientHandlers.get('shardDisconnect')?.(undefined, 0)
    await vi.advanceTimersByTimeAsync(4_999)
    expect(mockDiscordClients).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(firstClient.destroy).toHaveBeenCalledTimes(1)
    expect(mockDiscordClients).toHaveLength(2)
    expect(mockDiscordClients[1].login).toHaveBeenCalledTimes(1)

    configureFailure()
    await vi.advanceTimersByTimeAsync(9_999)
    expect(mockDiscordClients).toHaveLength(2)
    await vi.advanceTimersByTimeAsync(1)
    expect(mockDiscordClients).toHaveLength(3)
    expect(mockDiscordClients[2].login).toHaveBeenCalledTimes(1)

    configureSuccess()
    await vi.advanceTimersByTimeAsync(19_999)
    expect(mockDiscordClients).toHaveLength(3)
    await vi.advanceTimersByTimeAsync(1)
    expect(mockDiscordClients).toHaveLength(4)
    expect(mockDiscordClients[3].login).toHaveBeenCalledTimes(1)

    configureSuccess()
    await discordClientHandlers.get('shardDisconnect')?.(undefined, 0)
    await vi.advanceTimersByTimeAsync(4_999)
    expect(mockDiscordClients).toHaveLength(4)
    await vi.advanceTimersByTimeAsync(1)
    expect(mockDiscordClients).toHaveLength(5)
    expect(mockDiscordClients[4].login).toHaveBeenCalledTimes(1)
  })

  it('starts auto-connect immediately and schedules a rejected login without throwing', async () => {
    vi.useFakeTimers()
    vi.stubEnv('DISCORD_BOT_TOKEN', 'test-discord-bot-value')
    const { discordBot } = await import('@/lib/discord-bot')
    const client = mockDiscordClients[0]
    client.login.mockImplementation(async () => {
      client.ws.destroyed = true
      throw new Error('login failed')
    })

    expect(() => discordBot.startAutoConnect()).not.toThrow()
    await vi.advanceTimersByTimeAsync(0)

    expect(client.login).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(1)
  })

  it('keeps only one pending reconnect timer across repeated shard disconnects', async () => {
    vi.useFakeTimers()
    vi.stubEnv('DISCORD_BOT_TOKEN', 'test-discord-bot-value')
    await import('@/lib/discord-bot')
    const firstClient = mockDiscordClients[0]
    firstClient.isReady.mockReturnValue(true)
    mockDiscordClientSetups.push((client) => {
      client.login.mockImplementation(async () => {
        client.isReady.mockReturnValue(true)
        await discordClientHandlers.get('clientReady')?.(client)
        return 'test-discord-bot-value'
      })
    })
    const shardDisconnect = discordClientHandlers.get('shardDisconnect')

    await shardDisconnect?.(undefined, 0)
    await shardDisconnect?.(undefined, 0)

    expect(vi.getTimerCount()).toBe(1)
    await vi.advanceTimersByTimeAsync(5_000)
    expect(firstClient.destroy).toHaveBeenCalledTimes(1)
    expect(mockDiscordClients).toHaveLength(2)
    expect(mockDiscordClients[1].login).toHaveBeenCalledTimes(1)
  })
})
