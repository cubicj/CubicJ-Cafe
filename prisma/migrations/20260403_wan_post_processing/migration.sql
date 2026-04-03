INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at) VALUES
  ('wan_color_match_enabled', 'wan.color_match_enabled', 'false', 'string', 'wan', datetime('now'), datetime('now')),
  ('wan_color_match_method', 'wan.color_match_method', 'CONFIGURE_IN_ADMIN', 'string', 'wan', datetime('now'), datetime('now')),
  ('wan_color_match_strength', 'wan.color_match_strength', 'CONFIGURE_IN_ADMIN', 'string', 'wan', datetime('now'), datetime('now')),
  ('wan_vfi_method', 'wan.vfi_method', 'rife', 'string', 'wan', datetime('now'), datetime('now')),
  ('wan_rife_custom_min_dim', 'wan.rife_custom_min_dim', 'CONFIGURE_IN_ADMIN', 'string', 'wan', datetime('now'), datetime('now')),
  ('wan_rife_custom_opt_dim', 'wan.rife_custom_opt_dim', 'CONFIGURE_IN_ADMIN', 'string', 'wan', datetime('now'), datetime('now')),
  ('wan_rife_custom_max_dim', 'wan.rife_custom_max_dim', 'CONFIGURE_IN_ADMIN', 'string', 'wan', datetime('now'), datetime('now')),
  ('wan_gmfss_model', 'wan.gmfss_model', 'CONFIGURE_IN_ADMIN', 'string', 'wan', datetime('now'), datetime('now')),
  ('wan_rtx_enabled', 'wan.rtx_enabled', 'true', 'string', 'wan', datetime('now'), datetime('now'));
