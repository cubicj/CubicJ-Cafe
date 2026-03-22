import { NextRequest, NextResponse } from 'next/server';
import { LoRAPresetService } from '@/lib/database/lora-presets';
import { getServerSession } from '@/lib/auth/server';

import { createLogger } from '@/lib/logger';

const log = createLogger('api');

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

    const { id } = await params;
    const preset = await LoRAPresetService.getPresetById(id, Number(session.user.id));
    
    if (!preset) {
      return NextResponse.json(
        { error: '프리셋을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      preset,
    });
  } catch (error) {
    log.error('Failed to fetch LoRA preset', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'LoRA 프리셋 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

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

    const { id } = await params;
    
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      log.error('JSON parse failed', { error: jsonError instanceof Error ? jsonError.message : String(jsonError) });
      return NextResponse.json(
        { error: '잘못된 JSON 데이터입니다.' },
        { status: 400 }
      );
    }
    const { name, isPublic, loraItems } = body;

    const updateData: { name?: string; isPublic?: boolean; loraItems?: Array<{
      loraFilename: string;
      loraName: string;
      strength: number;
      group: 'HIGH' | 'LOW';
      order: number;
    }> } = {};
    
    if (name !== undefined) updateData.name = name.trim();
    if (isPublic !== undefined) updateData.isPublic = !!isPublic;
    
    if (Array.isArray(loraItems)) {
      updateData.loraItems = loraItems.map((item: unknown, index: number) => {
        const loraItem = item as Record<string, unknown>;
        return {
        loraFilename: loraItem.loraFilename as string,
        loraName: (loraItem.loraName as string) || (loraItem.loraFilename as string),
        strength: Number(loraItem.strength) || 0.8,
        group: (loraItem.group as 'HIGH' | 'LOW') || 'HIGH',
        order: Number(loraItem.order) || index,
        };
      });
    }

    const preset = await LoRAPresetService.updatePreset(id, Number(session.user.id), updateData);
    
    if (!preset) {
      return NextResponse.json(
        { error: '프리셋을 찾을 수 없거나 수정 권한이 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      preset,
    });
  } catch (error) {
    log.error('Failed to update LoRA preset', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'LoRA 프리셋 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

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

    const { id } = await params;
    const success = await LoRAPresetService.deletePreset(id, Number(session.user.id));

    if (!success) {
      return NextResponse.json(
        { error: '프리셋을 찾을 수 없거나 삭제 권한이 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '프리셋이 삭제되었습니다.',
    });
  } catch (error) {
    log.error('Failed to delete LoRA preset', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'LoRA 프리셋 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}