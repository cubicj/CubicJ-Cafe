import { NextRequest, NextResponse } from 'next/server';
import { LoRABundleService } from '@/lib/database/lora-bundles';
import { getServerSession } from '@/lib/auth/server';
import { isAdmin } from '@/lib/auth/admin';

// GET: 특정 LoRA 번들 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: bundleId } = await params;
    const bundle = await LoRABundleService.getBundleById(bundleId);

    if (!bundle) {
      return NextResponse.json(
        { error: '존재하지 않는 번들입니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      bundle,
    });
  } catch (error) {
    console.error('❌ LoRA 번들 조회 실패:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'LoRA 번들 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// PUT: LoRA 번들 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: bundleId } = await params;
    const body = await request.json();
    const { displayName, highLoRAFilename, lowLoRAFilename, order } = body;

    // 입력 검증
    if (displayName !== undefined && (!displayName || !displayName.trim())) {
      return NextResponse.json(
        { error: '표시명은 비워둘 수 없습니다.' },
        { status: 400 }
      );
    }

    const updateData: {
      displayName?: string;
      highLoRAFilename?: string;
      lowLoRAFilename?: string;
      order?: number;
    } = {};
    
    if (displayName !== undefined) updateData.displayName = displayName.trim();
    if (highLoRAFilename !== undefined) {
      updateData.highLoRAFilename = highLoRAFilename && highLoRAFilename.trim() ? highLoRAFilename.trim() : undefined;
    }
    if (lowLoRAFilename !== undefined) {
      updateData.lowLoRAFilename = lowLoRAFilename && lowLoRAFilename.trim() ? lowLoRAFilename.trim() : undefined;
    }
    if (order !== undefined) updateData.order = Number(order);

    const bundle = await LoRABundleService.updateBundle(bundleId, updateData);

    return NextResponse.json({
      success: true,
      bundle,
    });
  } catch (error) {
    console.error('❌ LoRA 번들 수정 실패:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'LoRA 번들 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: LoRA 번들 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: bundleId } = await params;
    await LoRABundleService.deleteBundle(bundleId);

    return NextResponse.json({
      success: true,
      message: '번들이 성공적으로 삭제되었습니다.',
    });
  } catch (error) {
    console.error('❌ LoRA 번들 삭제 실패:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'LoRA 번들 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}