import { Client, GatewayIntentBits, TextChannel, AttachmentBuilder } from 'discord.js';
import { MODEL_REGISTRY } from './comfyui/workflows/registry';
import type { VideoModel } from './comfyui/workflows/types';

// Discord Bot 전송 전용 모드
// - 메시지 수신/처리 없음
// - Guild 정보 접근만 허용 (채널/서버 정보)
// - MESSAGE_CREATE, GUILD_UPDATE 등 이벤트 수신 차단
class DiscordBot {
  private client: Client;
  private isInitialized = false;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    // 전송 전용 모드: 최소한의 Intent만 사용 (메시지 수신 차단)
    this.client = new Client({
      intents: [GatewayIntentBits.Guilds] // GuildMessages 제거로 메시지 이벤트 차단
    });
    
    // 에러 핸들링 설정
    this.setupErrorHandlers();
  }
  
  private setupErrorHandlers(): void {
    // 모든 이벤트 리스너 제거 후 새로 등록 (중복 방지)
    this.client.removeAllListeners();
    
    // 전송 전용 모드: 핵심 에러만 처리
    this.client.on('error', (error) => {
      console.error('Discord Client 에러:', error);
      // handle, MESSAGE_CREATE, GUILD_UPDATE 관련 에러는 무시하고 재초기화
      if (error.message && (
        error.message.includes('handle') || 
        error.message.includes('MESSAGE_CREATE') ||
        error.message.includes('GUILD_UPDATE')
      )) {
        console.log('Discord 이벤트 처리 에러 (전송 전용 모드에서 무시) - 재초기화 시도...');
        this.isInitialized = false;
        return;
      }
    });
    
    this.client.on('warn', (warning) => {
      console.warn('Discord Client 경고:', warning);
    });
    
    this.client.on('disconnect', () => {
      console.log('Discord Bot 연결 끊어짐');
      this.isInitialized = false;
    });
    
    this.client.on('reconnecting', () => {
      console.log('Discord Bot 재연결 시도 중...');
    });
    
    this.client.on('ready', () => {
      console.log(`Discord Bot 준비됨: ${this.client.user?.tag}`);
      this.isInitialized = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
    });

    // shardError 이벤트 처리 (handle 에러의 주요 원인)
    this.client.on('shardError', (error) => {
      console.error('Discord Shard 에러:', error);
      this.isInitialized = false;
    });

    // shardDisconnect 이벤트 처리
    this.client.on('shardDisconnect', () => {
      console.log('Discord Shard 연결 끊어짐');
      this.isInitialized = false;
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized && this.client.isReady()) return;
    if (this.isConnecting) {
      // 이미 연결 시도 중이면 대기
      await this.waitForConnection();
      return;
    }

    if (!process.env.DISCORD_BOT_TOKEN) {
      throw new Error('DISCORD_BOT_TOKEN is not configured');
    }

    // 프로덕션 환경에서 플레이스홀더 토큰 검증
    if (process.env.DISCORD_BOT_TOKEN.includes('production-discord-bot-token') ||
        process.env.DISCORD_BOT_TOKEN.includes('placeholder')) {
      throw new Error('Discord Bot 토큰이 프로덕션 환경에서 제대로 설정되지 않았습니다');
    }

    this.isConnecting = true;
    
    try {
      // 기존 연결이 있다면 정리
      if (this.client.readyTimestamp) {
        console.log('기존 Discord 연결을 정리 중...');
        this.client.destroy();
        // 새 클라이언트 인스턴스 생성 (전송 전용)
        this.client = new Client({
          intents: [GatewayIntentBits.Guilds] // 메시지 이벤트 수신 차단
        });
        this.setupErrorHandlers();
      }

      console.log('Discord Bot 로그인 시도 중...');
      await this.client.login(process.env.DISCORD_BOT_TOKEN);
      
      // 준비 상태까지 대기 (최대 15초로 연장)
      await this.waitForReady(15000);
      
      console.log('Discord Bot initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Discord Bot:', error);
      this.isInitialized = false;
      this.isConnecting = false;
      
      // handle 관련 에러인 경우 더 자세한 로그
      if (error instanceof Error && error.message.includes('handle')) {
        console.error('Discord handle 에러 발생. 클라이언트 재생성이 필요할 수 있습니다.');
      }
      
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }
  
  private async waitForConnection(): Promise<void> {
    const startTime = Date.now();
    const timeout = 30000; // 30초 타임아웃
    
    while (this.isConnecting && !this.isInitialized) {
      if (Date.now() - startTime > timeout) {
        throw new Error('연결 대기 타임아웃');
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
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
    // 재시도 로직 (3회 시도)
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Discord 전송 시도 ${attempt}/3`);
        await this.sendVideoToDiscordInternal(params);
        console.log(`Discord 전송 성공 (${attempt}번째 시도)`);
        return; // 성공하면 종료
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`Discord 전송 실패 ${attempt}/3:`, lastError.message);
        
        // handle, MESSAGE_CREATE, GUILD_UPDATE 관련 에러인 경우 특별 처리
        if (lastError.message.includes('handle') || 
            lastError.message.includes('MESSAGE_CREATE') ||
            lastError.message.includes('GUILD_UPDATE')) {
          console.log('Discord 이벤트 처리 에러로 인한 클라이언트 재초기화...');
          this.isInitialized = false;
          // 클라이언트 완전 재생성 (전송 전용)
          this.client.destroy();
          this.client = new Client({
            intents: [GatewayIntentBits.Guilds] // 메시지 이벤트 수신 차단
          });
          this.setupErrorHandlers();
        }
        
        if (attempt < 3) {
          // 다음 시도 전 대기 (지수 백오프)
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`${delay}ms 후 재시도...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // 재초기화 시도
          this.isInitialized = false;
        }
      }
    }
    
    // 모든 시도 실패
    throw lastError || new Error('Discord 전송 실패');
  }
  
  private async sendVideoToDiscordInternal(params: {
    videoPath?: string;
    filename?: string;
    subfolder?: string;
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
    // 초기화 상태와 클라이언트 준비 상태 확인
    if (!this.isInitialized || !this.client.isReady()) {
      console.log('Discord Bot이 준비되지 않음. 초기화 시도...');
      await this.initialize();
    }

    // 초기화 후에도 준비되지 않았다면 에러
    if (!this.client.isReady()) {
      throw new Error('Discord Bot 초기화에 실패했습니다');
    }

    if (!process.env.DISCORD_GUILD_ID) {
      throw new Error('DISCORD_GUILD_ID is not configured');
    }
    
    if (!process.env.DISCORD_CHANNEL_ID) {
      throw new Error('DISCORD_CHANNEL_ID is not configured');
    }

    // NSFW 여부에 따라 채널 선택
    const targetChannelId = params.isNSFW && process.env.DISCORD_NSFW_CHANNEL_ID 
      ? process.env.DISCORD_NSFW_CHANNEL_ID 
      : process.env.DISCORD_CHANNEL_ID!;

    try {
      console.log('Discord Guild 및 Channel 정보:', {
        guildId: process.env.DISCORD_GUILD_ID,
        channelId: targetChannelId,
        isNSFW: params.isNSFW
      });
      
      const guild = await this.client.guilds.fetch(process.env.DISCORD_GUILD_ID!);
      if (!guild) {
        throw new Error(`Guild not found: ${process.env.DISCORD_GUILD_ID}`);
      }
      
      const channel = await guild.channels.fetch(targetChannelId) as TextChannel;
      if (!channel) {
        throw new Error(`Channel not found: ${targetChannelId}`);
      }
      
      if (!channel.isTextBased()) {
        throw new Error(`Channel is not text-based: ${targetChannelId}`);
      }
      
      console.log(`Discord 채널 접근 성공: ${channel.name} (${channel.id})`);

      let attachment: AttachmentBuilder;

      if (params.videoPath) {
        // 로컬 파일 경로가 제공된 경우
        attachment = new AttachmentBuilder(params.videoPath);
      } else if (params.filename) {
        // ComfyUI에서 파일명만 제공된 경우, 직접 다운로드
        const subfolder = params.subfolder || '';
        const serverUrl = params.comfyUIServerUrl || process.env.COMFYUI_API_URL || 'http://localhost:8188';
        const videoUrl = `${serverUrl}/view?filename=${encodeURIComponent(params.filename)}&subfolder=${encodeURIComponent(subfolder)}&type=temp`;
        
        console.log('🎬 ComfyUI에서 비디오 다운로드 중:', {
          videoUrl,
          filename: params.filename,
          subfolder: subfolder,
          type: 'temp',
          serverUrl: serverUrl
        });
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초 타임아웃
        
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
        
        console.log(`비디오 다운로드 완료: ${arrayBuffer.byteLength} bytes`);
        const buffer = Buffer.from(arrayBuffer);
        attachment = new AttachmentBuilder(buffer, { name: params.filename });
      } else {
        throw new Error('videoPath 또는 filename 중 하나는 반드시 제공되어야 합니다');
      }
      
      const modelDisplayName = MODEL_REGISTRY[params.videoModel as VideoModel]?.displayName || 'I2V';
      const embed = {
        title: `🔗 ${modelDisplayName} I2V ${params.isNSFW ? '🔞' : ''}`,
        description: `\`\`\`${params.prompt}\`\`\``,
        color: params.isNSFW ? 0xff6b6b : 0x10b981,
        url: process.env.NEXTAUTH_URL || 'https://localhost:3000'
      };

      // Discord 멘션과 함께 embed 메시지 전송
      const mentionText = params.discordId ? `<@${params.discordId}>` : '';
      await channel.send({
        content: mentionText,
        embeds: [embed]
      });

      // 그 다음에 비디오 파일 전송
      await channel.send({
        files: [attachment]
      });

      console.log('Video sent to Discord successfully');
    } catch (error) {
      console.error('Failed to send video to Discord:', error);
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
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!process.env.DISCORD_GUILD_ID) {
      throw new Error('DISCORD_GUILD_ID is not configured');
    }
    
    if (!process.env.DISCORD_CHANNEL_ID) {
      throw new Error('DISCORD_CHANNEL_ID is not configured');
    }

    try {
      const guild = await this.client.guilds.fetch(process.env.DISCORD_GUILD_ID!);
      const channel = await guild.channels.fetch(process.env.DISCORD_CHANNEL_ID!) as TextChannel;

      if (!channel || !channel.isTextBased()) {
        throw new Error('Channel not found or is not a text channel');
      }

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
        url: process.env.NEXTAUTH_URL || 'https://localhost:3000'
      };

      await channel.send({
        embeds: [embed],
        files: [attachment]
      });

      console.log('Image sent to Discord successfully');
    } catch (error) {
      console.error('Failed to send image to Discord:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.isInitialized) {
      this.client.destroy();
      this.isInitialized = false;
      console.log('Discord Bot disconnected');
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.client.isReady();
  }
}

export const discordBot = new DiscordBot();

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