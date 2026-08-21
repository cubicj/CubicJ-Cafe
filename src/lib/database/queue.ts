import { prisma } from "./prisma";
import { GenerationMode, QueueStatus, ServerType, ReferenceKind } from '@/generated/prisma/enums';
import type { QueueRequestGetPayload } from '@/generated/prisma/models/QueueRequest';
import type { LoRAPresetData } from "@/types";
import { createLogger } from '@/lib/logger';
import { ExpiringCache } from '@/lib/utils/expiring-cache';

const log = createLogger('queue');

const REFERENCE_KIND_ORDER: Record<ReferenceKind, number> = {
  [ReferenceKind.IMAGE]: 0,
  [ReferenceKind.VIDEO]: 1,
  [ReferenceKind.AUDIO]: 2,
};

type QueueStatsData = {
  pending: number;
  processing: number;
  todayCompleted: number;
  total: number;
};

export interface QueueReferenceFileInput {
  kind: ReferenceKind;
  slot: number;
  filename: string;
  blob?: Uint8Array;
  includeSoundtrack?: boolean;
  audioPresetName?: string;
}

interface QueueRequestData {
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
  videoDurationSeconds?: number;
  referenceFiles?: QueueReferenceFileInput[];
  resolutionMode?: string;
  aspectWidth?: number;
  aspectHeight?: number;
}

interface QueueRequestUpdate {
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
  audioPresetName: true,
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
  videoDurationSeconds: true,
  resolutionMode: true,
  aspectWidth: true,
  aspectHeight: true,
} as const;

const QUEUE_LIST_SELECT = {
  ...QUEUE_SELECT_BASE,
  user: {
    select: {
      nickname: true,
      avatar: true,
    },
  },
} as const;

const QUEUE_CLAIM_SELECT = {
  ...QUEUE_SELECT_BASE,
  imageBlob: true,
  endImageBlob: true,
  audioBlob: true,
  user: {
    select: {
      nickname: true,
      discordId: true,
      avatar: true,
    },
  },
} as const;

type QueueListItem = QueueRequestGetPayload<{ select: typeof QUEUE_LIST_SELECT }>;
type ClaimedQueueRequest = QueueRequestGetPayload<{ select: typeof QUEUE_CLAIM_SELECT }>;

const queueListCache = new ExpiringCache<QueueListItem[]>(15000);
const statsCache = new ExpiringCache<QueueStatsData>(30000);

