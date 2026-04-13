import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '@/lib/database/sessions';
import { UserService } from '@/lib/database/users';

export interface SessionUser {
  id: string;
  discordId: string;
  discordUsername: string;
  nickname: string;
  avatar?: string;
  createdAt: Date;
  lastActiveAt: Date;
}

export interface SessionData {
  sessionId: string;
  user: SessionUser;
  expiresAt: Date;
}

const SESSION_COOKIE_NAME = 'session_id';
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30일

export class SessionManager {

  async createSession(discordId: string): Promise<SessionData> {
    const user = await UserService.findByDiscordId(discordId);
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    const session = await SessionService.create(user.id, SESSION_DURATION);
    if (!session) {
      throw new Error('세션 생성에 실패했습니다');
    }

    const updatedUser = await UserService.touchLastActive(user.discordId, 0);

    return {
      sessionId: session.id,
      user: {
        id: user.id.toString(),
        discordId: user.discordId,
        discordUsername: user.discordUsername,
        nickname: user.nickname,
        avatar: user.avatar || undefined,
        createdAt: user.createdAt,
        lastActiveAt: updatedUser?.lastActiveAt ?? user.lastActiveAt,
      },
      expiresAt: session.expiresAt,
    };
  }

  async validateSession(sessionId: string): Promise<SessionData | null> {
    const sessionWithUser = await SessionService.findValidSession(sessionId);
    if (!sessionWithUser) {
      return null;
    }

    UserService.touchLastActive(sessionWithUser.user.discordId).catch(() => {});

    return {
      sessionId: sessionWithUser.id,
      user: {
        id: sessionWithUser.user.id.toString(),
        discordId: sessionWithUser.user.discordId,
        discordUsername: sessionWithUser.user.discordUsername,
        nickname: sessionWithUser.user.nickname,
        avatar: sessionWithUser.user.avatar || undefined,
        createdAt: sessionWithUser.user.createdAt,
        lastActiveAt: sessionWithUser.user.lastActiveAt,
      },
      expiresAt: sessionWithUser.expiresAt,
    };
  }

  async deleteSession(sessionId: string): Promise<void> {
    await SessionService.delete(sessionId);
  }

  async cleanupExpiredSessions(): Promise<void> {
    await SessionService.cleanupExpiredSessions();
  }

  setSessionCookie(response: NextResponse, sessionId: string, expiresAt: Date): NextResponse {
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionId,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      expires: expiresAt,
      secure: (process.env.NODE_ENV || 'development') === 'production',
    });
    
    return response;
  }

  clearSessionCookie(response: NextResponse): NextResponse {
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  getSessionIdFromRequest(request: NextRequest): string | null {
    const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value || null;
    return sessionId;
  }
}

export const sessionManager = new SessionManager();