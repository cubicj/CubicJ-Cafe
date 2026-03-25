import { NextResponse } from 'next/server'
import { ComfyUIClient } from '@/lib/comfyui/client'
import { createLogger } from '@/lib/logger';
import { isComfyUIEnabled } from '@/lib/comfyui/comfyui-state';
import { createRouteHandler } from '@/lib/api/route-handler';

const log = createLogger('comfyui');

export const GET = createRouteHandler(
  { auth: 'none' },
  async () => {
    if (!isComfyUIEnabled()) {
      return {
        enabled: false,
        models: {
          diffusionModels: [],
          textEncoders: [],
          vaes: [],
          upscaleModels: [],
          clipVisions: [],
          ggufClips: [],
          clipEmbeddings: [],
          kjVaes: [],
          latentUpscalers: [],
          vfiCheckpoints: []
        }
      };
    }
    log.info('ComfyUI model list API called')

    const client = new ComfyUIClient()

    try {
      const models = await client.getModelList()

      log.info('Model list fetched', {
        diffusionModels: models.diffusionModels.length,
        textEncoders: models.textEncoders.length,
        vaes: models.vaes.length,
        upscaleModels: models.upscaleModels.length,
        clipVisions: models.clipVisions.length
      })

      return { models }
    } catch (connectionError) {
      log.error('ComfyUI server connection failed', { error: connectionError instanceof Error ? connectionError.message : String(connectionError) })

      return NextResponse.json({
        error: 'ComfyUI 서버에 연결할 수 없습니다. 서버가 다운되었거나 응답하지 않습니다.',
        models: {
          diffusionModels: [],
          textEncoders: [],
          vaes: [],
          upscaleModels: [],
          clipVisions: [],
          ggufClips: [],
          clipEmbeddings: [],
          kjVaes: [],
          latentUpscalers: [],
          vfiCheckpoints: []
        }
      }, {
        status: 503
      })
    }
  }
);
