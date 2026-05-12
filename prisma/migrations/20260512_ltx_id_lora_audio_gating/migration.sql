INSERT OR IGNORE INTO "system_settings" ("id", "key", "value", "type", "category", "created_at", "updated_at") VALUES
  (lower(hex(randomblob(12))), 'ltx.id_lora_enabled', 'false', 'boolean', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.id_lora_name', 'CONFIGURE_IN_ADMIN', 'string', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.id_lora_strength', '1', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.id_lora_video', '0', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.id_lora_video_to_audio', '0', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.id_lora_audio', '0', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.id_lora_audio_to_video', '0', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.id_lora_other', '0', 'number', 'ltx', datetime('now'), datetime('now'));
