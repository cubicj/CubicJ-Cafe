import { prisma } from "./prisma";
import { QueueStatus, ServerType, GenerationMode, type QueueRequest } from "@prisma/client";
import type { LoRAPresetData } from "@/types";
import { createLogger } from '@/lib/logger';
import { ExpiringCache } from '@/lib/utils/expiring-cache';

const log = createLogger('queue');

type QueueRequestWithUser = QueueRequest & {
  user: {
    nickname: string;
    avatar: string | null;
    discordId?: string;
  };
};

type QueueStatsData = {
  pending: number;
  processing: number;
  todayCompleted: number;
  total: number;
};

export interface QueueRequestData {
  userId: number;
  nickname: string;
  prompt: string;
  imageFile?: string;
  imageBlob?: Uint8Array;
  endImageFile?: string;
  endImageBlob?: Uint8Array;
  audioFile?: string;
  audioBlob?: Uint8Array;
  audioPresetName?: string;
  loraPreset?: LoRAPresetData;
  isNSFW?: boolean;
  serverType?: ServerType;
  serverId?: string;
  videoModel?: string;
  generationMode?: GenerationMode;
  videoDuration?: number;
}

export interface QueueRequestUpdate {
  status?: QueueStatus;
  jobId?: string;
  serverType?: ServerType;
  serverId?: string;
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
  workflowJson?: string;
}

const QUEUE_SELECT_BASE = {
  id: true,
  userId: true,
  nickname: true,
  status: true,
  prompt: true,
  imageFile: true,
  endImageFile: true,
  audioFile: true,
  loraPresetData: true,
  isNSFW: true,
  jobId: true,
  serverType: true,
  serverId: true,
  position: true,
  createdAt: true,
  startedAt: true,
  completedAt: true,
  failedAt: true,
  error: true,
  videoModel: true,
  generationMode: true,
  videoDuration: true,
} as const;

const queueListCache = new ExpiringCache<QueueRequestWithUser[]>(15000);
const statsCache = new ExpiringCache<QueueStatsData>(30000);

export class QueueService {
  static async getUserActiveRequestCount(userId: number): Promise<number> {
    return await prisma.queueRequest.count({
      where: {
        userId,
        status: {
          in: [QueueStatus.PENDING, QueueStatus.PROCESSING]
        }
      }
    });
  }

  static async createRequest(data: QueueRequestData): Promise<string> {
    const activeCount = await QueueService.getUserActiveRequestCount(data.userId);

    if (activeCount >= 2) {
      throw new Error(`닉네임 "${data.nickname}"은 이미 2개의 요청을 처리 중입니다. 기존 요청이 완료된 후 다시 시도해주세요.`);
    }

    const nextPosition = await QueueService.getNextPosition();

    const requestData: Parameters<typeof prisma.queueRequest.create>[0]['data'] = {
      userId: data.userId,
      nickname: data.nickname,
      prompt: data.prompt,
      imageFile: data.imageFile,
      imageBlob: data.imageBlob as Uint8Array<ArrayBuffer> | undefined,
      endImageFile: data.endImageFile,
      endImageBlob: data.endImageBlob as Uint8Array<ArrayBuffer> | undefined,
      audioFile: data.audioFile,
      audioBlob: data.audioBlob as Uint8Array<ArrayBuffer> | undefined,
      audioPresetName: data.audioPresetName,
      loraPresetData: data.loraPreset ? JSON.stringify(data.loraPreset) : null,
      isNSFW: data.isNSFW || false,
      serverType: data.serverType,
      serverId: data.serverId,
      videoModel: data.videoModel || 'wan',
      generationMode: data.generationMode || GenerationMode.START_ONLY,
      videoDuration: data.videoDuration || 5,
      position: nextPosition,
      status: QueueStatus.PENDING
    };

    const request = await prisma.queueRequest.create({
      data: requestData
    });

    QueueService.invalidateCache();

    return request.id;
  }

  static async getNextPosition(): Promise<number> {
    const lastRequest = await prisma.queueRequest.findFirst({
      orderBy: { position: 'desc' },
      select: { position: true }
    });

    return (lastRequest?.position || 0) + 1;
  }

