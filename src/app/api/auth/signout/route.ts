import { NextResponse } from 'next/server';
import { sessionManager } from '@/lib/auth/session';
import { createRouteHandler } from '@/lib/api/route-handler';

export const POST = createRouteHandler(
  { auth: 'none' },
  async (req) => {
    const sessionId = sessionManager.getSessionIdFromRequest(req);

    if (sessionId) {
      await sessionManager.deleteSession(sessionId);
    }

    const response = NextResponse.json({});
    return sessionManager.clearSessionCookie(response);
  }
);
