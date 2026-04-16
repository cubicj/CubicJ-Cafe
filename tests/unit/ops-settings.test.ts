import { vi } from 'vitest'

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

import { prisma } from '@/lib/database/prisma'
import { loadOpsSettings, getOpsSetting, _resetOpsSettingsForTest } from '@/lib/database/ops-settings'

const OPS_SEED: Array<{ key: string; value: string }> = [
  { key: 'ops.discord_channel_cache_ms', value: '300000' },
  { key: 'ops.generation_sweep_interval_ms', value: '300000' },
  { key: 'ops.generation_sweep_max_age_ms', value: '1800000' },
  { key: 'ops.job_monitor_timeout_ms', value: '1800000' },
  { key: 'ops.queue_health_check_interval_ms', value: '60000' },
  { key: 'ops.comfyui_http_timeout_ms', value: '30000' },
  { key: 'ops.log_file_max_bytes', value: '20971520' },
  { key: 'ops.log_file_retention_days', value: '14' },
  { key: 'ops.ws_history_poll_interval_ms', value: '60000' },
]

async function seedOps() {
  await prisma.systemSetting.deleteMany({ where: { category: 'ops' } })
  for (const { key, value } of OPS_SEED) {
    await prisma.systemSetting.create({
      data: { key, value, type: 'number', category: 'ops' },
    })
  }
}

describe('ops-settings', () => {
  beforeEach(async () => {
    _resetOpsSettingsForTest()
    await seedOps()
  })

  it('loads all ops rows into cache', async () => {
    await loadOpsSettings()
    expect(getOpsSetting('ops.comfyui_http_timeout_ms')).toBe(30000)
    expect(getOpsSetting('ops.ws_history_poll_interval_ms')).toBe(60000)
  })

  it('throws when key missing from cache', async () => {
    await loadOpsSettings()
    expect(() => getOpsSetting('ops.nonexistent_key' as never)).toThrow(/missing/i)
  })

  it('throws when called before load', () => {
    expect(() => getOpsSetting('ops.comfyui_http_timeout_ms')).toThrow(/not loaded/i)
  })

  it('throws when an expected key is missing in DB', async () => {
    await prisma.systemSetting.delete({ where: { key: 'ops.comfyui_http_timeout_ms' } })
    await expect(loadOpsSettings()).rejects.toThrow(/ops\.comfyui_http_timeout_ms/)
  })

  it('throws when value is unparseable', async () => {
    await prisma.systemSetting.update({
      where: { key: 'ops.comfyui_http_timeout_ms' },
      data: { value: 'not-a-number' },
    })
    await expect(loadOpsSettings()).rejects.toThrow(/parse/i)
  })
})
