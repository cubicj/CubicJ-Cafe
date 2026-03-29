import { createRouteHandler, type AuthenticatedRequest } from '@/lib/api/route-handler';
import { comfyUIClient } from '@/lib/comfyui/client';
import { isComfyUIEnabled } from '@/lib/comfyui/comfyui-state';
import { parseQuery } from '@/lib/validations/parse';
import { z } from 'zod/v4';

const querySchema = z.object({
  q: z.string(),
});

export const GET = createRouteHandler(
  { auth: 'admin', category: 'admin' },
  async (req: AuthenticatedRequest) => {
    if (!isComfyUIEnabled()) {
      return { options: {} };
    }

    const url = new URL(req.url);
    const parsed = parseQuery(querySchema, url.searchParams);
    if (!parsed.success) {
      return { options: {} };
    }

    const requests = parsed.data.q.split(',').map((entry: string) => {
      const [id, nodeName, fieldName, prefix, excludeFlag] = entry.split(':');
      return {
        id,
        nodeName,
        fieldName,
        prefix: prefix || undefined,
        excludeSubdirs: excludeFlag === 'excludeSubdirs',
      };
    });

    try {
      const options = await comfyUIClient.getNodeOptions(requests);
      return { options };
    } catch {
      return { options: {} };
    }
  }
);
