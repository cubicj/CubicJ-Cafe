import { NextRequest, NextResponse } from 'next/server';
import { LoRABundleService } from '@/lib/database/lora-bundles';
import { getServerSession } from '@/lib/auth/server';
import { isAdmin } from '@/lib/auth/admin';

import { createLogger } from '@/lib/logger';

const log = createLogger('admin');

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    if (!isAdmin(session.user.discordId)) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const bundles = await LoRABundleService.getAllBundles();

    return NextResponse.json({
      success: true,
      bundles,
      count: bundles.length,
    });
  } catch (error) {
    log.error('Failed to fetch LoRA bundle list', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'LoRA 번들 목록 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    if (!isAdmin(session.user.discordId)) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { displayName, highLoRAFilename, lowLoRAFilename, order } = body;

    if (!displayName || !displayName.trim()) {
      return NextResponse.json(
        { error: '표시명은 필수입니다.' },
        { status: 400 }
      );
    }

    const hasHighLoRA = highLoRAFilename && highLoRAFilename.trim();
    const hasLowLoRA = lowLoRAFilename && lowLoRAFilename.trim();
    
    if (!hasHighLoRA && !hasLowLoRA) {
      return NextResponse.json(
        { error: 'High LoRA 또는 Low LoRA 중 적어도 하나는 필요합니다.' },
        { status: 400 }
      );
    }

    const bundle = await LoRABundleService.createBundle({
      displayName: displayName.trim(),
      highLoRAFilename: hasHighLoRA ? highLoRAFilename.trim() : undefined,
      lowLoRAFilename: hasLowLoRA ? lowLoRAFilename.trim() : undefined,
      order: order !== undefined ? Number(order) : undefined,
    });

    return NextResponse.json({
      success: true,
      bundle,
    });
  } catch (error) {
    log.error('Failed to create LoRA bundle', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'LoRA 번들 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}