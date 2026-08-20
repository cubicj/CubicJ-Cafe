import {
  getLtxaSettings,
  getLtxrSettings,
  getLtxWanSettings,
  getWanSettings,
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
}

const MODEL_SETTINGS_LOADERS: {
  [Model in VideoModel]: () => Promise<ModelSettingsByModel[Model]>
} = {
  wan: getWanSettings,
  ltxa: getLtxaSettings,
  ltxr: getLtxrSettings,
  'ltx-wan': getLtxWanSettings,
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
  settings: { frameBase?: number | null; frameRate?: number | null }
): number {
  if (model !== 'ltxa' && model !== 'ltxr') return videoDuration
  if (!settings.frameBase || !settings.frameRate) return videoDuration

  return Number((((settings.frameBase * videoDuration) + 1) / settings.frameRate).toFixed(1))
}
