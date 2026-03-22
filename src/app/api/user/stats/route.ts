import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { prisma } from '@/lib/database/prisma';

import { createLogger } from '@/lib/logger';

const log = createLogger('api');

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const user = session.user;

    const userId = parseInt(user.id);
    
    const [queueRequestCount, loraPresetCount] = await Promise.all([
      prisma.queueRequest.count({
        where: { userId: userId }
      }),
      prisma.loRAPreset.count({
        where: { userId: userId }
      })
    ]);

    return NextResponse.json({
      totalQueueRequests: queueRequestCount,
      loraPresetCount
    });

  } catch (error) {
    log.error('Failed to fetch user stats', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: '통계 정보를 불러오는데 실패했습니다' },
      { status: 500 }
    );
  }
}