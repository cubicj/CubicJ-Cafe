import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth/admin';
import { sessionManager } from '@/lib/auth/session';
import { getQueuePauseAfterPosition, setQueuePauseAfterPosition } from '@/lib/comfyui/queue-pause-state';
import { queueService } from '@/lib/database/queue';
import { createLogger } from '@/lib/logger';

const log = createLogger('admin');

export async function POST(request: NextRequest) {
  try {
    const sessionId = sessionManager.getSessionIdFromRequest(request);
    const session = sessionId ? await sessionManager.validateSession(sessionId) : null;
    if (!session?.user?.discordId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }
    if (!isAdmin(session.user.discordId)) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    const { position } = await request.json();
    if (typeof position !== 'number' || !Number.isInteger(position) || position < 1) {
      return NextResponse.json({ error: '유효한 큐 번호를 입력해주세요.' }, { status: 400 });
    }

    const existingRequest = await queueService.getRequestByPosition(position);
    if (!existingRequest) {
      return NextResponse.json({ error: `#${position} 큐를 찾을 수 없습니다.` }, { status: 400 });
    }

    await setQueuePauseAfterPosition(position);
    log.info('Queue pause set by admin', { position, admin: session.user.discordId });

    return NextResponse.json({ pauseAfterPosition: position });
  } catch (error) {
    log.error('Queue pause POST error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionId = sessionManager.getSessionIdFromRequest(request);
    const session = sessionId ? await sessionManager.validateSession(sessionId) : null;
    if (!session?.user?.discordId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }
    if (!isAdmin(session.user.discordId)) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    await setQueuePauseAfterPosition(null);
    log.info('Queue pause cleared by admin', { admin: session.user.discordId });

    return NextResponse.json({ pauseAfterPosition: null });
  } catch (error) {
    log.error('Queue pause DELETE error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
