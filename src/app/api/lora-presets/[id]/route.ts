import { NextRequest, NextResponse } from 'next/server';
import { LoRAPresetService } from '@/lib/database/lora-presets';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { parseBody } from '@/lib/validations/parse';
import { updateLoraPresetSchema } from '@/lib/validations/schemas/lora-preset';

import { createLogger } from '@/lib/logger';

const log = createLogger('api');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = await params;
      const preset = await LoRAPresetService.getPresetById(id, Number(req.user!.id));

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
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = await params;

      let body;
      try {
        body = await req.json();
      } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
      }
      const result = parseBody(updateLoraPresetSchema, body);
      if (!result.success) return result.response;
      const { name, isPublic, loraItems } = result.data;

      const updateData: Record<string, unknown> = {};
      if (name !== undefined) updateData.name = name;
      if (isPublic !== undefined) updateData.isPublic = isPublic;
      if (loraItems !== undefined) {
        updateData.loraItems = loraItems.map((item, index) => ({
          loraFilename: item.loraFilename,
          loraName: item.loraName || item.loraFilename,
          strength: item.strength,
          group: item.group,
          order: item.order ?? index,
        }));
      }

      const preset = await LoRAPresetService.updatePreset(id, Number(req.user!.id), updateData);

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
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = await params;
      const success = await LoRAPresetService.deletePreset(id, Number(req.user!.id));

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
  });
}
