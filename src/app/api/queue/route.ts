import { NextRequest, NextResponse } from "next/server";
import { queueService } from "@/lib/database/queue";
import { withAuth, withOptionalAuth, AuthenticatedRequest } from "@/lib/auth/middleware";
import { initializeServices } from "@/lib/startup/init";
import { isAdmin } from "@/lib/auth/admin";
import { getQueuePauseAfterPosition } from '@/lib/comfyui/queue-pause-state';
import { createLogger } from '@/lib/logger';
import { parseBody, parseQuery } from '@/lib/validations/parse';
import { queueQuerySchema, queueActionSchema } from '@/lib/validations/schemas/queue';

const log = createLogger('queue');

export async function GET(request: NextRequest) {
  return withOptionalAuth(request, async (req: AuthenticatedRequest) => {
    try {
      initializeServices();

      const queryResult = parseQuery(queueQuerySchema, new URL(req.url).searchParams);
      if (!queryResult.success) return queryResult.response;
      const action = queryResult.data.action;

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
          if (!req.user) {
            return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
          }

          try {
            const userRequests = await queueService.getUserRequests(parseInt(req.user.id));
            return NextResponse.json({ success: true, data: userRequests || [] });
          } catch (dbError) {
            log.error('User requests fetch failed', { error: dbError instanceof Error ? dbError.message : String(dbError) });
            return NextResponse.json(
              { success: false, data: [], error: '사용자 요청 목록 조회에 실패했습니다.' },
              { status: 503 }
            );
          }
      }
    } catch (error) {
      log.error('Queue API error', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json(
        { error: '서버 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      initializeServices();

      let body;
      try {
        body = await req.json();
      } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
      }

      const result = parseBody(queueActionSchema, body);
      if (!result.success) return result.response;
      const { requestId } = result.data;

      try {
        const userIsAdmin = isAdmin(req.user!.discordId);
        await queueService.cancelRequest(requestId, parseInt(req.user!.id), userIsAdmin);
        return NextResponse.json({ success: true, message: '요청이 취소되었습니다.' });
      } catch (cancelError) {
        log.error('Queue cancel error', { error: cancelError instanceof Error ? cancelError.message : String(cancelError) });
        return NextResponse.json(
          { error: cancelError instanceof Error ? cancelError.message : '취소에 실패했습니다.' },
          { status: 500 }
        );
      }
    } catch (error) {
      log.error('Queue POST API error', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json(
        { error: '서버 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  });
}
