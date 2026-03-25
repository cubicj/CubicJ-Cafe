import { createRouteHandler } from '@/lib/api/route-handler';
import { comfyUIClient } from '@/lib/comfyui/client';
import { isComfyUIEnabled } from '@/lib/comfyui/comfyui-state';

export const GET = createRouteHandler(
  { auth: 'admin', category: 'admin' },
  async () => {
    if (!isComfyUIEnabled()) {
      return { models: {} };
    }

    try {
      const models = await comfyUIClient.getModelList();
      return { models };
    } catch {
      return { models: {} };
    }
  }
);
