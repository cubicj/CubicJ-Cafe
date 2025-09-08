import { NextRequest, NextResponse } from 'next/server';
import { sessionManager, SessionData } from './session';

export interface AuthenticatedRequest extends NextRequest {
  user?: SessionData['user'];
  sessionId?: string;
}

export async function withAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const sessionId = sessionManager.getSessionIdFromRequest(request);
  
  if (!sessionId) {
    return NextResponse.json(
      { error: '로그인이 필요합니다' },
      { status: 401 }
    );
  }

  const sessionData = await sessionManager.validateSession(sessionId);
  
  if (!sessionData) {
    const response = NextResponse.json(
      { error: '유효하지 않은 세션입니다' },
      { status: 401 }
    );
    return sessionManager.clearSessionCookie(response);
  }

  const authenticatedRequest = request as AuthenticatedRequest;
  authenticatedRequest.user = sessionData.user;
  authenticatedRequest.sessionId = sessionData.sessionId;

  return handler(authenticatedRequest);
}

export async function withOptionalAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const sessionId = sessionManager.getSessionIdFromRequest(request);
  const authenticatedRequest = request as AuthenticatedRequest;
  
  if (sessionId) {
    const sessionData = await sessionManager.validateSession(sessionId);
    if (sessionData) {
      authenticatedRequest.user = sessionData.user;
      authenticatedRequest.sessionId = sessionData.sessionId;
    }
  }

  return handler(authenticatedRequest);
}