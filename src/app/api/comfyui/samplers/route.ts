import { NextResponse } from 'next/server'
import { ComfyUIClient } from '@/lib/comfyui/client'
import { createLogger } from '@/lib/logger';
import { isComfyUIEnabled } from '@/lib/comfyui/comfyui-state';
import { createRouteHandler } from '@/lib/api/route-handler';

const log = createLogger('comfyui');

export const GET = createRouteHandler(
  { auth: 'user' },
  async () => {
    if (!isComfyUIEnabled()) {
      return {
        enabled: false,
        samplers: []
      };
    }
    log.info('ComfyUI sampler list API called')

    const client = new ComfyUIClient()

    try {
      const samplers = await client.getSamplerList()

      log.info('Sampler list fetched', {
        count: samplers.length,
        samplers: samplers
      })

      return { samplers }
    } catch (connectionError) {
      log.error('ComfyUI server connection failed', { error: connectionError instanceof Error ? connectionError.message : String(connectionError) })

      return NextResponse.json({
        error: 'ComfyUI 서버에 연결할 수 없습니다. 서버가 다운되었거나 응답하지 않습니다.',
        samplers: []
      }, {
        status: 503
      })
    }
  }
);
