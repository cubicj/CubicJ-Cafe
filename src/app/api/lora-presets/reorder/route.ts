import { NextResponse } from 'next/server';
import { createRouteHandler } from '@/lib/api/route-handler';
import { prisma } from '@/lib/database/prisma';
import { parseBody } from '@/lib/validations/parse';
import { reorderPresetsSchema } from '@/lib/validations/schemas/lora-preset';

export const PUT = createRouteHandler(
  { auth: 'user' },
  async (req) => {
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

    return { message: '프리셋 순서가 업데이트되었습니다' };
  }
);
