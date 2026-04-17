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
          in: [
            'wan.lora_enabled',
            'ltx.lora_enabled',
            'wan.duration_options',
            'ltx.duration_options',
            'ltx-wan.duration_options',
          ],
        },
      },
    })

    const settingsMap = new Map(rows.map(r => [r.key, r.value]))

    const parseCsv = (v: string | undefined): number[] | null =>
      v ? v.split(',').map(n => parseInt(n.trim(), 10)).filter(n => Number.isFinite(n)) : null

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

    const durationOptions: Record<VideoModel, number[]> = {
      wan: parseCsv(settingsMap.get('wan.duration_options')) ?? MODEL_REGISTRY.wan.durationOptions,
      ltx: parseCsv(settingsMap.get('ltx.duration_options')) ?? MODEL_REGISTRY.ltx.durationOptions,
      'ltx-wan': parseCsv(settingsMap.get('ltx-wan.duration_options')) ?? MODEL_REGISTRY['ltx-wan'].durationOptions,
    }

    return { capabilities, durationOptions }
  }
)
