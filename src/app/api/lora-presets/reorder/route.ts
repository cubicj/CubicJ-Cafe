import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { prisma } from '@/lib/database/prisma';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { presetIds } = await request.json();

    if (!Array.isArray(presetIds) || presetIds.length === 0) {
      return NextResponse.json({ error: '프리셋 ID 배열이 필요합니다' }, { status: 400 });
    }

    const userPresets = await prisma.loRAPreset.findMany({
      where: {
        userId: Number(session.user.id),
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
    console.error('❌ 프리셋 순서 변경 실패:', error);
    return NextResponse.json(
      { error: '프리셋 순서 변경에 실패했습니다' },
      { status: 500 }
    );
  }
}