import { createRouteHandler } from '@/lib/api/route-handler'
import { MODEL_REGISTRY } from '@/lib/comfyui/workflows/registry'
import { prisma } from '@/lib/database/prisma'
import { getEnabledModels } from '@/lib/database/system-settings'
import type { VideoModel, ModelCapabilities } from '@/lib/comfyui/workflows/types'

export const GET = createRouteHandler(
  { auth: 'user' },
  async () => {
    const [rows, enabledModels] = await Promise.all([
      prisma.systemSetting.findMany({
        where: {
          key: {
            in: [
              'wan.lora_enabled',
              'ltx.lora_enabled',
              'wan.duration_options',
              'ltx.duration_options',
              'ltx-wan.duration_options',
              'ltx.frame_base',
              'ltx.frame_rate',
              'ltx.end_image_enabled',
            ],
          },
        },
      }),
      getEnabledModels(),
    ])

    const settingsMap = new Map(rows.map(r => [r.key, r.value]))

    const parseCsv = (v: string | undefined): number[] | null =>
      v ? v.split(',').map(n => parseInt(n.trim(), 10)).filter(n => Number.isFinite(n)) : null
    const parsePositiveNumber = (v: string | undefined): number | null => {
      const n = v ? Number(v) : NaN
      return Number.isFinite(n) && n > 0 ? n : null
    }
    const buildSecondLabels = (options: number[]): Record<number, string> =>
      Object.fromEntries(options.map(duration => [duration, `${duration}초`]))

    const loraEnabledMap: Record<VideoModel, boolean> = {
      wan: settingsMap.get('wan.lora_enabled') === 'true',
      ltx: settingsMap.get('ltx.lora_enabled') === 'true',
      'ltx-wan': false,
    }

    const capabilities: Record<VideoModel, ModelCapabilities> = {} as Record<VideoModel, ModelCapabilities>
    for (const [model, config] of Object.entries(MODEL_REGISTRY)) {
      const videoModel = model as VideoModel
      capabilities[model as VideoModel] = {
        ...config.capabilities,
        endImage: videoModel === 'ltx'
          ? settingsMap.get('ltx.end_image_enabled') === 'true'
          : config.capabilities.endImage,
        loraPresets: config.capabilities.loraPresets && loraEnabledMap[videoModel],
      }
    }

    const durationOptions: Record<VideoModel, number[]> = {
      wan: parseCsv(settingsMap.get('wan.duration_options')) ?? MODEL_REGISTRY.wan.durationOptions,
      ltx: parseCsv(settingsMap.get('ltx.duration_options')) ?? MODEL_REGISTRY.ltx.durationOptions,
      'ltx-wan': parseCsv(settingsMap.get('ltx-wan.duration_options')) ?? MODEL_REGISTRY['ltx-wan'].durationOptions,
    }

    const ltxFrameBase = parsePositiveNumber(settingsMap.get('ltx.frame_base'))
    const ltxFrameRate = parsePositiveNumber(settingsMap.get('ltx.frame_rate'))
    const durationLabels: Record<VideoModel, Record<number, string>> = {
      wan: buildSecondLabels(durationOptions.wan),
      ltx: Object.fromEntries(durationOptions.ltx.map(duration => [
        duration,
        ltxFrameBase && ltxFrameRate
          ? `${(((ltxFrameBase * duration) + 1) / ltxFrameRate).toFixed(1)}초`
          : `${duration}초`,
      ])),
      'ltx-wan': buildSecondLabels(durationOptions['ltx-wan']),
    }

    return { capabilities, durationOptions, durationLabels, enabledModels }
  }
)
