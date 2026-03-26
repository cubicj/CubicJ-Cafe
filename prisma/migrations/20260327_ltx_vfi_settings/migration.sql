INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at) VALUES
  (lower(hex(randomblob(12))), 'ltx.vfi_checkpoint', 'CONFIGURE_IN_ADMIN', 'string', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.vfi_clear_cache', '200', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.vfi_multiplier', '2', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.video_crf', '19', 'number', 'ltx', datetime('now'), datetime('now'));
