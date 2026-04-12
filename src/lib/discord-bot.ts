import { Client, GatewayIntentBits, TextChannel, AttachmentBuilder } from 'discord.js';
import { MODEL_REGISTRY } from './comfyui/workflows/registry';
import type { VideoModel } from './comfyui/workflows/types';
import { createLogger } from '@/lib/logger';

const log = createLogger('discord');

class DiscordBot {
  private client: Client;
  private isInitialized = false;
  private isConnecting = false;
  private cachedChannel: TextChannel | null = null;
  private cachedNsfwChannel: TextChannel | null = null;
  private cachedChannelTimestamp = 0;
  private channelCacheTTL = 300000; // 5분

  constructor() {
    this.client = new Client({
      intents: [GatewayIntentBits.Guilds]
    });
    this.setupErrorHandlers();
  }
  
  private setupErrorHandlers(): void {
    this.client.removeAllListeners();
    this.client.on('error', (error) => {
      log.error('Discord Client error', { error: error.message });
    });
    
    this.client.on('warn', (warning) => {
      log.warn('Discord Client warning', { warning });
    });
    
    this.client.on('disconnect', () => {
      log.info('Discord Bot disconnected');
      this.isInitialized = false;
      this.invalidateChannelCache();
    });

    this.client.on('reconnecting', () => {
      log.info('Discord Bot reconnecting');
    });

    this.client.on('ready', () => {
      log.info('Discord Bot ready', { tag: this.client.user?.tag });
      this.isInitialized = true;
      this.isConnecting = false;
    });

    this.client.on('shardError', (error) => {
      log.error('Discord Shard error', { error: error.message });
      this.isInitialized = false;
    });

    this.client.on('shardDisconnect', () => {
      log.info('Discord Shard disconnected');
      this.isInitialized = false;
      this.invalidateChannelCache();
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized && this.client.isReady()) return;
    if (this.isConnecting) {
      await this.waitForConnection();
      return;
    }

    if (!process.env.DISCORD_BOT_TOKEN) {
      throw new Error('DISCORD_BOT_TOKEN is not configured');
    }

    if (process.env.DISCORD_BOT_TOKEN.includes('production-discord-bot-token') ||
        process.env.DISCORD_BOT_TOKEN.includes('placeholder')) {
      throw new Error('Discord Bot 토큰이 프로덕션 환경에서 제대로 설정되지 않았습니다');
    }

    this.isConnecting = true;

    try {
      log.debug('Discord Bot logging in');
      await this.client.login(process.env.DISCORD_BOT_TOKEN);

      await this.waitForReady(15000);

      log.info('Discord Bot initialized successfully');
    } catch (error) {
      log.error('Failed to initialize Discord Bot', { error: error instanceof Error ? error.message : String(error) });
      this.isInitialized = false;
      this.isConnecting = false;
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }
  
  private async waitForConnection(): Promise<void> {
    const startTime = Date.now();
    const timeout = 30000;
    
    while (this.isConnecting && !this.isInitialized) {
      if (Date.now() - startTime > timeout) {
        throw new Error('연결 대기 타임아웃');
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  private invalidateChannelCache(): void {
    this.cachedChannel = null;
    this.cachedNsfwChannel = null;
    this.cachedChannelTimestamp = 0;
  }

  private async getChannel(isNSFW: boolean): Promise<TextChannel> {
    const now = Date.now();
    const isCacheValid = now - this.cachedChannelTimestamp < this.channelCacheTTL;

    if (isCacheValid) {
      const cached = isNSFW ? this.cachedNsfwChannel : this.cachedChannel;
      if (cached) return cached;
    }

    const guild = await this.client.guilds.fetch(process.env.DISCORD_GUILD_ID!);
    if (!guild) throw new Error(`Guild not found: ${process.env.DISCORD_GUILD_ID}`);

    const channelId = process.env.DISCORD_CHANNEL_ID!;
    const nsfwChannelId = process.env.DISCORD_NSFW_CHANNEL_ID;

    const channel = await guild.channels.fetch(channelId) as TextChannel;
    if (!channel?.isTextBased()) throw new Error(`Channel not found or not text-based: ${channelId}`);
    this.cachedChannel = channel;

    if (nsfwChannelId) {
      const nsfwChannel = await guild.channels.fetch(nsfwChannelId) as TextChannel;
      if (nsfwChannel?.isTextBased()) this.cachedNsfwChannel = nsfwChannel;
    }

    this.cachedChannelTimestamp = now;
    return isNSFW && this.cachedNsfwChannel ? this.cachedNsfwChannel : this.cachedChannel!;
  }

  private async waitForReady(timeout = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.client.isReady()) {
        this.isInitialized = true;
        resolve();
        return;
      }
      
      const timer = setTimeout(() => {
        reject(new Error('Discord Bot 준비 상태 대기 타임아웃'));
      }, timeout);
      
      this.client.once('ready', () => {
        clearTimeout(timer);
        this.isInitialized = true;
        resolve();
      });
    });
  }

  async sendVideoToDiscord(params: {
    videoPath?: string;
    filename?: string;
    subfolder?: string;
    fileType?: string;
    prompt: string;
    username: string;
    userAvatar?: string;
    processingTime?: number;
    inputImage?: string;
    isNSFW?: boolean;
    discordId?: string;
    comfyUIServerUrl?: string;
    videoModel?: string;
  }): Promise<void> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        log.debug('Discord send attempt', { attempt, maxAttempts: 3 });
        await this.sendVideoToDiscordInternal(params);

        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        log.error('Discord send failed', { attempt, maxAttempts: 3, error: lastError.message });
        
        if (attempt < 3) {
          const delay = Math.pow(2, attempt) * 1000;
          log.debug('Retrying after delay', { delay });
          await new Promise(resolve => setTimeout(resolve, delay));

          this.invalidateChannelCache();
        }
      }
    }
    
