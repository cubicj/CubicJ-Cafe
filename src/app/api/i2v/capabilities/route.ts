import { createRouteHandler } from '@/lib/api/route-handler'
import { MODEL_REGISTRY } from '@/lib/comfyui/workflows/registry'
import { prisma } from '@/lib/database/prisma'
import type { VideoModel, ModelCapabilities } from '@/lib/comfyui/workflows/types'

export const GET = createRouteHandler(
  { auth: 'user' },
  async () => {
    const rows = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ['wan.lora_enabled', 'ltx.lora_enabled', 'ltx-wan.duration_options'],
        },
      },
    })

    const settingsMap = new Map(rows.map(r => [r.key, r.value]))

    const loraEnabledMap: Record<VideoModel, boolean> = {
      wan: settingsMap.get('wan.lora_enabled') === 'true',
      ltx: settingsMap.get('ltx.lora_enabled') === 'true',
      'ltx-wan': false,
    }

    const capabilities: Record<VideoModel, ModelCapabilities> = {} as Record<VideoModel, ModelCapabilities>
    for (const [model, config] of Object.entries(MODEL_REGISTRY)) {
      capabilities[model as VideoModel] = {
        ...config.capabilities,
        loraPresets: config.capabilities.loraPresets && loraEnabledMap[model as VideoModel],
      }
    }

    const ltxWanDuration = settingsMap.get('ltx-wan.duration_options')
    const durationOptions: Record<VideoModel, number[]> = {
      wan: MODEL_REGISTRY.wan.durationOptions,
      ltx: MODEL_REGISTRY.ltx.durationOptions,
      'ltx-wan': ltxWanDuration ? ltxWanDuration.split(',').map(Number) : MODEL_REGISTRY['ltx-wan'].durationOptions,
    }

    return { capabilities, durationOptions }
  }
)
