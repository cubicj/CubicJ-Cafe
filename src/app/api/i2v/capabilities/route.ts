import { createRouteHandler } from '@/lib/api/route-handler'
import { MODEL_REGISTRY } from '@/lib/comfyui/workflows/registry'
import { getVideoDurationSeconds } from '@/lib/comfyui/workflows/model-settings'
import { getCapabilitiesSettingsProjection } from '@/lib/database/system-settings'
import type { VideoModel, ModelCapabilities } from '@/lib/comfyui/workflows/types'

export const GET = createRouteHandler(
  { auth: 'user' },
  async () => {
    const settings = await getCapabilitiesSettingsProjection()
    const buildSecondLabels = (options: number[]): Record<number, string> =>
      Object.fromEntries(options.map(duration => [duration, `${duration}초`]))

    const capabilities: Record<VideoModel, ModelCapabilities> = {} as Record<VideoModel, ModelCapabilities>
    for (const [model, config] of Object.entries(MODEL_REGISTRY)) {
      const videoModel = model as VideoModel
      capabilities[model as VideoModel] = {
        ...config.capabilities,
        endImage: videoModel === 'ltxr'
          ? settings.ltxrEndImageEnabled
          : config.capabilities.endImage,
        loraPresets: config.capabilities.loraPresets && settings.loraEnabled[videoModel],
      }
    }

    const durationOptions = settings.durationOptions
    const durationLabels: Record<VideoModel, Record<number, string>> = {
      wan: buildSecondLabels(durationOptions.wan),
      ltxa: Object.fromEntries(durationOptions.ltxa.map(duration => [
        duration,
        settings.ltxaFrameBase && settings.ltxaFrameRate
          ? `${getVideoDurationSeconds('ltxa', duration, { frameBase: settings.ltxaFrameBase, frameRate: settings.ltxaFrameRate }).toFixed(1)}초`
          : `${duration}초`,
      ])),
      ltxr: Object.fromEntries(durationOptions.ltxr.map(duration => [
        duration,
        settings.ltxrFrameBase && settings.ltxrFrameRate
          ? `${getVideoDurationSeconds('ltxr', duration, { frameBase: settings.ltxrFrameBase, frameRate: settings.ltxrFrameRate }).toFixed(1)}초`
          : `${duration}초`,
      ])),
      'ltx-wan': buildSecondLabels(durationOptions['ltx-wan']),
    }

    return { capabilities, durationOptions, durationLabels, enabledModels: settings.enabledModels }
  }
)
