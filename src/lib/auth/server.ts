import { cookies, headers } from 'next/headers';
import { SessionManager } from './session';
import { createLogger } from '@/lib/logger';

const log = createLogger('auth');

const sessionManager = new SessionManager();

export async function getServerSession() {
  try {
    const headerStore = await headers();
    const sessionIdFromHeader = headerStore.get('x-session-id');
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session_id');
    const sessionId = sessionIdFromHeader || sessionCookie?.value;
    
    if (!sessionId) {
      return null;
    }

    const sessionData = await sessionManager.validateSession(sessionId);
    
    if (!sessionData) {
      return null;
    }

    return {
      user: {
        id: sessionData.user.id,
        discordId: sessionData.user.discordId,
        discordUsername: sessionData.user.discordUsername,
        nickname: sessionData.user.nickname,
        avatar: sessionData.user.avatar,
        name: sessionData.user.discordUsername,
        image: sessionData.user.avatar 
          ? `https://cdn.discordapp.com/avatars/${sessionData.user.discordId}/${sessionData.user.avatar}.png` 
          : null,
      }
    };
  } catch (error) {
    log.error('Server session check error', { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}