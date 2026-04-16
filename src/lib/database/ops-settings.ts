import { prisma } from './prisma'

export const OPS_KEYS = [
  'ops.discord_channel_cache_ms',
  'ops.generation_sweep_interval_ms',
  'ops.generation_sweep_max_age_ms',
  'ops.job_monitor_timeout_ms',
  'ops.queue_health_check_interval_ms',
  'ops.comfyui_http_timeout_ms',
  'ops.log_file_max_bytes',
  'ops.log_file_retention_days',
  'ops.ws_history_poll_interval_ms',
] as const

export type OpsSettingKey = (typeof OPS_KEYS)[number]

const cache = new Map<OpsSettingKey, number>()
let loaded = false

export async function loadOpsSettings(): Promise<void> {
  const rows = await prisma.systemSetting.findMany({ where: { category: 'ops' } })
  const byKey = new Map(rows.map((r) => [r.key, r.value]))

  for (const key of OPS_KEYS) {
    const raw = byKey.get(key)
    if (raw === undefined) {
      throw new Error(`Ops setting missing in DB: ${key}`)
    }
    const parsed = Number(raw)
    if (!Number.isFinite(parsed)) {
      throw new Error(`Ops setting failed to parse as number: ${key} = "${raw}"`)
    }
    cache.set(key, parsed)
  }
  loaded = true
}

export function getOpsSetting(key: OpsSettingKey): number {
  if (!loaded) {
    throw new Error('Ops settings not loaded - call loadOpsSettings() at boot')
  }
  const value = cache.get(key)
  if (value === undefined) {
    throw new Error(`Ops setting missing from cache: ${key}`)
  }
  return value
}

export function _resetOpsSettingsForTest(): void {
  cache.clear()
  loaded = false
}
