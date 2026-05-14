INSERT OR IGNORE INTO system_settings (id, key, value, type, category, created_at, updated_at) VALUES
  (lower(hex(randomblob(12))), 'ltx.end_image_enabled', 'false', 'boolean', 'ltx', datetime('now'), datetime('now'));