    throw lastError || new Error('Discord 전송 실패');
  }
  
  private async sendVideoToDiscordInternal(params: {
    videoPath?: string;
    filename?: string;
    subfolder?: string;
    fileType?: string;
    prompt: string;
    username: string;
    userAvatar?: string;
    processingTime?: number;
    inputImage?: string;
    isNSFW?: boolean;
    discordId?: string;
    comfyUIServerUrl?: string;
    videoModel?: string;
  }): Promise<void> {
    if (!this.isInitialized || !this.client.isReady()) {
      log.debug('Discord Bot not ready, attempting initialization');
      await this.initialize();
    }

    if (!this.client.isReady()) {
      throw new Error('Discord Bot 초기화에 실패했습니다');
    }

    if (!process.env.DISCORD_GUILD_ID || !process.env.DISCORD_CHANNEL_ID) {
      throw new Error('DISCORD_GUILD_ID and DISCORD_CHANNEL_ID are required');
    }

    try {
      const channel = await this.getChannel(params.isNSFW ?? false);

      let attachment: AttachmentBuilder;

      if (params.videoPath) {
        attachment = new AttachmentBuilder(params.videoPath);
      } else if (params.filename) {
        const subfolder = params.subfolder || '';
        const serverUrl = params.comfyUIServerUrl || process.env.COMFYUI_API_URL || 'http://127.0.0.1:8188';
        const fileType = params.fileType || 'output';
        const videoUrl = `${serverUrl}/view?filename=${encodeURIComponent(params.filename)}&subfolder=${encodeURIComponent(subfolder)}&type=${fileType}`;

        log.debug('Downloading video from ComfyUI', {
          videoUrl,
          filename: params.filename,
          subfolder,
          type: fileType,
          serverUrl
        });
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        const response = await fetch(videoUrl, {
          method: 'GET',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`비디오 다운로드 실패: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
          throw new Error('다운로드된 비디오 파일이 비어있습니다');
        }
        
        log.debug('Video download complete', { bytes: arrayBuffer.byteLength });
        const buffer = Buffer.from(arrayBuffer);
        attachment = new AttachmentBuilder(buffer, { name: params.filename });
      } else {
        throw new Error('videoPath 또는 filename 중 하나는 반드시 제공되어야 합니다');
      }
      
      const DISCORD_MODEL_NAMES: Partial<Record<VideoModel, string>> = {
        'ltx-wan': 'LTX 2.3+WAN 2.2',
      }
      const modelDisplayName = DISCORD_MODEL_NAMES[params.videoModel as VideoModel]
        ?? MODEL_REGISTRY[params.videoModel as VideoModel]?.displayName
        ?? 'I2V';
      const embed = {
        title: `CubicJ Cafe I2V - ${modelDisplayName} ${params.isNSFW ? '🔞' : ''}`,
        description: `\`\`\`${params.prompt}\`\`\``,
        color: params.isNSFW ? 0xff6b6b : 0x10b981,
        url: process.env.APP_URL || 'https://localhost:3000'
      };

      const mentionText = params.discordId ? `<@${params.discordId}>` : '';
      await channel.send({
        content: mentionText,
        embeds: [embed]
      });

      await channel.send({
        files: [attachment]
      });

      log.info('Video sent to Discord successfully');
    } catch (error) {
      log.error('Failed to send video to Discord', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async sendImageToDiscord(params: {
    imagePath: string;
    prompt: string;
    username: string;
    userAvatar?: string;
    processingTime?: number;
  }): Promise<void> {
    if (!this.isInitialized || !this.client.isReady()) {
      await this.initialize();
    }

    if (!process.env.DISCORD_GUILD_ID || !process.env.DISCORD_CHANNEL_ID) {
      throw new Error('DISCORD_GUILD_ID and DISCORD_CHANNEL_ID are required');
    }

    try {
      const channel = await this.getChannel(false);

      const attachment = new AttachmentBuilder(params.imagePath);
      
      const embed = {
        title: '🎨 AI 이미지 생성 완료',
        description: `**프롬프트:** ${params.prompt}`,
        color: 0x7c3aed,
        author: {
          name: params.username,
          ...(params.userAvatar && params.userAvatar.startsWith('http') && {
            icon_url: params.userAvatar
          })
        },
        fields: [
          {
            name: '⏱️ 처리 시간',
            value: params.processingTime ? `${params.processingTime}초` : '알 수 없음',
            inline: true
          },
          {
            name: '🔗 서비스',
            value: 'CubicJ Cafe',
            inline: true
          }
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: 'CubicJ Cafe'
        },
        url: process.env.APP_URL || 'https://localhost:3000'
      };

      await channel.send({
        embeds: [embed],
        files: [attachment]
      });

      log.info('Image sent to Discord successfully');
    } catch (error) {
      log.error('Failed to send image to Discord', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.isInitialized) {
      this.client.destroy();
      this.isInitialized = false;
      this.invalidateChannelCache();
      log.info('Discord Bot disconnected');
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.client.isReady();
  }
}

declare global {
  var __discordBot: DiscordBot | undefined;
}

export const discordBot = globalThis.__discordBot ?? (globalThis.__discordBot = new DiscordBot());

export type SendImageParams = {
  imagePath: string;
  prompt: string;
  username: string;
  userAvatar?: string;
  processingTime?: number;
};

export type SendVideoParams = {
  videoPath?: string;
  filename?: string;
  subfolder?: string;
  fileType?: string;
  prompt: string;
  username: string;
  userAvatar?: string;
  processingTime?: number;
  inputImage?: string;
  isNSFW?: boolean;
  discordId?: string;
  comfyUIServerUrl?: string;
  videoModel?: string;
};