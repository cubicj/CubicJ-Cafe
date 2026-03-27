import { LoRABundleService } from '@/lib/database/lora-bundles';
import { createRouteHandler } from '@/lib/api/route-handler';
import { parseBody } from '@/lib/validations/parse';
import { loraBundleCreateSchema } from '@/lib/validations/schemas/admin';

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
    const parsed = parseBody(loraBundleCreateSchema, body);
    if (!parsed.success) return parsed.response;

    const { displayName, highLoRAFilename, lowLoRAFilename, order } = parsed.data;

    const bundle = await LoRABundleService.createBundle({
      displayName,
      highLoRAFilename: highLoRAFilename?.trim() || undefined,
      lowLoRAFilename: lowLoRAFilename?.trim() || undefined,
      order,
    });

    return { bundle };
  }
);
