import { isModelSettingsSaveDisabled } from '@/app/admin/components/tabs/model-settings-save-state'

const field = (key: string, type: string, allowEmpty = false) => ({
  key,
  label: key,
  type,
  group: 'test',
  allowEmpty,
})

describe('ModelSettingsTab save state', () => {
  it('allows saving when only allow-empty fields are blank', () => {
    const fields = [
      field('required', 'string'),
      field('empty-anchor', 'string', true),
      field('enabled', 'boolean'),
    ]

    expect(
      isModelSettingsSaveDisabled(false, fields, {
        required: 'configured',
        'empty-anchor': '',
        enabled: 'false',
      })
    ).toBe(false)
  })

  it('keeps saving disabled when required text fields are blank', () => {
    const fields = [
      field('required', 'string'),
      field('empty-anchor', 'string', true),
    ]

    expect(
      isModelSettingsSaveDisabled(false, fields, {
        required: '',
        'empty-anchor': '',
      })
    ).toBe(true)
  })
})
