import { NextResponse } from 'next/server';
import { LoRAPresetService } from '@/lib/database/lora-presets';
import { UserService } from '@/lib/database/users';
import { createRouteHandler } from '@/lib/api/route-handler';
import { parseBody, parseQuery } from '@/lib/validations/parse';
import { createLoraPresetSchema, loraPresetQuerySchema } from '@/lib/validations/schemas/lora-preset';

export const GET = createRouteHandler(
  { auth: 'user' },
  async (req) => {
    const queryResult = parseQuery(loraPresetQuerySchema, new URL(req.url).searchParams);
    if (!queryResult.success) return queryResult.response;
    const model = queryResult.data.model;

    const presets = await LoRAPresetService.getUserPresets(Number(req.user!.id), model);

    return { presets, count: presets.length };
  }
);

export const POST = createRouteHandler(
  { auth: 'user' },
  async (req) => {
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

    UserService.updateLastLogin(req.user!.discordId).catch(() => {});

    return { preset };
  }
);
