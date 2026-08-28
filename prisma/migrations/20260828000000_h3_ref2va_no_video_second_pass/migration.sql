INSERT OR IGNORE INTO system_settings (id, key, value, type, category, created_at, updated_at)
VALUES
  ('h3-ref2va-no-video-second-pass-megapixels-20260828', 'h3-ref2va.no_video_second_pass_megapixels', 'CONFIGURE_IN_ADMIN', 'number', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

DELETE FROM system_settings WHERE key = 'h3-ref2va.no_video_upscaler_megapixels';
