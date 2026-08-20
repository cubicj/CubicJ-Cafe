import { prisma } from '../prisma';
import type { VideoModel } from '@/lib/comfyui/workflows/types';

export const MODEL_ENABLED_KEYS = {
  wan: 'wan.enabled',
  ltxa: 'ltxa.enabled',
  ltxr: 'ltxr.enabled',
  'ltx-wan': 'ltx-wan.enabled',
} as const

export async function getEnabledModels(): Promise<VideoModel[]> {
  const rows = await prisma.systemSetting.findMany({
    where: {
      key: {
        in: Object.values(MODEL_ENABLED_KEYS),
      },
    },
  })
  const values = new Map(rows.map(row => [row.key, row.value]))

  return resolveEnabledModels(values)
}

export function resolveEnabledModels(values: ReadonlyMap<string, string>): VideoModel[] {
  return ([
    ['wan', MODEL_ENABLED_KEYS.wan],
    ['ltxa', MODEL_ENABLED_KEYS.ltxa],
    ['ltxr', MODEL_ENABLED_KEYS.ltxr],
    ['ltx-wan', MODEL_ENABLED_KEYS['ltx-wan']],
  ] as const)
    .filter(([model, key]) => model === 'ltxr' ? values.get(key) === 'true' : values.get(key) !== 'false')
    .map(([model]) => model)
}
