import { createRouteHandler } from '@/lib/api/route-handler';
import { getComfyUIClient } from '@/lib/comfyui/client';
import { isComfyUIEnabled } from '@/lib/comfyui/comfyui-state';
import { createLogger } from '@/lib/logger';

const log = createLogger('admin');

export const GET = createRouteHandler(
  { auth: 'admin', category: 'admin' },
  async () => {
    if (!isComfyUIEnabled()) {
      return { samplers: [] };
    }

    try {
      const samplers = await getComfyUIClient().getSamplerList();
      return { samplers };
    } catch (e) {
      log.error('comfyui samplers fetch failed', { error: e instanceof Error ? e.message : String(e) });
      return { samplers: [] };
    }
  }
);
