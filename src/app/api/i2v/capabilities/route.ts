import { createRouteHandler } from '@/lib/api/route-handler'
import { MODEL_REGISTRY } from '@/lib/comfyui/workflows/registry'
import { getWanSettings, getLtxSettings, getLtxWanSettings } from '@/lib/database/system-settings'
import type { VideoModel, ModelCapabilities } from '@/lib/comfyui/workflows/types'

export const GET = createRouteHandler(
  { auth: 'user' },
  async () => {
    const [wanSettings, ltxSettings, ltxWanSettings] = await Promise.all([
      getWanSettings(),
      getLtxSettings(),
      getLtxWanSettings(),
    ])

    const loraEnabledMap: Record<VideoModel, boolean> = {
      wan: wanSettings.loraEnabled,
      ltx: ltxSettings.loraEnabled,
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
      wan: MODEL_REGISTRY.wan.durationOptions,
      ltx: MODEL_REGISTRY.ltx.durationOptions,
      'ltx-wan': ltxWanSettings.durationOptions,
    }

    return { capabilities, durationOptions }
  }
)
