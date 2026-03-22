import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { prisma } from '@/lib/database/prisma';

import { createLogger } from '@/lib/logger';

const log = createLogger('api');

export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const userId = parseInt(req.user!.id);

      const [queueRequestCount, loraPresetCount] = await Promise.all([
        prisma.queueRequest.count({
          where: { userId }
        }),
        prisma.loRAPreset.count({
          where: { userId }
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
  });
}
