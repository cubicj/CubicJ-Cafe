import { NextResponse } from 'next/server';
import { createRouteHandler } from '@/lib/api/route-handler';
import { setQueuePauseAfterPosition } from '@/lib/comfyui/queue-pause-state';
import { QueueService } from '@/lib/database/queue';
import { createLogger } from '@/lib/logger';

const log = createLogger('admin');

export const POST = createRouteHandler(
  { auth: 'admin', category: 'admin' },
  async (req) => {
    const { position } = await req.json();
    if (typeof position !== 'number' || !Number.isInteger(position) || position < 1) {
      return NextResponse.json({ error: '유효한 큐 번호를 입력해주세요.' }, { status: 400 });
    }

    const existingRequest = await QueueService.getRequestByPosition(position);
    if (!existingRequest) {
      return NextResponse.json({ error: `#${position} 큐를 찾을 수 없습니다.` }, { status: 400 });
    }

    await setQueuePauseAfterPosition(position);
    log.info('Queue pause set by admin', { position, admin: req.user!.discordId });

    return { pauseAfterPosition: position };
  }
);

export const DELETE = createRouteHandler(
  { auth: 'admin', category: 'admin' },
  async (req) => {
    await setQueuePauseAfterPosition(null);
    log.info('Queue pause cleared by admin', { admin: req.user!.discordId });

    return { pauseAfterPosition: null };
  }
);
