-- Delete removed setting
DELETE FROM "system_settings" WHERE "key" = 'ltx.sigmas';

-- Insert new settings
INSERT OR IGNORE INTO "system_settings" ("id", "key", "value", "type", "category", "updated_at")
VALUES
  (hex(randomblob(12)), 'ltx.scheduler_steps', 'CONFIGURE_IN_ADMIN', 'string', 'ltx', datetime('now')),
  (hex(randomblob(12)), 'ltx.scheduler_max_shift', 'CONFIGURE_IN_ADMIN', 'string', 'ltx', datetime('now')),
  (hex(randomblob(12)), 'ltx.scheduler_base_shift', 'CONFIGURE_IN_ADMIN', 'string', 'ltx', datetime('now')),
  (hex(randomblob(12)), 'ltx.scheduler_stretch', 'true', 'string', 'ltx', datetime('now')),
  (hex(randomblob(12)), 'ltx.scheduler_terminal', 'CONFIGURE_IN_ADMIN', 'string', 'ltx', datetime('now')),
  (hex(randomblob(12)), 'ltx.sigmas_2nd', 'CONFIGURE_IN_ADMIN', 'string', 'ltx', datetime('now')),
  (hex(randomblob(12)), 'ltx.distilled_lora_name', 'CONFIGURE_IN_ADMIN', 'string', 'ltx', datetime('now')),
  (hex(randomblob(12)), 'ltx.distilled_lora_strength', 'CONFIGURE_IN_ADMIN', 'string', 'ltx', datetime('now')),
  (hex(randomblob(12)), 'ltx.upscale_model', 'CONFIGURE_IN_ADMIN', 'string', 'ltx', datetime('now')),
  (hex(randomblob(12)), 'ltx.color_match_method', 'CONFIGURE_IN_ADMIN', 'string', 'ltx', datetime('now')),
  (hex(randomblob(12)), 'ltx.color_match_strength', 'CONFIGURE_IN_ADMIN', 'string', 'ltx', datetime('now'));
