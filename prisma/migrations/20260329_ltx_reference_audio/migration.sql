ALTER TABLE queue_requests ADD COLUMN audio_file TEXT;
ALTER TABLE queue_requests ADD COLUMN audio_blob BLOB;

INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at) VALUES
  (lower(hex(randomblob(12))), 'ltx.id_lora_name', 'CONFIGURE_IN_ADMIN', 'string', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.id_lora_strength', 'CONFIGURE_IN_ADMIN', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.identity_guidance_scale', 'CONFIGURE_IN_ADMIN', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.identity_start_percent', 'CONFIGURE_IN_ADMIN', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.identity_end_percent', 'CONFIGURE_IN_ADMIN', 'number', 'ltx', datetime('now'), datetime('now'));
