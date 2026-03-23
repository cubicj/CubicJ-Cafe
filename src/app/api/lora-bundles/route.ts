import { LoRABundleService } from '@/lib/database/lora-bundles';
import { createRouteHandler } from '@/lib/api/route-handler';

export const GET = createRouteHandler(
  { auth: 'user' },
  async () => {
    const bundles = await LoRABundleService.getActiveBundles();

    return { bundles, count: bundles.length };
  }
);
