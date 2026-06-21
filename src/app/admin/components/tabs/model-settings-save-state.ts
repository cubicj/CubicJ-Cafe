export interface SaveStateField {
  key: string;
  type: string;
  allowEmpty?: boolean;
}

export function isModelSettingsSaveDisabled(
  saving: boolean,
  fields: SaveStateField[],
  values: Record<string, string>
): boolean {
  return (
    saving ||
    fields.some(
      (field) =>
        field.type !== 'boolean' && !field.allowEmpty && (values[field.key] ?? '').trim() === ''
    )
  );
}
