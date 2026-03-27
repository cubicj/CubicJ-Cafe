import { NextResponse } from 'next/server';
import { LoRABundleService } from '@/lib/database/lora-bundles';
import { createRouteHandler } from '@/lib/api/route-handler';
import { parseBody } from '@/lib/validations/parse';
import { loraBundleUpdateSchema } from '@/lib/validations/schemas/admin';

export const GET = createRouteHandler<{ id: string }>(
  { auth: 'admin', category: 'admin' },
  async (_req, { params }) => {
    const { id: bundleId } = params;
    const bundle = await LoRABundleService.getBundleById(bundleId);

    if (!bundle) {
      return NextResponse.json(
        { error: '존재하지 않는 번들입니다.' },
        { status: 404 }
      );
    }

    return { bundle };
  }
);

export const PUT = createRouteHandler<{ id: string }>(
  { auth: 'admin', category: 'admin' },
  async (req, { params }) => {
    const { id: bundleId } = params;
    const body = await req.json();
    const parsed = parseBody(loraBundleUpdateSchema, body);
    if (!parsed.success) return parsed.response;

    const { displayName, highLoRAFilename, lowLoRAFilename, order } = parsed.data;

    const updateData: {
      displayName?: string;
      highLoRAFilename?: string;
      lowLoRAFilename?: string;
      order?: number;
    } = {};

    if (displayName !== undefined) updateData.displayName = displayName;
    if (highLoRAFilename !== undefined) {
      updateData.highLoRAFilename = highLoRAFilename.trim() || undefined;
    }
    if (lowLoRAFilename !== undefined) {
      updateData.lowLoRAFilename = lowLoRAFilename.trim() || undefined;
    }
    if (order !== undefined) updateData.order = order;

    const bundle = await LoRABundleService.updateBundle(bundleId, updateData);

    return { bundle };
  }
);

export const DELETE = createRouteHandler<{ id: string }>(
  { auth: 'admin', category: 'admin' },
  async (_req, { params }) => {
    const { id: bundleId } = params;
    await LoRABundleService.deleteBundle(bundleId);

    return { message: '번들이 성공적으로 삭제되었습니다.' };
  }
);
