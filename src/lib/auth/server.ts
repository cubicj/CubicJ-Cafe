import { cookies, headers } from 'next/headers';
import { SessionManager } from './session';

const sessionManager = new SessionManager();

export async function getServerSession() {
  try {
    // 먼저 미들웨어에서 전달한 헤더 확인
    const headerStore = await headers();
    const sessionIdFromHeader = headerStore.get('x-session-id');
    
    // 쿠키에서도 확인 (백업)
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session_id');
    
    // 헤더 우선, 없으면 쿠키 사용
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
    console.error('Server session check error:', error);
    return null;
  }
}