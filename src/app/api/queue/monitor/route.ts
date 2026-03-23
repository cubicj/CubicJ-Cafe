import { NextResponse } from 'next/server';
import { queueMonitor } from '@/lib/comfyui/queue-monitor';
import { createRouteHandler } from '@/lib/api/route-handler';

export const POST = createRouteHandler(
  { auth: 'admin', category: 'admin' },
  async (req) => {
    const { action } = await req.json();

    switch (action) {
      case 'start':
        queueMonitor.start();
        return {
          message: 'Queue Monitor가 시작되었습니다.',
          status: queueMonitor.getStatus()
        };

      case 'stop':
        queueMonitor.stop();
        return {
          message: 'Queue Monitor가 중단되었습니다.',
          status: queueMonitor.getStatus()
        };

      case 'status':
        return { data: queueMonitor.getStatus() };

      default:
        return NextResponse.json({
          error: '잘못된 액션입니다. (start, stop, status 중 선택)'
        }, { status: 400 });
    }
  }
);

export const GET = createRouteHandler(
  { auth: 'admin', category: 'admin' },
  async () => {
    return { data: queueMonitor.getStatus() };
  }
);
