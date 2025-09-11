import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { prisma } from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const user = session.user;

    const userId = parseInt(user.id);
    
    // 병렬로 통계 데이터 수집
    const [queueRequestCount, loraPresetCount] = await Promise.all([
      // 큐 요청 총 횟수
      prisma.queueRequest.count({
        where: { userId: userId }
      }),
      
      // LoRA 프리셋 개수
      prisma.loRAPreset.count({
        where: { userId: userId }
      })
    ]);

    return NextResponse.json({
      totalQueueRequests: queueRequestCount,
      loraPresetCount
    });

  } catch (error) {
    console.error('사용자 통계 조회 실패:', error);
    return NextResponse.json(
      { error: '통계 정보를 불러오는데 실패했습니다' },
      { status: 500 }
    );
  }
}