export class QueueService {
  static async createRequest(data: QueueRequestData): Promise<string> {
    const id = await prisma.$transaction(
      async (tx) => {
        const activeCount = await tx.queueRequest.count({
          where: {
            userId: data.userId,
            status: { in: [QueueStatus.PENDING, QueueStatus.PROCESSING] },
          },
        });

        if (activeCount >= 2) {
          throw new Error(`닉네임 "${data.nickname}"은 이미 2개의 요청을 처리 중입니다. 기존 요청이 완료된 후 다시 시도해주세요.`);
        }

        const lastRequest = await tx.queueRequest.findFirst({
          orderBy: { position: 'desc' },
          select: { position: true },
        });
        const nextPosition = (lastRequest?.position || 0) + 1;

        const requestData: Parameters<typeof tx.queueRequest.create>[0]['data'] = {
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
          videoDurationSeconds: data.videoDurationSeconds,
          resolutionMode: data.resolutionMode,
          aspectWidth: data.aspectWidth,
          aspectHeight: data.aspectHeight,
          position: nextPosition,
          status: QueueStatus.PENDING,
        };

        const request = await tx.queueRequest.create({ data: requestData });
        if (data.referenceFiles && data.referenceFiles.length > 0) {
          await tx.queueReferenceFile.createMany({
            data: data.referenceFiles.map((file) => ({
              requestId: request.id,
              kind: file.kind,
              slot: file.slot,
              filename: file.filename,
              blob: file.blob as Uint8Array<ArrayBuffer> | undefined,
              includeSoundtrack: file.includeSoundtrack ?? false,
              audioPresetName: file.audioPresetName,
            })),
          });
        }
        return request.id;
      },
      { isolationLevel: 'Serializable', timeout: 15000 },
    );

    QueueService.invalidateCache();
    return id;
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
      select: QUEUE_LIST_SELECT
    });

    queueListCache.set(queueList);
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
    const updated = await prisma.queueRequest.update({
      where: { id: requestId },
      data: updates
    });

    QueueService.invalidateCache();
    return updated;
  }

  static async clearImageBlobs(requestId: string) {
    await prisma.$transaction(
      async (tx) => {
        await tx.queueRequest.update({
          where: { id: requestId },
          data: {
            imageBlob: null,
            endImageBlob: null,
            audioBlob: null,
          }
        });
        await tx.queueReferenceFile.updateMany({
          where: { requestId },
          data: { blob: null },
        });
      },
      { isolationLevel: 'Serializable', timeout: 15000 },
    );
  }

  static async getReferenceFiles(requestId: string) {
    const files = await prisma.queueReferenceFile.findMany({
      where: { requestId },
      orderBy: [{ kind: 'asc' }, { slot: 'asc' }],
    });

    return files.sort((left, right) => (
      REFERENCE_KIND_ORDER[left.kind] - REFERENCE_KIND_ORDER[right.kind]
      || left.slot - right.slot
    ));
  }

  static invalidateCache() {
    queueListCache.invalidate();
    statsCache.invalidate();
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

  static async getWorkflowDownloadById(requestId: string) {
    return await prisma.queueRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        workflowJson: true,
        videoModel: true,
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

    const cancelled = await prisma.$transaction(
      async (tx) => {
        const request = await tx.queueRequest.findFirst({
          where: whereCondition
        });

        if (!request) {
          throw new Error('취소할 수 있는 요청을 찾을 수 없습니다.');
        }

        const wasProcessing = request.status === QueueStatus.PROCESSING;
        const { jobId, serverId } = request;

        const updated = await tx.queueRequest.update({
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

        await tx.queueReferenceFile.updateMany({
          where: { requestId },
          data: { blob: null },
        });

        return { ...updated, wasProcessing, cancelledJobId: jobId, cancelledServerId: serverId };
      },
      { isolationLevel: 'Serializable', timeout: 15000 },
    );

    QueueService.invalidateCache();
    return cancelled;
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
    const cancelledCount = await prisma.$transaction(
      async (tx) => {
        const pendingRequests = await tx.queueRequest.findMany({
          where: { status: QueueStatus.PENDING },
          select: { id: true },
        });
        const requestIds = pendingRequests.map((request) => request.id);

        if (requestIds.length === 0) {
          return 0;
        }

        await tx.queueReferenceFile.updateMany({
          where: { requestId: { in: requestIds } },
          data: { blob: null },
        });

        const result = await tx.queueRequest.updateMany({
          where: { id: { in: requestIds } },
          data: {
            status: QueueStatus.CANCELLED,
            failedAt: new Date(),
            error: 'ComfyUI 비활성화로 자동 취소됨',
            imageBlob: null,
            endImageBlob: null,
            audioBlob: null,
          }
        });

        return result.count;
      },
      { isolationLevel: 'Serializable', timeout: 15000 },
    );

    QueueService.invalidateCache();
    return cancelledCount;
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

  static async getProcessingRequestIds(): Promise<string[]> {
    const requests = await prisma.queueRequest.findMany({
      where: {
        status: QueueStatus.PROCESSING
      },
      select: {
        id: true
      }
    });

    return requests.map(request => request.id);
  }

  static async getAndClaimNextPendingRequest(): Promise<ClaimedQueueRequest | null> {
    try {
      const claimedRequest = await prisma.$transaction(async (tx) => {
        const nextRequest = await tx.queueRequest.findFirst({
          where: {
            status: QueueStatus.PENDING
          },
          orderBy: [
            { position: 'asc' },
            { createdAt: 'asc' }
          ],
          select: QUEUE_CLAIM_SELECT
        });

        if (!nextRequest) {
          return null;
        }

        log.debug('Atomic claim target', { id: nextRequest.id, position: nextRequest.position, nickname: nextRequest.nickname });

        const updatedRequest = await tx.queueRequest.update({
          where: {
            id: nextRequest.id,
            status: QueueStatus.PENDING
          },
          data: {
            status: QueueStatus.PROCESSING,
            startedAt: new Date()
          },
          select: QUEUE_CLAIM_SELECT
        });

        return updatedRequest;
      }, {
        isolationLevel: 'Serializable'
      });

      if (claimedRequest) {
        QueueService.invalidateCache();
      }

      return claimedRequest;
    } catch (error) {
      log.warn('Atomic next request claim failed', { error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }
}
