-- Insert new settings
INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at)
VALUES
  (lower(hex(randomblob(12))), 'ltx.unet_2nd', 'CONFIGURE_IN_ADMIN', 'string', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.weight_dtype_2nd', 'default', 'string', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.nag_scale_2nd', '5', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.nag_alpha_2nd', '0.25', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.nag_tau_2nd', '2.3', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.color_match_enabled', 'true', 'boolean', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.vfi_method', 'rife', 'string', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.gmfss_model', 'GMFSS_fortuna_union', 'string', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.rtx_enabled', 'true', 'boolean', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.id_lora_strength_2nd', '0.8', 'number', 'ltx', datetime('now'), datetime('now'));

-- Remove distilled LoRA settings
DELETE FROM system_settings WHERE key IN ('ltx.distilled_lora_name', 'ltx.distilled_lora_strength');
