import { prisma } from "./prisma";
import { QueueStatus, ServerType, type QueueRequest } from "@prisma/client";
import type { LoRAPresetData } from "@/types";

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
  imagePath?: string; // 임시 파일 경로
  endImageFile?: string; // 끝 이미지 파일명
  endImagePath?: string; // 끝 이미지 임시 파일 경로
  lora?: string;
  loraStrength?: number;
  loraPreset?: LoRAPresetData;
  isNSFW?: boolean;
  duration?: number; // 비디오 길이 (초)
  workflowLength?: number; // 워크플로우 길이
  serverType?: ServerType;
  serverId?: string;
  videoModel?: string;
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
}

export class QueueService {
  async getUserActiveRequestCount(userId: number): Promise<number> {
    return await prisma.queueRequest.count({
      where: {
        userId,
        status: {
          in: [QueueStatus.PENDING, QueueStatus.PROCESSING]
        }
      }
    });
  }

  async createRequest(data: QueueRequestData): Promise<string> {
    const activeCount = await this.getUserActiveRequestCount(data.userId);
    
    if (activeCount >= 2) {
      throw new Error(`닉네임 "${data.nickname}"은 이미 2개의 요청을 처리 중입니다. 기존 요청이 완료된 후 다시 시도해주세요.`);
    }

    const nextPosition = await this.getNextPosition();
    
    // LoRA 프리셋 데이터를 JSON 문자열로 변환
    const requestData = {
      userId: data.userId,
      nickname: data.nickname,
      prompt: data.prompt,
      imageFile: data.imageFile,
      imageData: data.imagePath,
      endImageFile: data.endImageFile,
      endImageData: data.endImagePath,
      lora: data.lora,
      loraStrength: data.loraStrength,
      loraPresetData: data.loraPreset ? JSON.stringify(data.loraPreset) : null,
      isNSFW: data.isNSFW || false,
      duration: data.duration || 5,
      workflowLength: data.workflowLength || (16 * (data.duration || 5) + 1),
      serverType: data.serverType,
      serverId: data.serverId,
      videoModel: data.videoModel || 'wan',
      position: nextPosition,
      status: QueueStatus.PENDING
    };
    
    const request = await prisma.queueRequest.create({
      data: requestData
    });

    // 새 요청 생성 시 캐시 무효화
    this.invalidateCache();

    return request.id;
  }

  async getNextPosition(): Promise<number> {
    const lastRequest = await prisma.queueRequest.findFirst({
      orderBy: { position: 'desc' },
      select: { position: true }
    });
    
    return (lastRequest?.position || 0) + 1;
  }

  // 캐시된 큐 목록
  private queueListCache: { data: QueueRequestWithUser[]; timestamp: number } | null = null;
  private queueListCacheExpiry = 15000; // 15초 캐시

  async getQueueList() {
    // 캐시된 데이터가 있고 만료되지 않았으면 반환
    if (this.queueListCache && Date.now() - this.queueListCache.timestamp < this.queueListCacheExpiry) {
      return this.queueListCache.data;
    }

    const queueList = await prisma.queueRequest.findMany({
      where: {
        status: {
          in: [QueueStatus.PENDING, QueueStatus.PROCESSING]
        }
      },
      orderBy: [
        { status: 'desc' }, // PROCESSING 먼저 (PROCESSING > PENDING)
        { position: 'asc' } // 먼저 들어온 큐가 위에, 나중에 들어온 큐가 아래에
      ],
      include: {
        user: {
          select: {
            nickname: true,
            avatar: true
          }
        }
      }
    });

    // 결과를 캐시에 저장
    this.queueListCache = {
      data: queueList,
      timestamp: Date.now()
    };

    return queueList;
  }

  async getNextPendingRequest() {
    return await prisma.queueRequest.findFirst({
      where: {
        status: QueueStatus.PENDING
      },
      orderBy: {
        position: 'asc'
      },
      include: {
        user: {
          select: {
            nickname: true,
            discordId: true
          }
        }
      }
    });
  }

  async updateRequest(requestId: string, updates: QueueRequestUpdate) {
    // 캐시 무효화
    this.invalidateCache();
    
    return await prisma.queueRequest.update({
      where: { id: requestId },
      data: updates
    });
  }

