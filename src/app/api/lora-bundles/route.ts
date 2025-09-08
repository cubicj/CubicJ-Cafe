import { NextResponse } from 'next/server';
import { LoRABundleService } from '@/lib/database/lora-bundles';
import { getServerSession } from '@/lib/auth/server';

// GET: 활성화된 LoRA 번들 목록 조회 (사용자용)
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const bundles = await LoRABundleService.getActiveBundles();

    return NextResponse.json({
      success: true,
      bundles,
      count: bundles.length,
    });
  } catch (error) {
    console.error('❌ LoRA 번들 목록 조회 실패:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'LoRA 번들 목록 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}