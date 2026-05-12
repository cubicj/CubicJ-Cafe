INSERT OR IGNORE INTO system_settings (id, key, value, type, category, created_at, updated_at) VALUES
  ('wan_enabled', 'wan.enabled', 'true', 'boolean', 'wan', datetime('now'), datetime('now')),
  ('ltx_enabled', 'ltx.enabled', 'true', 'boolean', 'ltx', datetime('now'), datetime('now')),
  ('ltx_wan_enabled', 'ltx-wan.enabled', 'true', 'boolean', 'ltx-wan', datetime('now'), datetime('now'));
