import { NextRequest, NextResponse } from "next/server";
import { queueService } from "@/lib/database/queue";
import { sessionManager } from "@/lib/auth/session";
import { initializeServices } from "@/lib/startup/init";
import { isAdmin } from "@/lib/auth/admin";
import { getQueuePauseAfterPosition } from '@/lib/comfyui/queue-pause-state';

import { createLogger } from '@/lib/logger';

const log = createLogger('queue');

export async function GET(request: NextRequest) {
  try {
    initializeServices();
    
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'list':
        try {
          const queueList = await queueService.getQueueList();
          return NextResponse.json({
            success: true,
            data: queueList || [],
            pauseAfterPosition: getQueuePauseAfterPosition()
          });
        } catch (dbError) {
          log.error('Queue list fetch failed', { error: dbError instanceof Error ? dbError.message : String(dbError) });
          return NextResponse.json(
            { success: false, data: [], error: '큐 목록 조회에 실패했습니다.' },
            { status: 503 }
          );
        }

      case 'stats':
        try {
          const stats = await queueService.getQueueStats();
          return NextResponse.json({ success: true, data: stats || { pending: 0, processing: 0, todayCompleted: 0, total: 0 } });
        } catch (dbError) {
          log.error('Queue stats fetch failed', { error: dbError instanceof Error ? dbError.message : String(dbError) });
          return NextResponse.json(
            { success: false, data: { pending: 0, processing: 0, todayCompleted: 0, total: 0 }, error: '큐 통계 조회에 실패했습니다.' },
            { status: 503 }
          );
        }

      case 'user':
        const sessionId = sessionManager.getSessionIdFromRequest(request);
        const session = sessionId ? await sessionManager.validateSession(sessionId) : null;
        if (!session?.user) {
          return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
        }
        
        try {
          const userRequests = await queueService.getUserRequests(parseInt(session.user.id));
          return NextResponse.json({ success: true, data: userRequests || [] });
        } catch (dbError) {
          log.error('User requests fetch failed', { error: dbError instanceof Error ? dbError.message : String(dbError) });
          return NextResponse.json(
            { success: false, data: [], error: '사용자 요청 목록 조회에 실패했습니다.' },
            { status: 503 }
          );
        }

      default:
        return NextResponse.json({ error: '잘못된 action 파라미터입니다.' }, { status: 400 });
    }
  } catch (error) {
    log.error('Queue API error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeServices();
    
    const sessionId = sessionManager.getSessionIdFromRequest(request);
    const session = sessionId ? await sessionManager.validateSession(sessionId) : null;
    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'cancel':
        const { requestId } = body;
        if (!requestId) {
          return NextResponse.json({ error: 'requestId가 필요합니다.' }, { status: 400 });
        }

        try {
          const userIsAdmin = isAdmin(session.user.discordId);
          await queueService.cancelRequest(requestId, parseInt(session.user.id), userIsAdmin);
          return NextResponse.json({ success: true, message: '요청이 취소되었습니다.' });
        } catch (cancelError) {
          log.error('Queue cancel error', { error: cancelError instanceof Error ? cancelError.message : String(cancelError) });
          return NextResponse.json(
            { error: cancelError instanceof Error ? cancelError.message : '취소에 실패했습니다.' },
            { status: 500 }
          );
        }


      default:
        return NextResponse.json({ error: '잘못된 action입니다.' }, { status: 400 });
    }
  } catch (error) {
    log.error('Queue POST API error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}