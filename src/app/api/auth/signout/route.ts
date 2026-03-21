import { NextRequest, NextResponse } from 'next/server';
import { sessionManager } from '@/lib/auth/session';

import { createLogger } from '@/lib/logger';

const log = createLogger('auth');

export async function POST(request: NextRequest) {
  try {
    const sessionId = sessionManager.getSessionIdFromRequest(request);
    
    if (sessionId) {
      await sessionManager.deleteSession(sessionId);
    }
    
    const response = NextResponse.json({ success: true });
    return sessionManager.clearSessionCookie(response);
  } catch (error) {
    log.error('Signout error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Signout failed' }, { status: 500 });
  }
}