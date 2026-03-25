INSERT OR IGNORE INTO system_settings (id, key, value, type, category, created_at, updated_at)
VALUES
  -- WAN model files
  (lower(hex(randomblob(12))), 'wan.unet_high', 'CONFIGURE_IN_ADMIN', 'string', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.unet_low', 'CONFIGURE_IN_ADMIN', 'string', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.clip', 'CONFIGURE_IN_ADMIN', 'string', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.vae', 'CONFIGURE_IN_ADMIN', 'string', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.vfi_checkpoint', 'CONFIGURE_IN_ADMIN', 'string', 'wan', datetime('now'), datetime('now')),
  -- WAN NAG
  (lower(hex(randomblob(12))), 'wan.nag_alpha', 'CONFIGURE_IN_ADMIN', 'number', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.nag_tau', 'CONFIGURE_IN_ADMIN', 'number', 'wan', datetime('now'), datetime('now')),
  -- WAN Sigma
  (lower(hex(randomblob(12))), 'wan.sigma_start_y_high', 'CONFIGURE_IN_ADMIN', 'number', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.sigma_end_y_high', 'CONFIGURE_IN_ADMIN', 'number', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.sigma_start_y_low', 'CONFIGURE_IN_ADMIN', 'number', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.sigma_end_y_low', 'CONFIGURE_IN_ADMIN', 'number', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.sigma_curve_data', 'CONFIGURE_IN_ADMIN', 'string', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.sigma_preset', 'CONFIGURE_IN_ADMIN', 'string', 'wan', datetime('now'), datetime('now')),
  -- WAN Resize
  (lower(hex(randomblob(12))), 'wan.resize_multiple_of', 'CONFIGURE_IN_ADMIN', 'number', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.resize_upscale_method', 'CONFIGURE_IN_ADMIN', 'string', 'wan', datetime('now'), datetime('now')),
  -- WAN VFI
  (lower(hex(randomblob(12))), 'wan.vfi_clear_cache', 'CONFIGURE_IN_ADMIN', 'number', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.vfi_multiplier', 'CONFIGURE_IN_ADMIN', 'number', 'wan', datetime('now'), datetime('now')),
  -- WAN RTX
  (lower(hex(randomblob(12))), 'wan.rtx_resize_type', 'CONFIGURE_IN_ADMIN', 'string', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.rtx_scale', 'CONFIGURE_IN_ADMIN', 'number', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.rtx_quality', 'CONFIGURE_IN_ADMIN', 'string', 'wan', datetime('now'), datetime('now')),
  -- WAN Video
  (lower(hex(randomblob(12))), 'wan.frame_rate', 'CONFIGURE_IN_ADMIN', 'number', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.video_crf', 'CONFIGURE_IN_ADMIN', 'number', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.video_format', 'CONFIGURE_IN_ADMIN', 'string', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.video_pix_fmt', 'CONFIGURE_IN_ADMIN', 'string', 'wan', datetime('now'), datetime('now'));
  -- LTX settings are seeded in 20260325_ltx_workflow_replacement migration
