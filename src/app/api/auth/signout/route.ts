import { NextRequest, NextResponse } from 'next/server';
import { sessionManager } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const sessionId = sessionManager.getSessionIdFromRequest(request);
    
    if (sessionId) {
      await sessionManager.deleteSession(sessionId);
    }
    
    const response = NextResponse.json({ success: true });
    return sessionManager.clearSessionCookie(response);
  } catch (error) {
    console.error('Signout error:', error);
    return NextResponse.json({ error: 'Signout failed' }, { status: 500 });
  }
}