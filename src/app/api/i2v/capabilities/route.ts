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
              'ltxa.lora_enabled',
              'wan.duration_options',
              'ltxa.duration_options',
              'ltxr.duration_options',
              'ltx-wan.duration_options',
              'ltxa.frame_base',
              'ltxa.frame_rate',
              'ltxa.end_image_enabled',
              'ltxr.frame_base',
              'ltxr.frame_rate',
              'ltxr.end_image_enabled',
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
      ltxa: settingsMap.get('ltxa.lora_enabled') === 'true',
      ltxr: false,
      'ltx-wan': false,
    }

    const capabilities: Record<VideoModel, ModelCapabilities> = {} as Record<VideoModel, ModelCapabilities>
    for (const [model, config] of Object.entries(MODEL_REGISTRY)) {
      const videoModel = model as VideoModel
      capabilities[model as VideoModel] = {
        ...config.capabilities,
        endImage: videoModel === 'ltxa' || videoModel === 'ltxr'
          ? settingsMap.get(`${videoModel}.end_image_enabled`) === 'true'
          : config.capabilities.endImage,
        loraPresets: config.capabilities.loraPresets && loraEnabledMap[videoModel],
      }
    }

    const durationOptions: Record<VideoModel, number[]> = {
      wan: parseCsv(settingsMap.get('wan.duration_options')) ?? MODEL_REGISTRY.wan.durationOptions,
      ltxa: parseCsv(settingsMap.get('ltxa.duration_options')) ?? MODEL_REGISTRY.ltxa.durationOptions,
      ltxr: parseCsv(settingsMap.get('ltxr.duration_options')) ?? MODEL_REGISTRY.ltxr.durationOptions,
      'ltx-wan': parseCsv(settingsMap.get('ltx-wan.duration_options')) ?? MODEL_REGISTRY['ltx-wan'].durationOptions,
    }

    const ltxaFrameBase = parsePositiveNumber(settingsMap.get('ltxa.frame_base'))
    const ltxaFrameRate = parsePositiveNumber(settingsMap.get('ltxa.frame_rate'))
    const ltxrFrameBase = parsePositiveNumber(settingsMap.get('ltxr.frame_base'))
    const ltxrFrameRate = parsePositiveNumber(settingsMap.get('ltxr.frame_rate'))
    const durationLabels: Record<VideoModel, Record<number, string>> = {
      wan: buildSecondLabels(durationOptions.wan),
      ltxa: Object.fromEntries(durationOptions.ltxa.map(duration => [
        duration,
        ltxaFrameBase && ltxaFrameRate
          ? `${(((ltxaFrameBase * duration) + 1) / ltxaFrameRate).toFixed(1)}초`
          : `${duration}초`,
      ])),
      ltxr: Object.fromEntries(durationOptions.ltxr.map(duration => [
        duration,
        ltxrFrameBase && ltxrFrameRate
          ? `${(((ltxrFrameBase * duration) + 1) / ltxrFrameRate).toFixed(1)}초`
          : `${duration}초`,
      ])),
      'ltx-wan': buildSecondLabels(durationOptions['ltx-wan']),
    }

    return { capabilities, durationOptions, durationLabels, enabledModels }
  }
)
