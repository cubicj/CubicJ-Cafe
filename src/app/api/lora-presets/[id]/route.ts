import { NextResponse } from 'next/server';
import { LoRAPresetService } from '@/lib/database/lora-presets';
import { createRouteHandler } from '@/lib/api/route-handler';
import { parseBody } from '@/lib/validations/parse';
import { updateLoraPresetSchema } from '@/lib/validations/schemas/lora-preset';

export const GET = createRouteHandler<{ id: string }>(
  { auth: 'user' },
  async (req, { params }) => {
    const { id } = params;
    const preset = await LoRAPresetService.getPresetById(id, Number(req.user!.id));

    if (!preset) {
      return NextResponse.json(
        { error: '프리셋을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return { preset };
  }
);

export const PUT = createRouteHandler<{ id: string }>(
  { auth: 'user' },
  async (req, { params }) => {
    const { id } = params;

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

    return { preset };
  }
);

export const DELETE = createRouteHandler<{ id: string }>(
  { auth: 'user' },
  async (req, { params }) => {
    const { id } = params;
    const deleted = await LoRAPresetService.deletePreset(id, Number(req.user!.id));

    if (!deleted) {
      return NextResponse.json(
        { error: '프리셋을 찾을 수 없거나 삭제 권한이 없습니다.' },
        { status: 404 }
      );
    }

    return { message: '프리셋이 삭제되었습니다.' };
  }
);
