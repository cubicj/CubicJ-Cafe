import { createRouteHandler } from '@/lib/api/route-handler';
import { isComfyUIEnabled, setComfyUIEnabled } from '@/lib/comfyui/comfyui-state';
import { queueMonitor } from '@/lib/comfyui/queue-monitor';
import { createLogger } from '@/lib/logger';
import { parseBody } from '@/lib/validations/parse';
import { comfyuiToggleSchema } from '@/lib/validations/schemas/admin';

const log = createLogger('admin');

export const GET = createRouteHandler(
  { auth: 'admin', category: 'admin' },
  async () => {
    return {
      enabled: isComfyUIEnabled(),
      queueMonitor: queueMonitor.getStatus()
    };
  }
);

export const POST = createRouteHandler(
  { auth: 'admin', category: 'admin' },
  async (req) => {
    const body = await req.json();
    const parsed = parseBody(comfyuiToggleSchema, body);
    if (!parsed.success) return parsed.response;

    const { enabled } = parsed.data;

    if (enabled) {
      await setComfyUIEnabled(true);
      queueMonitor.start();
    } else {
      queueMonitor.stop();
      await setComfyUIEnabled(false);
    }

    log.info('ComfyUI toggled by admin', { enabled, admin: req.user!.discordId });

    return {
      enabled: isComfyUIEnabled(),
      queueMonitor: queueMonitor.getStatus()
    };
  }
);
