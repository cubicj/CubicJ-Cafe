import { vi } from 'vitest'

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

import { prisma } from '@/lib/database/prisma'
import { loadOpsSettings, getOpsSetting, _resetOpsSettingsForTest } from '@/lib/database/ops-settings'
import { seedOps } from '../helpers/ops-seed'

describe('ops-settings', () => {
  beforeEach(async () => {
    _resetOpsSettingsForTest()
    await prisma.systemSetting.deleteMany()
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
