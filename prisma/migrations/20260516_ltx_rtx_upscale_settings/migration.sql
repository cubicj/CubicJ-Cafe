INSERT OR IGNORE INTO system_settings (id, key, value, type, category, created_at, updated_at) VALUES
  (lower(hex(randomblob(12))), 'ltx.rtx_enabled', 'true', 'boolean', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.rtx_resize_type', 'CONFIGURE_IN_ADMIN', 'string', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.rtx_scale', '1.5', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.rtx_quality', 'CONFIGURE_IN_ADMIN', 'string', 'ltx', datetime('now'), datetime('now'));
