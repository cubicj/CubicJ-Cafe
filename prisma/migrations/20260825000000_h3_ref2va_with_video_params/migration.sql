INSERT OR IGNORE INTO system_settings (id, key, value, type, category, created_at, updated_at)
SELECT 'h3-ref2va-steps-with-video-20260825', 'h3-ref2va.steps_with_video', value, 'number', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM system_settings WHERE key = 'h3-ref2va.steps';

INSERT OR IGNORE INTO system_settings (id, key, value, type, category, created_at, updated_at)
SELECT 'h3-ref2va-megapixels-with-video-20260825', 'h3-ref2va.megapixels_with_video', value, 'number', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM system_settings WHERE key = 'h3-ref2va.megapixels';
