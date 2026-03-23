import { NextResponse } from 'next/server';
import { createRouteHandler } from '@/lib/api/route-handler';
import { isComfyUIEnabled, setComfyUIEnabled } from '@/lib/comfyui/comfyui-state';
import { queueMonitor } from '@/lib/comfyui/queue-monitor';
import { createLogger } from '@/lib/logger';

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
    const { enabled } = await req.json();
    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'enabled 값은 boolean이어야 합니다.' }, { status: 400 });
    }

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
