INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at) VALUES
  ('wan_propagate_x0_high', 'wan.propagate_x0_high', 'true', 'boolean', 'wan', datetime('now'), datetime('now')),
  ('wan_propagate_x0_strength_high', 'wan.propagate_x0_strength_high', '0.98', 'float', 'wan', datetime('now'), datetime('now')),
  ('wan_propagate_x0_low', 'wan.propagate_x0_low', 'false', 'boolean', 'wan', datetime('now'), datetime('now')),
  ('wan_propagate_x0_strength_low', 'wan.propagate_x0_strength_low', '0.5', 'float', 'wan', datetime('now'), datetime('now'));
