import { NextRequest, NextResponse } from 'next/server';
import { LoRABundleService } from '@/lib/database/lora-bundles';
import { withAdmin, AuthenticatedRequest } from '@/lib/auth/middleware';

import { createLogger } from '@/lib/logger';

const log = createLogger('admin');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdmin(request, async () => {
    try {
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
      log.error('Failed to fetch LoRA bundle', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json(
        { error: 'LoRA 번들 조회에 실패했습니다.' },
        { status: 500 }
      );
    }
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdmin(request, async (req: AuthenticatedRequest) => {
    try {
      const { id: bundleId } = await params;
      const body = await req.json();
      const { displayName, highLoRAFilename, lowLoRAFilename, order } = body;

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
      log.error('Failed to update LoRA bundle', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json(
        { error: 'LoRA 번들 수정에 실패했습니다.' },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdmin(request, async () => {
    try {
      const { id: bundleId } = await params;
      await LoRABundleService.deleteBundle(bundleId);

      return NextResponse.json({
        success: true,
        message: '번들이 성공적으로 삭제되었습니다.',
      });
    } catch (error) {
      log.error('Failed to delete LoRA bundle', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json(
        { error: 'LoRA 번들 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }
  });
}
