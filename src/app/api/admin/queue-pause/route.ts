import { NextRequest, NextResponse } from 'next/server';
import { withAdmin, AuthenticatedRequest } from '@/lib/auth/middleware';
import { setQueuePauseAfterPosition } from '@/lib/comfyui/queue-pause-state';
import { queueService } from '@/lib/database/queue';
import { createLogger } from '@/lib/logger';

const log = createLogger('admin');

export async function POST(request: NextRequest) {
  return withAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { position } = await req.json();
      if (typeof position !== 'number' || !Number.isInteger(position) || position < 1) {
        return NextResponse.json({ error: '유효한 큐 번호를 입력해주세요.' }, { status: 400 });
      }

      const existingRequest = await queueService.getRequestByPosition(position);
      if (!existingRequest) {
        return NextResponse.json({ error: `#${position} 큐를 찾을 수 없습니다.` }, { status: 400 });
      }

      await setQueuePauseAfterPosition(position);
      log.info('Queue pause set by admin', { position, admin: req.user!.discordId });

      return NextResponse.json({ pauseAfterPosition: position });
    } catch (error) {
      log.error('Queue pause POST error', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
  });
}

export async function DELETE(request: NextRequest) {
  return withAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      await setQueuePauseAfterPosition(null);
      log.info('Queue pause cleared by admin', { admin: req.user!.discordId });

      return NextResponse.json({ pauseAfterPosition: null });
    } catch (error) {
      log.error('Queue pause DELETE error', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
  });
}
