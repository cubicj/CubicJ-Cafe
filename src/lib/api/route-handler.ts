import { NextRequest, NextResponse } from 'next/server';
import { sessionManager, SessionData } from '@/lib/auth/session';
import { isAdmin } from '@/lib/auth/admin';
import { createLogger } from '@/lib/logger';

type AuthLevel = 'none' | 'optional' | 'user' | 'admin';

interface RouteOptions {
  auth?: AuthLevel;
  category?: string;
}

export interface AuthenticatedRequest extends NextRequest {
  user?: SessionData['user'];
  sessionId?: string;
}

export function createRouteHandler<
  P extends Record<string, string> = Record<string, string>,
>(
  options: RouteOptions,
  handler: (req: AuthenticatedRequest, context: { params: P }) => Promise<unknown>
) {
  const log = createLogger(options.category || 'api');
  const authLevel = options.auth || 'none';

  return async (
    request?: NextRequest,
    context?: { params: Promise<P> }
  ): Promise<Response> => {
    try {
      const params = context ? await context.params : ({} as P);
      const req = (request ?? new NextRequest('http://localhost')) as AuthenticatedRequest;

      if (request && (authLevel === 'user' || authLevel === 'admin')) {
        const sessionId = sessionManager.getSessionIdFromRequest(request);
        if (!sessionId) {
          return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
        }
        const sessionData = await sessionManager.validateSession(sessionId);
        if (!sessionData) {
          const response = NextResponse.json({ error: '유효하지 않은 세션입니다' }, { status: 401 });
          return sessionManager.clearSessionCookie(response);
        }
        req.user = sessionData.user;
        req.sessionId = sessionData.sessionId;

        if (authLevel === 'admin') {
          if (!req.user?.discordId || !isAdmin(req.user.discordId)) {
            return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
          }
        }
      } else if (request && authLevel === 'optional') {
        const sessionId = sessionManager.getSessionIdFromRequest(request);
        if (sessionId) {
          const sessionData = await sessionManager.validateSession(sessionId);
          if (sessionData) {
            req.user = sessionData.user;
            req.sessionId = sessionData.sessionId;
          }
        }
      }

      const result = await handler(req, { params });

      if (result instanceof Response) {
        return result;
      }

      return NextResponse.json(result);
    } catch (error) {
      log.error('Unhandled route error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return NextResponse.json(
        { error: '서버 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  };
}
