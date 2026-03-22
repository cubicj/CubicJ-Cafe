import { prisma } from './prisma';
import type { Session, User } from '@prisma/client';
import { randomUUID } from 'crypto';
import { createLogger } from '@/lib/logger';

const log = createLogger('database');

// 세션과 사용자 정보를 포함한 타입
export interface SessionWithUser extends Session {
  user: User;
}

// 세션 서비스 클래스
export class SessionService {
  // 기본 세션 만료 시간 (7일)
  private static readonly DEFAULT_EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000;

  // 새 세션 생성
  static async create(userId: number, expiresInMs?: number): Promise<Session | null> {
    try {
      const sessionId = randomUUID();
      const expiresAt = new Date(Date.now() + (expiresInMs || this.DEFAULT_EXPIRES_IN_MS));

      return await prisma.session.create({
        data: {
          id: sessionId,
          userId,
          expiresAt,
        },
      });
    } catch (error) {
      log.error('Session creation failed', { error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  // 세션 ID로 세션 조회 (사용자 정보 포함)
  static async findById(sessionId: string): Promise<SessionWithUser | null> {
    try {
      return await prisma.session.findUnique({
        where: { id: sessionId },
        include: { user: true },
      });
    } catch (error) {
      log.error('Session lookup failed', { error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  // 유효한 세션인지 확인 (만료 체크 포함)
  static async findValidSession(sessionId: string): Promise<SessionWithUser | null> {
    try {
      const session = await prisma.session.findUnique({
        where: { 
          id: sessionId,
          expiresAt: {
            gt: new Date(), // 만료되지 않은 세션만
          },
        },
        include: { user: true },
      });
      return session;
    } catch (error) {
      log.error('Valid session lookup failed', { error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  // 사용자의 모든 세션 조회
  static async findByUserId(userId: number): Promise<Session[]> {
    try {
      return await prisma.session.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      log.error('User session lookup failed', { error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  }

  // 세션 삭제 (로그아웃)
  static async delete(sessionId: string): Promise<boolean> {
    try {
      await prisma.session.delete({
        where: { id: sessionId },
      });
      return true;
    } catch (error) {
      log.error('Session deletion failed', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  // 사용자의 모든 세션 삭제 (전체 로그아웃)
  static async deleteAllUserSessions(userId: number): Promise<boolean> {
    try {
      await prisma.session.deleteMany({
        where: { userId },
      });
      return true;
    } catch (error) {
      log.error('All user sessions deletion failed', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  // 만료된 세션들 정리 (크론 작업용)
  static async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = await prisma.session.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });
      log.info('Cleaned up expired sessions', { count: result.count });
      return result.count;
    } catch (error) {
      log.error('Expired session cleanup failed', { error: error instanceof Error ? error.message : String(error) });
      return 0;
    }
  }

  // 세션 만료 시간 연장
  static async extendSession(sessionId: string, expiresInMs?: number): Promise<Session | null> {
    try {
      const newExpiresAt = new Date(Date.now() + (expiresInMs || this.DEFAULT_EXPIRES_IN_MS));
      
      return await prisma.session.update({
        where: { id: sessionId },
        data: { expiresAt: newExpiresAt },
      });
    } catch (error) {
      log.error('Session extension failed', { error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  // 세션 통계 (관리자용)
  static async getSessionStats() {
    try {
      const [total, active, expired] = await Promise.all([
        prisma.session.count(),
        prisma.session.count({
          where: {
            expiresAt: { gt: new Date() },
          },
        }),
        prisma.session.count({
          where: {
            expiresAt: { lte: new Date() },
          },
        }),
      ]);

      return { total, active, expired };
    } catch (error) {
      log.error('Session stats fetch failed', { error: error instanceof Error ? error.message : String(error) });
      return { total: 0, active: 0, expired: 0 };
    }
  }
}

