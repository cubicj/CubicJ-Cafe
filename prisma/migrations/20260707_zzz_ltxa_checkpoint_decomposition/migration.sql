INSERT OR IGNORE INTO system_settings (id, key, value, type, category, created_at, updated_at)
VALUES
  ('ltxa-unet-20260707', 'ltxa.unet', 'CONFIGURE_IN_ADMIN', 'string', 'ltxa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ltxa-unet-weight-dtype-20260707', 'ltxa.unet_weight_dtype', 'CONFIGURE_IN_ADMIN', 'string', 'ltxa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ltxa-clip-name-1-20260707', 'ltxa.clip_name_1', 'CONFIGURE_IN_ADMIN', 'string', 'ltxa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ltxa-clip-name-2-20260707', 'ltxa.clip_name_2', 'CONFIGURE_IN_ADMIN', 'string', 'ltxa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ltxa-video-vae-20260707', 'ltxa.video_vae', 'CONFIGURE_IN_ADMIN', 'string', 'ltxa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ltxa-second-pass-sampler-20260707', 'ltxa.second_pass_sampler', 'CONFIGURE_IN_ADMIN', 'string', 'ltxa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

DELETE FROM system_settings WHERE key IN ('ltxa.checkpoint', 'ltxa.text_encoder');
