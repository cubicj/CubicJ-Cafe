DELETE FROM system_settings WHERE key = 'ltx.steps';

INSERT OR IGNORE INTO system_settings (id, key, value, type, category, created_at, updated_at)
VALUES
  (lower(hex(randomblob(12))), 'ltx.sigmas_1st_pass', 'CONFIGURE_IN_ADMIN', 'string', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.sigmas_2nd_pass', 'CONFIGURE_IN_ADMIN', 'string', 'ltx', datetime('now'), datetime('now'));
