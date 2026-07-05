import { vi } from 'vitest'

const discordClientHandlers = vi.hoisted(() => new Map<string, (...args: unknown[]) => unknown>())
const mockGetRequestById = vi.hoisted(() => vi.fn())

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
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
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
    delete globalThis.__discordBot
    discordClientHandlers.clear()
    mockGetRequestById.mockReset()
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
    bot.getChannel = vi.fn().mockResolvedValue({ send })

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
})
