import { NextResponse } from 'next/server';
import { LoRAPresetService } from '@/lib/database/lora-presets';

import { createLogger } from '@/lib/logger';

const log = createLogger('api');

// POST: 기본 LoRA 프리셋들 초기화
export async function POST() {
  try {
    await LoRAPresetService.createDefaultPresets();

    return NextResponse.json({
      success: true,
      message: '기본 LoRA 프리셋들이 초기화되었습니다.',
    });
  } catch (error) {
    log.error('Failed to initialize default LoRA presets', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '기본 프리셋 초기화에 실패했습니다.' },
      { status: 500 }
    );
  }
}