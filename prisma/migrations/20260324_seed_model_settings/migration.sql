INSERT OR IGNORE INTO system_settings (id, key, value, type, category, created_at, updated_at)
VALUES
  (lower(hex(randomblob(12))), 'wan.lora_enabled', 'false', 'boolean', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.megapixels', 'CONFIGURE_IN_ADMIN', 'number', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.shift', 'CONFIGURE_IN_ADMIN', 'number', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.nag_scale', 'CONFIGURE_IN_ADMIN', 'number', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.steps_high', 'CONFIGURE_IN_ADMIN', 'number', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.steps_low', 'CONFIGURE_IN_ADMIN', 'number', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.length', 'CONFIGURE_IN_ADMIN', 'number', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.sampler', 'CONFIGURE_IN_ADMIN', 'string', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.negative_prompt', 'CONFIGURE_IN_ADMIN', 'string', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.lora_enabled', 'true', 'boolean', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.cfg', 'CONFIGURE_IN_ADMIN', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.sigmas_1st_pass', 'CONFIGURE_IN_ADMIN', 'string', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.sigmas_2nd_pass', 'CONFIGURE_IN_ADMIN', 'string', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.nag_scale', 'CONFIGURE_IN_ADMIN', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.duration', 'CONFIGURE_IN_ADMIN', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.megapixels', 'CONFIGURE_IN_ADMIN', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.img_compression', 'CONFIGURE_IN_ADMIN', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.negative_prompt', 'CONFIGURE_IN_ADMIN', 'string', 'ltx', datetime('now'), datetime('now'));

DELETE FROM system_settings WHERE key = 'ltx.steps';
