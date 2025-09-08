import { NextRequest, NextResponse } from "next/server";
import { queueService } from "@/lib/database/queue";
import { sessionManager } from "@/lib/auth/session";
import { initializeServices } from "@/lib/startup/init";
import { isAdmin } from "@/lib/auth/admin";

export async function GET(request: NextRequest) {
  try {
    initializeServices();
    
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'list':
        const queueList = await queueService.getQueueList();
        return NextResponse.json({ success: true, data: queueList });

      case 'stats':
        const stats = await queueService.getQueueStats();
        return NextResponse.json({ success: true, data: stats });

      case 'user':
        const sessionId = sessionManager.getSessionIdFromRequest(request);
        const session = sessionId ? await sessionManager.validateSession(sessionId) : null;
        if (!session?.user) {
          return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
        }
        
        const userRequests = await queueService.getUserRequests(parseInt(session.user.id));
        return NextResponse.json({ success: true, data: userRequests });

      default:
        return NextResponse.json({ error: '잘못된 action 파라미터입니다.' }, { status: 400 });
    }
  } catch (error) {
    console.error('Queue API 에러:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '서버 오류가 발생했습니다.' },
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

        // 관리자인지 확인
        const userIsAdmin = isAdmin(session.user.discordId);
        await queueService.cancelRequest(requestId, parseInt(session.user.id), userIsAdmin);
        return NextResponse.json({ success: true, message: '요청이 취소되었습니다.' });


      default:
        return NextResponse.json({ error: '잘못된 action입니다.' }, { status: 400 });
    }
  } catch (error) {
    console.error('Queue POST API 에러:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}