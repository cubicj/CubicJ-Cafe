import { NextResponse } from 'next/server';
import { LoRAPresetService } from '@/lib/database/lora-presets';

// POST: 기본 LoRA 프리셋들 초기화
export async function POST() {
  try {
    await LoRAPresetService.createDefaultPresets();

    return NextResponse.json({
      success: true,
      message: '기본 LoRA 프리셋들이 초기화되었습니다.',
    });
  } catch (error) {
    console.error('❌ 기본 LoRA 프리셋 초기화 실패:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '기본 프리셋 초기화에 실패했습니다.' },
      { status: 500 }
    );
  }
}