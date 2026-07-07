INSERT OR IGNORE INTO system_settings (id, key, value, type, category, created_at, updated_at)
VALUES
  ('ltxa-second-pass-identity-guidance-scale-20260707', 'ltxa.second_pass_identity_guidance_scale', '0', 'number', 'ltxa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

DELETE FROM system_settings WHERE key = 'ltxa.end_image_enabled';
