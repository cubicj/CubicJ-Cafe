-- Distilled LoRA toggle for 1pass and 2pass modes
INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at)
VALUES
  (lower(hex(randomblob(12))), 'ltx.1pass.distilled_lora_enabled', 'false', 'boolean', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.1pass.distilled_lora_name', 'CONFIGURE_IN_ADMIN', 'string', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.1pass.distilled_lora_strength', '0.6', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.2pass.distilled_lora_enabled', 'false', 'boolean', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.2pass.distilled_lora_name', 'CONFIGURE_IN_ADMIN', 'string', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.2pass.distilled_lora_strength', '0.6', 'number', 'ltx', datetime('now'), datetime('now'));
