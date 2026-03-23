import { NextResponse } from 'next/server';
import { LoRABundleService } from '@/lib/database/lora-bundles';
import { createRouteHandler } from '@/lib/api/route-handler';

export const GET = createRouteHandler(
  { auth: 'admin', category: 'admin' },
  async () => {
    const bundles = await LoRABundleService.getAllBundles();

    return {
      bundles,
      count: bundles.length,
    };
  }
);

export const POST = createRouteHandler(
  { auth: 'admin', category: 'admin' },
  async (req) => {
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

    return { bundle };
  }
);
