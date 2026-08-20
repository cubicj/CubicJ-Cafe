import { MODEL_ENABLED_KEYS, resolveEnabledModels } from '@/lib/database/system-settings/models'

describe('resolveEnabledModels', () => {
  it('defaults non-opt-in models to enabled and opt-in models to disabled', () => {
    expect(resolveEnabledModels(new Map())).toEqual(['wan', 'ltxa', 'ltx-wan'])
  })

  it('requires exact true for opt-in models and exact false to disable other models', () => {
    const values = new Map([
      [MODEL_ENABLED_KEYS.wan, 'false'],
      [MODEL_ENABLED_KEYS.ltxr, 'TRUE'],
      [MODEL_ENABLED_KEYS['h3-fl2va'], '1'],
    ])
    expect(resolveEnabledModels(values)).toEqual(['ltxa', 'ltx-wan'])

    values.set(MODEL_ENABLED_KEYS.ltxr, 'true')
    values.set(MODEL_ENABLED_KEYS['h3-fl2va'], 'true')
    expect(resolveEnabledModels(values)).toEqual(['ltxa', 'ltxr', 'ltx-wan', 'h3-fl2va'])
  })
})
