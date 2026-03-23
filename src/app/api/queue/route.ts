import { NextResponse } from "next/server";
import { QueueService } from "@/lib/database/queue";
import { createRouteHandler } from '@/lib/api/route-handler';
import { initializeServices } from "@/lib/startup/init";
import { isAdmin } from "@/lib/auth/admin";
import { getQueuePauseAfterPosition } from '@/lib/comfyui/queue-pause-state';
import { createLogger } from '@/lib/logger';
import { parseBody, parseQuery } from '@/lib/validations/parse';
import { queueQuerySchema, queueActionSchema } from '@/lib/validations/schemas/queue';

const log = createLogger('queue');

export const GET = createRouteHandler(
  { auth: 'optional' },
  async (req) => {
    initializeServices();

    const queryResult = parseQuery(queueQuerySchema, new URL(req.url).searchParams);
    if (!queryResult.success) return queryResult.response;
    const action = queryResult.data.action;

    switch (action) {
      case 'list':
        try {
          const queueList = await QueueService.getQueueList();
          return {
            data: queueList || [],
            pauseAfterPosition: getQueuePauseAfterPosition()
          };
        } catch (dbError) {
          log.error('Queue list fetch failed', { error: dbError instanceof Error ? dbError.message : String(dbError) });
          return NextResponse.json(
            { data: [], error: '큐 목록 조회에 실패했습니다.' },
            { status: 503 }
          );
        }

      case 'stats':
        try {
          const stats = await QueueService.getQueueStats();
          return { data: stats || { pending: 0, processing: 0, todayCompleted: 0, total: 0 } };
        } catch (dbError) {
          log.error('Queue stats fetch failed', { error: dbError instanceof Error ? dbError.message : String(dbError) });
          return NextResponse.json(
            { data: { pending: 0, processing: 0, todayCompleted: 0, total: 0 }, error: '큐 통계 조회에 실패했습니다.' },
            { status: 503 }
          );
        }

      case 'user':
        if (!req.user) {
          return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
        }

        try {
          const userRequests = await QueueService.getUserRequests(parseInt(req.user.id));
          return { data: userRequests || [] };
        } catch (dbError) {
          log.error('User requests fetch failed', { error: dbError instanceof Error ? dbError.message : String(dbError) });
          return NextResponse.json(
            { data: [], error: '사용자 요청 목록 조회에 실패했습니다.' },
            { status: 503 }
          );
        }
    }
  }
);

export const POST = createRouteHandler(
  { auth: 'user' },
  async (req) => {
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
      await QueueService.cancelRequest(requestId, parseInt(req.user!.id), userIsAdmin);
      return { message: '요청이 취소되었습니다.' };
    } catch (cancelError) {
      log.error('Queue cancel error', { error: cancelError instanceof Error ? cancelError.message : String(cancelError) });
      return NextResponse.json(
        { error: cancelError instanceof Error ? cancelError.message : '취소에 실패했습니다.' },
        { status: 500 }
      );
    }
  }
);