  // 캐시 무효화 메서드
  private invalidateCache() {
    this.queueListCache = null;
    this.statsCache = null;
  }

  // race condition 방지를 위한 조건부 업데이트
  async updateRequestIfPending(requestId: string, updates: QueueRequestUpdate) {
    try {
      return await prisma.queueRequest.update({
        where: { 
          id: requestId,
          status: QueueStatus.PENDING // PENDING 상태일 때만 업데이트
        },
        data: updates
      });
    } catch {
      // 이미 다른 인스턴스가 처리한 경우 또는 요청이 없는 경우
      return null;
    }
  }

  async getRequestById(requestId: string) {
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

  async getUserRequests(userId: number, limit: number = 10) {
    return await prisma.queueRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            nickname: true,
            avatar: true
          }
        }
      }
    });
  }

  // 캐시된 통계 정보
  private statsCache: { data: QueueStatsData; timestamp: number } | null = null;
  private statsCacheExpiry = 30000; // 30초 캐시

  async getQueueStats() {
    // 캐시된 데이터가 있고 만료되지 않았으면 반환
    if (this.statsCache && Date.now() - this.statsCache.timestamp < this.statsCacheExpiry) {
      return this.statsCache.data;
    }

    const [pending, processing, todayCompleted] = await Promise.all([
      prisma.queueRequest.count({
        where: { status: QueueStatus.PENDING }
      }),
      prisma.queueRequest.count({
        where: { status: QueueStatus.PROCESSING }
      }),
      prisma.queueRequest.count({
        where: {
          status: QueueStatus.COMPLETED,
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

    // 결과를 캐시에 저장
    this.statsCache = {
      data: stats,
      timestamp: Date.now()
    };

    return stats;
  }

  async cancelRequest(requestId: string, userId: number, isAdmin: boolean = false) {
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

    // 캐시 무효화
    this.invalidateCache();

    return await prisma.queueRequest.update({
      where: { id: requestId },
      data: {
        status: QueueStatus.CANCELLED,
        failedAt: new Date(),
        error: isAdmin ? '관리자가 취소함' : '사용자가 취소함'
      }
    });
  }

  async cleanupExpiredRequests() {
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

  async resetProcessingToPending() {
    return await prisma.queueRequest.updateMany({
      where: {
        status: QueueStatus.PROCESSING
      },
      data: {
        status: QueueStatus.PENDING,
        startedAt: null,
        jobId: null
      }
    });
  }

  async getProcessingCount(): Promise<number> {
    return await prisma.queueRequest.count({
      where: {
        status: QueueStatus.PROCESSING
      }
    });
  }

  // 원자적으로 다음 PENDING 요청을 가져와서 PROCESSING으로 변경
  async getAndClaimNextPendingRequest(): Promise<QueueRequestWithUser | null> {
    try {
      // 트랜잭션으로 원자적 처리 (SERIALIZABLE 격리 수준 사용)
      return await prisma.$transaction(async (tx) => {
        // 1. PENDING 상태인 다음 요청을 position 순서로 찾기 (FOR UPDATE 잠금)
        const nextRequest = await tx.queueRequest.findFirst({
          where: {
            status: QueueStatus.PENDING
          },
          orderBy: [
            { position: 'asc' },    // 먼저 position으로 정렬
            { createdAt: 'asc' }    // 같은 position이면 생성 시간순
          ],
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

        if (!nextRequest) {
          return null; // 처리할 요청이 없음
        }

        console.log(`🎯 원자적 처리 대상: ${nextRequest.id} (position: ${nextRequest.position}, 닉네임: ${nextRequest.nickname})`);

        // 2. 즉시 PROCESSING 상태로 변경 (race condition 방지)
        const updatedRequest = await tx.queueRequest.update({
          where: { 
            id: nextRequest.id,
            status: QueueStatus.PENDING // 여전히 PENDING인지 확인
          },
          data: {
            status: QueueStatus.PROCESSING,
            startedAt: new Date()
          },
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

        return updatedRequest;
      }, {
        isolationLevel: 'Serializable' // 가장 강한 격리 수준 적용
      });
    } catch (error) {
      // 다른 인스턴스가 이미 처리했거나 요청이 없는 경우
      console.warn('다음 요청 원자적 처리 실패:', error);
      return null;
    }
  }
}

export const queueService = new QueueService();