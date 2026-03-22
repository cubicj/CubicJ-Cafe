import { NextRequest, NextResponse } from 'next/server';
import { LoRABundleService } from '@/lib/database/lora-bundles';
import { withAdmin, AuthenticatedRequest } from '@/lib/auth/middleware';

import { createLogger } from '@/lib/logger';

const log = createLogger('admin');

export async function GET(request: NextRequest) {
  return withAdmin(request, async () => {
    try {
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
  });
}

export async function POST(request: NextRequest) {
  return withAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
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
  });
}
