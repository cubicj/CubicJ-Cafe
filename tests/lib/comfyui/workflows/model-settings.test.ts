import { vi } from 'vitest'

const mockGetWanSettings = vi.fn()
const mockGetLtxaSettings = vi.fn()
const mockGetLtxrSettings = vi.fn()
const mockGetLtxWanSettings = vi.fn()

vi.mock('@/lib/database/system-settings', () => ({
  getWanSettings: (...args: unknown[]) => mockGetWanSettings(...args),
  getLtxaSettings: (...args: unknown[]) => mockGetLtxaSettings(...args),
  getLtxrSettings: (...args: unknown[]) => mockGetLtxrSettings(...args),
  getLtxWanSettings: (...args: unknown[]) => mockGetLtxWanSettings(...args),
}))

import {
  getModelSettings,
  getVideoDurationSeconds,
} from '@/lib/comfyui/workflows/model-settings'

describe('model settings adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads settings with the model-keyed loader', async () => {
    const wanSettings = { durationOptions: [5] }
    const ltxaSettings = { durationOptions: [6] }
    const ltxrSettings = { durationOptions: [7] }
    const ltxWanSettings = { durationOptions: [8] }
    mockGetWanSettings.mockResolvedValue(wanSettings)
    mockGetLtxaSettings.mockResolvedValue(ltxaSettings)
    mockGetLtxrSettings.mockResolvedValue(ltxrSettings)
    mockGetLtxWanSettings.mockResolvedValue(ltxWanSettings)

    await expect(getModelSettings('wan')).resolves.toBe(wanSettings)
    await expect(getModelSettings('ltxa')).resolves.toBe(ltxaSettings)
    await expect(getModelSettings('ltxr')).resolves.toBe(ltxrSettings)
    await expect(getModelSettings('ltx-wan')).resolves.toBe(ltxWanSettings)
  })

  it('converts LTX frame counts to rounded seconds', () => {
    expect(getVideoDurationSeconds('ltxa', 24, { frameBase: 8, frameRate: 25 })).toBe(7.7)
    expect(getVideoDurationSeconds('ltxr', 5, { frameBase: 11, frameRate: 19 })).toBe(2.9)
  })

  it('preserves duration values for other models or missing frame settings', () => {
    expect(getVideoDurationSeconds('wan', 5, { frameBase: 8, frameRate: 25 })).toBe(5)
    expect(getVideoDurationSeconds('ltx-wan', 8, { frameBase: 8, frameRate: 25 })).toBe(8)
    expect(getVideoDurationSeconds('ltxa', 6, {})).toBe(6)
  })
})
