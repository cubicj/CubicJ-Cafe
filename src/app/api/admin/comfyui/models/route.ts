import { createRouteHandler } from '@/lib/api/route-handler';
import { getComfyUIClient } from '@/lib/comfyui/client';
import { isComfyUIEnabled } from '@/lib/comfyui/comfyui-state';

export const GET = createRouteHandler(
  { auth: 'admin', category: 'admin' },
  async () => {
    if (!isComfyUIEnabled()) {
      return { models: {} };
    }

    try {
      const models = await getComfyUIClient().getModelList();
      return { models };
    } catch {
      return { models: {} };
    }
  }
);
