INSERT OR IGNORE INTO system_settings (id, key, value, type, category, created_at, updated_at)
VALUES
  ('h3-fl2va-second-pass-megapixels-20260827', 'h3-fl2va.second_pass_megapixels', 'CONFIGURE_IN_ADMIN', 'number', 'h3-fl2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-fl2va-split-step-20260827', 'h3-fl2va.split_step', 'CONFIGURE_IN_ADMIN', 'number', 'h3-fl2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-fl2va-manual-sigmas-20260827', 'h3-fl2va.manual_sigmas', 'CONFIGURE_IN_ADMIN', 'string', 'h3-fl2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-fl2va-upscaler-model-20260827', 'h3-fl2va.upscaler_model', 'CONFIGURE_IN_ADMIN', 'string', 'h3-fl2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-fl2va-upscaler-align-20260827', 'h3-fl2va.upscaler_align', 'CONFIGURE_IN_ADMIN', 'number', 'h3-fl2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-fl2va-upscaler-chunking-20260827', 'h3-fl2va.upscaler_chunking', 'false', 'boolean', 'h3-fl2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-fl2va-upscaler-device-20260827', 'h3-fl2va.upscaler_device', 'CONFIGURE_IN_ADMIN', 'string', 'h3-fl2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-fl2va-upscaler-precision-20260827', 'h3-fl2va.upscaler_precision', 'CONFIGURE_IN_ADMIN', 'string', 'h3-fl2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

DELETE FROM system_settings WHERE key IN (
  'h3-fl2va.turbo_lora',
  'h3-fl2va.turbo_lora_strength',
  'h3-fl2va.megapixels_last'
);
