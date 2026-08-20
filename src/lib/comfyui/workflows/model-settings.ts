import {
  getH3Fl2vaSettings,
  getLtxaSettings,
  getLtxrSettings,
  getLtxWanSettings,
  getWanSettings,
  type H3Fl2vaSettings,
  type LtxaSettings,
  type LtxrSettings,
  type LtxWanSettings,
  type WanSettings,
} from '@/lib/database/system-settings'
import type { VideoModel } from './types'

export interface ModelSettingsByModel {
  wan: WanSettings
  ltxa: LtxaSettings
  ltxr: LtxrSettings
  'ltx-wan': LtxWanSettings
  'h3-fl2va': H3Fl2vaSettings
}

const MODEL_SETTINGS_LOADERS: {
  [Model in VideoModel]: () => Promise<ModelSettingsByModel[Model]>
} = {
  wan: getWanSettings,
  ltxa: getLtxaSettings,
  ltxr: getLtxrSettings,
  'ltx-wan': getLtxWanSettings,
  'h3-fl2va': getH3Fl2vaSettings,
}

export async function getModelSettings<Model extends VideoModel>(
  model: Model
): Promise<ModelSettingsByModel[Model]> {
  const loader = MODEL_SETTINGS_LOADERS[model] as () => Promise<ModelSettingsByModel[Model]>
  return loader()
}

export function getVideoDurationSeconds(
  model: VideoModel,
  videoDuration: number,
  settings: { frameBase?: number | null; frameRate?: number | null; framesPerStep?: number | null }
): number {
  if (model === 'h3-fl2va') {
    if (!settings.framesPerStep || settings.frameBase == null || !settings.frameRate) return videoDuration
    return Number((((settings.framesPerStep * videoDuration) + settings.frameBase) / settings.frameRate).toFixed(1))
  }
  if (model !== 'ltxa' && model !== 'ltxr') return videoDuration
  if (!settings.frameBase || !settings.frameRate) return videoDuration

  return Number((((settings.frameBase * videoDuration) + 1) / settings.frameRate).toFixed(1))
}
