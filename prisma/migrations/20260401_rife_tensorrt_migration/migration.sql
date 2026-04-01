DELETE FROM system_settings WHERE key IN (
  'wan.vfi_checkpoint',
  'ltx.vfi_checkpoint'
);

INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at) VALUES
  ('wan_rife_model', 'wan.rife_model', 'CONFIGURE_IN_ADMIN', 'string', 'wan', datetime('now'), datetime('now')),
  ('wan_rife_precision', 'wan.rife_precision', 'CONFIGURE_IN_ADMIN', 'string', 'wan', datetime('now'), datetime('now')),
  ('wan_rife_resolution_profile', 'wan.rife_resolution_profile', 'CONFIGURE_IN_ADMIN', 'string', 'wan', datetime('now'), datetime('now')),
  ('ltx_rife_model', 'ltx.rife_model', 'CONFIGURE_IN_ADMIN', 'string', 'ltx', datetime('now'), datetime('now')),
  ('ltx_rife_precision', 'ltx.rife_precision', 'CONFIGURE_IN_ADMIN', 'string', 'ltx', datetime('now'), datetime('now')),
  ('ltx_rife_resolution_profile', 'ltx.rife_resolution_profile', 'CONFIGURE_IN_ADMIN', 'string', 'ltx', datetime('now'), datetime('now'));
