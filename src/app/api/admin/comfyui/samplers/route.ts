import { createRouteHandler } from '@/lib/api/route-handler';
import { comfyUIClient } from '@/lib/comfyui/client';
import { isComfyUIEnabled } from '@/lib/comfyui/comfyui-state';

export const GET = createRouteHandler(
  { auth: 'admin', category: 'admin' },
  async () => {
    if (!isComfyUIEnabled()) {
      return { samplers: [] };
    }

    try {
      const samplers = await comfyUIClient.getSamplerList();
      return { samplers };
    } catch {
      return { samplers: [] };
    }
  }
);
