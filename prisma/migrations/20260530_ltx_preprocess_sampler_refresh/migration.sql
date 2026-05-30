INSERT OR IGNORE INTO system_settings (id, key, value, type, category, created_at, updated_at)
VALUES
  ('ltxa-preprocess-img-compression-20260530', 'ltxa.preprocess_img_compression', '8', 'number', 'ltxa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ltxr-preprocess-img-compression-20260530', 'ltxr.preprocess_img_compression', '8', 'number', 'ltxr', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

UPDATE system_settings
SET value = 'sageattn_qk_int8_pv_fp8_cuda++',
    updated_at = CURRENT_TIMESTAMP
WHERE key IN ('ltxa.sage_attention', 'ltxr.sage_attention')
  AND value = 'auto';
