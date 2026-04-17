import { createRouteHandler } from '@/lib/api/route-handler';
import { getComfyUIClient } from '@/lib/comfyui/client';
import { isComfyUIEnabled } from '@/lib/comfyui/comfyui-state';

export const GET = createRouteHandler(
  { auth: 'admin', category: 'admin' },
  async () => {
    if (!isComfyUIEnabled()) {
      return { samplers: [] };
    }

    try {
      const samplers = await getComfyUIClient().getSamplerList();
      return { samplers };
    } catch {
      return { samplers: [] };
    }
  }
);
