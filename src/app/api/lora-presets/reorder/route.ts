import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { prisma } from '@/lib/database/prisma';

import { createLogger } from '@/lib/logger';

const log = createLogger('api');

export async function PUT(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { presetIds } = await req.json();

      if (!Array.isArray(presetIds) || presetIds.length === 0) {
        return NextResponse.json({ error: '프리셋 ID 배열이 필요합니다' }, { status: 400 });
      }

      const userPresets = await prisma.loRAPreset.findMany({
        where: {
          userId: Number(req.user!.id),
          id: { in: presetIds }
        },
        select: { id: true }
      });

      if (userPresets.length !== presetIds.length) {
        return NextResponse.json({ error: '일부 프리셋에 대한 권한이 없습니다' }, { status: 403 });
      }

      await prisma.$transaction(async (tx) => {
        for (let i = 0; i < presetIds.length; i++) {
          await tx.loRAPreset.update({
            where: { id: presetIds[i] },
            data: { order: i }
          });
        }
      });

      return NextResponse.json({
        success: true,
        message: '프리셋 순서가 업데이트되었습니다'
      });

    } catch (error) {
      log.error('Failed to reorder presets', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json(
        { error: '프리셋 순서 변경에 실패했습니다' },
        { status: 500 }
      );
    }
  });
}