  static async getQueueList() {
    const cached = queueListCache.get();
    if (cached) return cached;

    const queueList = await prisma.queueRequest.findMany({
      where: {
        status: {
          in: [QueueStatus.PENDING, QueueStatus.PROCESSING, QueueStatus.COMPLETED_WITH_ERROR]
        }
      },
      orderBy: [
        { status: 'desc' },
        { position: 'asc' }
      ],
      select: {
        ...QUEUE_SELECT_BASE,
        user: {
          select: {
            nickname: true,
            avatar: true
          }
        }
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma select return type doesn't match cache generic
    queueListCache.set(queueList as any);
    return queueList;
  }

  static async getNextPendingRequest() {
    return await prisma.queueRequest.findFirst({
      where: {
        status: QueueStatus.PENDING
      },
      orderBy: {
        position: 'asc'
      },
      select: {
        ...QUEUE_SELECT_BASE,
        user: {
          select: {
            nickname: true,
            discordId: true
          }
        }
      }
    });
  }

  static async updateRequest(requestId: string, updates: QueueRequestUpdate) {
    QueueService.invalidateCache();

    return await prisma.queueRequest.update({
      where: { id: requestId },
      data: updates
    });
  }

  static async clearImageBlobs(requestId: string) {
    await prisma.queueRequest.update({
      where: { id: requestId },
      data: {
        imageBlob: null,
        endImageBlob: null,
        audioBlob: null,
      }
    });
  }

  static invalidateCache() {
    queueListCache.invalidate();
    statsCache.invalidate();
  }

  static async updateRequestIfPending(requestId: string, updates: QueueRequestUpdate) {
    try {
      return await prisma.queueRequest.update({
        where: {
          id: requestId,
          status: QueueStatus.PENDING
        },
        data: updates
      });
    } catch (error) {
      log.debug('updateRequestIfPending: request not in PENDING state or not found', { requestId, error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  static async getRequestById(requestId: string) {
    return await prisma.queueRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            nickname: true,
            discordId: true,
            avatar: true
          }
        }
      }
    });
  }

  static async getUserRequests(userId: number, limit: number = 10) {
    return await prisma.queueRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        ...QUEUE_SELECT_BASE,
        user: {
          select: {
            nickname: true,
            avatar: true
          }
        }
      }
    });
  }

  static async getQueueStats() {
    const cached = statsCache.get();
    if (cached) return cached;

    const [pending, processing, todayCompleted] = await Promise.all([
      prisma.queueRequest.count({
        where: { status: QueueStatus.PENDING }
      }),
      prisma.queueRequest.count({
        where: { status: QueueStatus.PROCESSING }
      }),
      prisma.queueRequest.count({
        where: {
          status: { in: [QueueStatus.COMPLETED, QueueStatus.COMPLETED_WITH_ERROR] },
          completedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ]);

    const stats = {
      pending,
      processing,
      todayCompleted,
      total: pending + processing
    };

    statsCache.set(stats);
    return stats;
  }

  static async cancelRequest(requestId: string, userId: number, isAdmin: boolean = false) {
    const whereCondition = isAdmin
      ? {
          id: requestId,
          status: {
            in: [QueueStatus.PENDING, QueueStatus.PROCESSING]
          }
        }
      : {
          id: requestId,
          userId,
          status: {
            in: [QueueStatus.PENDING, QueueStatus.PROCESSING]
          }
        };

    const request = await prisma.queueRequest.findFirst({
      where: whereCondition
    });

    if (!request) {
      throw new Error('취소할 수 있는 요청을 찾을 수 없습니다.');
    }

    const wasProcessing = request.status === QueueStatus.PROCESSING;
    const { jobId, serverId } = request;

    QueueService.invalidateCache();

    const updated = await prisma.queueRequest.update({
      where: { id: requestId },
      data: {
        status: QueueStatus.CANCELLED,
        failedAt: new Date(),
        error: isAdmin ? '관리자가 취소함' : '사용자가 취소함',
        imageBlob: null,
        endImageBlob: null,
        audioBlob: null,
      }
    });

    return { ...updated, wasProcessing, cancelledJobId: jobId, cancelledServerId: serverId };
  }

  static async peekNextPendingPosition(): Promise<number | null> {
    const next = await prisma.queueRequest.findFirst({
      where: { status: QueueStatus.PENDING },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      select: { position: true }
    });
    return next?.position ?? null;
  }

  static async getRequestByPosition(position: number) {
    return await prisma.queueRequest.findFirst({
      where: { position }
    });
  }

  static async cancelAllPending(): Promise<number> {
    const result = await prisma.queueRequest.updateMany({
      where: {
        status: QueueStatus.PENDING
      },
      data: {
        status: QueueStatus.CANCELLED,
        failedAt: new Date(),
        error: 'ComfyUI 비활성화로 자동 취소됨',
        imageBlob: null,
        endImageBlob: null,
        audioBlob: null,
      }
    });

    QueueService.invalidateCache();
    return result.count;
  }

  static async cleanupExpiredRequests() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return await prisma.queueRequest.updateMany({
      where: {
        status: QueueStatus.PROCESSING,
        startedAt: {
          lt: oneDayAgo
        }
      },
      data: {
        status: QueueStatus.FAILED,
        failedAt: new Date(),
        error: '처리 시간 초과로 자동 실패 처리됨'
      }
    });
  }

  static async resetStaleProcessingRequests() {
    const result = await prisma.queueRequest.updateMany({
      where: {
        status: QueueStatus.PROCESSING
      },
      data: {
        status: QueueStatus.PENDING,
        startedAt: null,
        jobId: null,
        serverId: null,
        serverType: null,
      }
    });

    if (result.count > 0) {
      QueueService.invalidateCache();
      log.warn('Reset stale PROCESSING requests to PENDING on startup', { count: result.count });
    }

    return result;
  }

  static async getProcessingCount(): Promise<number> {
    return await prisma.queueRequest.count({
      where: {
        status: QueueStatus.PROCESSING
      }
    });
  }

  static async getAndClaimNextPendingRequest(): Promise<QueueRequestWithUser | null> {
    try {
      return await prisma.$transaction(async (tx) => {
        const nextRequest = await tx.queueRequest.findFirst({
          where: {
            status: QueueStatus.PENDING
          },
          orderBy: [
            { position: 'asc' },
            { createdAt: 'asc' }
          ],
          select: {
            ...QUEUE_SELECT_BASE,
            user: {
              select: {
                nickname: true,
                discordId: true,
                avatar: true
              }
            }
          }
        });

        if (!nextRequest) {
          return null;
        }

        log.info('Atomic claim target', { id: nextRequest.id, position: nextRequest.position, nickname: nextRequest.nickname });

        const updatedRequest = await tx.queueRequest.update({
          where: {
            id: nextRequest.id,
            status: QueueStatus.PENDING
          },
          data: {
            status: QueueStatus.PROCESSING,
            startedAt: new Date()
          },
          select: {
            ...QUEUE_SELECT_BASE,
            user: {
              select: {
                nickname: true,
                discordId: true,
                avatar: true
              }
            }
          }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma transaction return type doesn't match include shape
        return updatedRequest as any;
      }, {
        isolationLevel: 'Serializable'
      });
    } catch (error) {
      log.warn('Atomic next request claim failed', { error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }
}
