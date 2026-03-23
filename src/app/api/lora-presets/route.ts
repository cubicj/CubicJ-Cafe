import { NextRequest, NextResponse } from 'next/server';
import { LoRAPresetService } from '@/lib/database/lora-presets';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { parseBody, parseQuery } from '@/lib/validations/parse';
import { createLoraPresetSchema, loraPresetQuerySchema } from '@/lib/validations/schemas/lora-preset';

import { createLogger } from '@/lib/logger';

const log = createLogger('api');

export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const queryResult = parseQuery(loraPresetQuerySchema, new URL(req.url).searchParams);
      if (!queryResult.success) return queryResult.response;
      const model = queryResult.data.model;

      const presets = await LoRAPresetService.getUserPresets(Number(req.user!.id), model);

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
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      let body;
      try {
        body = await req.json();
      } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
      }
      const result = parseBody(createLoraPresetSchema, body);
      if (!result.success) return result.response;
      const { name, isPublic, loraItems, model } = result.data;

      const preset = await LoRAPresetService.createPreset(Number(req.user!.id), {
        name,
        isPublic,
        model,
        loraItems: loraItems.map((item, index) => ({
          loraFilename: item.loraFilename,
          loraName: item.loraName || item.loraFilename,
          strength: item.strength,
          group: item.group,
          order: item.order ?? index,
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
  });
}
