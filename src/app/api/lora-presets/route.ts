import { NextRequest, NextResponse } from 'next/server';
import { LoRAPresetService } from '@/lib/database/lora-presets';
import { getServerSession } from '@/lib/auth/server';

import { createLogger } from '@/lib/logger';

const log = createLogger('api');

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const presets = await LoRAPresetService.getUserPresets(Number(session.user.id));

    return NextResponse.json({
      success: true,
      presets,
      count: presets.length,
    });
  } catch (error) {
    log.error('Failed to fetch LoRA preset list', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'LoRA 프리셋 목록 조회에 실패했습니다.' },
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

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: '프리셋 이름은 필수입니다.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(loraItems)) {
      return NextResponse.json(
        { error: 'LoRA 아이템 배열이 필요합니다.' },
        { status: 400 }
      );
    }

    const preset = await LoRAPresetService.createPreset(Number(session.user.id), {
      name: name.trim(),
      isPublic: !!isPublic,
      loraItems: loraItems.map((item: { loraFilename: string; loraName?: string; strength?: number; group?: 'HIGH' | 'LOW'; order?: number }, index: number) => ({
        loraFilename: item.loraFilename,
        loraName: item.loraName || item.loraFilename,
        strength: Number(item.strength) || 0.8,
        group: (item.group === 'HIGH' || item.group === 'LOW') ? item.group : 'HIGH',
        order: Number(item.order) || index,
      })),
    });

    return NextResponse.json({
      success: true,
      preset,
    });
  } catch (error) {
    log.error('Failed to create LoRA preset', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'LoRA 프리셋 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}