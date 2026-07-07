INSERT OR IGNORE INTO system_settings (id, key, value, type, category, created_at, updated_at)
VALUES
  ('ltxa-guide-enabled-20260707', 'ltxa.guide_enabled', 'true', 'boolean', 'ltxa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ltxa-second-pass-guide-enabled-20260707', 'ltxa.second_pass_guide_enabled', 'false', 'boolean', 'ltxa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ltxa-second-pass-guide-frame-index-20260707', 'ltxa.second_pass_guide_frame_index', '0', 'number', 'ltxa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ltxa-second-pass-guide-strength-20260707', 'ltxa.second_pass_guide_strength', '0', 'number', 'ltxa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ltxa-second-pass-guide-crf-20260707', 'ltxa.second_pass_guide_crf', '0', 'number', 'ltxa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ltxa-second-pass-guide-blur-radius-20260707', 'ltxa.second_pass_guide_blur_radius', '0', 'number', 'ltxa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ltxa-second-pass-guide-interpolation-20260707', 'ltxa.second_pass_guide_interpolation', 'CONFIGURE_IN_ADMIN', 'string', 'ltxa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ltxa-second-pass-guide-crop-20260707', 'ltxa.second_pass_guide_crop', 'CONFIGURE_IN_ADMIN', 'string', 'ltxa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
