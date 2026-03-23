import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { prisma } from '@/lib/database/prisma';
import { parseBody } from '@/lib/validations/parse';
import { reorderPresetsSchema } from '@/lib/validations/schemas/lora-preset';

import { createLogger } from '@/lib/logger';

const log = createLogger('api');

export async function PUT(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      let body;
      try {
        body = await req.json();
      } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
      }
      const result = parseBody(reorderPresetsSchema, body);
      if (!result.success) return result.response;
      const { presetIds } = result.data;

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
