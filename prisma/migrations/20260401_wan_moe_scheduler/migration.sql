DELETE FROM system_settings WHERE key IN (
  'wan.sigma_start_y_high',
  'wan.sigma_end_y_high',
  'wan.sigma_start_y_low',
  'wan.sigma_end_y_low',
  'wan.sigma_curve_data',
  'wan.sigma_preset'
);

INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at) VALUES
  ('wan_moe_scheduler', 'wan.moe_scheduler', 'CONFIGURE_IN_ADMIN', 'string', 'wan', datetime('now'), datetime('now')),
  ('wan_moe_boundary', 'wan.moe_boundary', 'CONFIGURE_IN_ADMIN', 'string', 'wan', datetime('now'), datetime('now')),
  ('wan_moe_interval', 'wan.moe_interval', 'CONFIGURE_IN_ADMIN', 'string', 'wan', datetime('now'), datetime('now')),
  ('wan_moe_denoise', 'wan.moe_denoise', 'CONFIGURE_IN_ADMIN', 'string', 'wan', datetime('now'), datetime('now'));
