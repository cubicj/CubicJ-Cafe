import { NextRequest, NextResponse } from 'next/server';
import { LoRABundleService } from '@/lib/database/lora-bundles';
import { withAuth } from '@/lib/auth/middleware';

import { createLogger } from '@/lib/logger';

const log = createLogger('api');

export async function GET(request: NextRequest) {
  return withAuth(request, async () => {
    try {
      const bundles = await LoRABundleService.getActiveBundles();

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
  });
}
