-- Migrate LTX settings to v2 schema: single-pass only, distilled LoRA promoted,
-- deprecated VFI/ColorMatch/2-pass/legacy flags removed.
--
-- Strategy: RENAME ltx.1pass.* -> ltx.* to preserve operator-configured values.
-- DROP 2pass/vfi/rife/gmfss/color_match/upscale/lora_enabled/legacy *_2nd rows.
-- INSERT ltx.duration_options (new key); DROP ltx.duration (obsolete).

-- Rename 1pass.* keys to flat ltx.* (preserves operator values)
UPDATE system_settings SET key = 'ltx.unet',                       updated_at = datetime('now') WHERE key = 'ltx.1pass.unet';
UPDATE system_settings SET key = 'ltx.weight_dtype',               updated_at = datetime('now') WHERE key = 'ltx.1pass.weight_dtype';
UPDATE system_settings SET key = 'ltx.scheduler_steps',            updated_at = datetime('now') WHERE key = 'ltx.1pass.scheduler_steps';
UPDATE system_settings SET key = 'ltx.scheduler_max_shift',        updated_at = datetime('now') WHERE key = 'ltx.1pass.scheduler_max_shift';
UPDATE system_settings SET key = 'ltx.scheduler_base_shift',       updated_at = datetime('now') WHERE key = 'ltx.1pass.scheduler_base_shift';
UPDATE system_settings SET key = 'ltx.scheduler_stretch',          updated_at = datetime('now') WHERE key = 'ltx.1pass.scheduler_stretch';
UPDATE system_settings SET key = 'ltx.scheduler_terminal',         updated_at = datetime('now') WHERE key = 'ltx.1pass.scheduler_terminal';
UPDATE system_settings SET key = 'ltx.nag_scale',                  updated_at = datetime('now') WHERE key = 'ltx.1pass.nag_scale';
UPDATE system_settings SET key = 'ltx.nag_alpha',                  updated_at = datetime('now') WHERE key = 'ltx.1pass.nag_alpha';
UPDATE system_settings SET key = 'ltx.nag_tau',                    updated_at = datetime('now') WHERE key = 'ltx.1pass.nag_tau';
UPDATE system_settings SET key = 'ltx.audio_norm_enabled',         updated_at = datetime('now') WHERE key = 'ltx.1pass.audio_norm_enabled';
UPDATE system_settings SET key = 'ltx.audio_norm',                 updated_at = datetime('now') WHERE key = 'ltx.1pass.audio_norm';
UPDATE system_settings SET key = 'ltx.identity_guidance_scale',    updated_at = datetime('now') WHERE key = 'ltx.1pass.identity_guidance_scale';
UPDATE system_settings SET key = 'ltx.identity_start_percent',     updated_at = datetime('now') WHERE key = 'ltx.1pass.identity_start_percent';
UPDATE system_settings SET key = 'ltx.identity_end_percent',       updated_at = datetime('now') WHERE key = 'ltx.1pass.identity_end_percent';
UPDATE system_settings SET key = 'ltx.distilled_lora_enabled',     updated_at = datetime('now') WHERE key = 'ltx.1pass.distilled_lora_enabled';
UPDATE system_settings SET key = 'ltx.distilled_lora_name',        updated_at = datetime('now') WHERE key = 'ltx.1pass.distilled_lora_name';
UPDATE system_settings SET key = 'ltx.distilled_lora_strength',    updated_at = datetime('now') WHERE key = 'ltx.1pass.distilled_lora_strength';
UPDATE system_settings SET key = 'ltx.id_lora_strength',           updated_at = datetime('now') WHERE key = 'ltx.1pass.id_lora_strength';

-- Drop deprecated 2-pass rows
DELETE FROM system_settings WHERE key LIKE 'ltx.2pass.%';

-- Drop deprecated orphan legacy keys (pass_mode, *_2nd, VFI, RIFE, GMFSS, ColorMatch, upscaler, lora_enabled, obsolete duration)
DELETE FROM system_settings WHERE key IN (
  'ltx.pass_mode',
  'ltx.duration',
  'ltx.unet_2nd',
  'ltx.weight_dtype_2nd',
  'ltx.id_lora_strength_2nd',
  'ltx.nag_scale_2nd',
  'ltx.nag_alpha_2nd',
  'ltx.nag_tau_2nd',
  'ltx.vfi_enabled',
  'ltx.vfi_method',
  'ltx.vfi_multiplier',
  'ltx.vfi_clear_cache',
  'ltx.rife_model',
  'ltx.rife_precision',
  'ltx.rife_resolution_profile',
  'ltx.rife_custom_min_dim',
  'ltx.rife_custom_opt_dim',
  'ltx.rife_custom_max_dim',
  'ltx.gmfss_model',
  'ltx.color_match_enabled',
  'ltx.color_match_method',
  'ltx.color_match_strength',
  'ltx.latent_upscaler',
  'ltx.upscale_model',
  'ltx.lora_enabled'
);

-- Seed new key introduced in v2
INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at) VALUES
  ('ltx_duration_options', 'ltx.duration_options', '5,6,7', 'string', 'ltx', datetime('now'), datetime('now'));
