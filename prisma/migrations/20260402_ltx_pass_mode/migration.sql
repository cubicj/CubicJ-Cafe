-- Phase 1: New shared keys
INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at)
VALUES
  (lower(hex(randomblob(12))), 'ltx.pass_mode', '2pass', 'string', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.rife_custom_min_dim', '640', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.rife_custom_opt_dim', '896', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.rife_custom_max_dim', '1120', 'number', 'ltx', datetime('now'), datetime('now'));

-- Phase 2: Copy existing mode-specific keys to 2pass namespace (preserves actual values)
INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at)
  SELECT lower(hex(randomblob(12))), 'ltx.2pass.unet', value, type, category, datetime('now'), datetime('now')
  FROM system_settings WHERE key = 'ltx.unet';
INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at)
  SELECT lower(hex(randomblob(12))), 'ltx.2pass.weight_dtype', value, type, category, datetime('now'), datetime('now')
  FROM system_settings WHERE key = 'ltx.weight_dtype';
INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at)
  SELECT lower(hex(randomblob(12))), 'ltx.2pass.unet_2nd', value, type, category, datetime('now'), datetime('now')
  FROM system_settings WHERE key = 'ltx.unet_2nd';
INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at)
  SELECT lower(hex(randomblob(12))), 'ltx.2pass.weight_dtype_2nd', value, type, category, datetime('now'), datetime('now')
  FROM system_settings WHERE key = 'ltx.weight_dtype_2nd';
INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at)
  SELECT lower(hex(randomblob(12))), 'ltx.2pass.nag_scale', value, type, category, datetime('now'), datetime('now')
  FROM system_settings WHERE key = 'ltx.nag_scale';
INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at)
  SELECT lower(hex(randomblob(12))), 'ltx.2pass.nag_alpha', value, type, category, datetime('now'), datetime('now')
  FROM system_settings WHERE key = 'ltx.nag_alpha';
INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at)
  SELECT lower(hex(randomblob(12))), 'ltx.2pass.nag_tau', value, type, category, datetime('now'), datetime('now')
  FROM system_settings WHERE key = 'ltx.nag_tau';
INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at)
  SELECT lower(hex(randomblob(12))), 'ltx.2pass.nag_scale_2nd', value, type, category, datetime('now'), datetime('now')
  FROM system_settings WHERE key = 'ltx.nag_scale_2nd';
INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at)
  SELECT lower(hex(randomblob(12))), 'ltx.2pass.nag_alpha_2nd', value, type, category, datetime('now'), datetime('now')
  FROM system_settings WHERE key = 'ltx.nag_alpha_2nd';
INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at)
  SELECT lower(hex(randomblob(12))), 'ltx.2pass.nag_tau_2nd', value, type, category, datetime('now'), datetime('now')
  FROM system_settings WHERE key = 'ltx.nag_tau_2nd';
INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at)
  SELECT lower(hex(randomblob(12))), 'ltx.2pass.audio_norm_1st', value, type, category, datetime('now'), datetime('now')
  FROM system_settings WHERE key = 'ltx.audio_norm_1st';
INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at)
  SELECT lower(hex(randomblob(12))), 'ltx.2pass.audio_norm_2nd', value, type, category, datetime('now'), datetime('now')
  FROM system_settings WHERE key = 'ltx.audio_norm_2nd';
INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at)
  SELECT lower(hex(randomblob(12))), 'ltx.2pass.scheduler_steps', value, type, category, datetime('now'), datetime('now')
  FROM system_settings WHERE key = 'ltx.scheduler_steps';
INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at)
  SELECT lower(hex(randomblob(12))), 'ltx.2pass.scheduler_max_shift', value, type, category, datetime('now'), datetime('now')
  FROM system_settings WHERE key = 'ltx.scheduler_max_shift';
INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at)
  SELECT lower(hex(randomblob(12))), 'ltx.2pass.scheduler_base_shift', value, type, category, datetime('now'), datetime('now')
  FROM system_settings WHERE key = 'ltx.scheduler_base_shift';
INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at)
  SELECT lower(hex(randomblob(12))), 'ltx.2pass.scheduler_stretch', value, type, category, datetime('now'), datetime('now')
  FROM system_settings WHERE key = 'ltx.scheduler_stretch';
INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at)
  SELECT lower(hex(randomblob(12))), 'ltx.2pass.scheduler_terminal', value, type, category, datetime('now'), datetime('now')
  FROM system_settings WHERE key = 'ltx.scheduler_terminal';
INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at)
  SELECT lower(hex(randomblob(12))), 'ltx.2pass.sigmas_2nd', value, type, category, datetime('now'), datetime('now')
  FROM system_settings WHERE key = 'ltx.sigmas_2nd';
INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at)
  SELECT lower(hex(randomblob(12))), 'ltx.2pass.id_lora_strength', value, type, category, datetime('now'), datetime('now')
  FROM system_settings WHERE key = 'ltx.id_lora_strength';
INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at)
  SELECT lower(hex(randomblob(12))), 'ltx.2pass.id_lora_strength_2nd', value, type, category, datetime('now'), datetime('now')
  FROM system_settings WHERE key = 'ltx.id_lora_strength_2nd';
INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at)
  SELECT lower(hex(randomblob(12))), 'ltx.2pass.identity_guidance_scale', value, type, category, datetime('now'), datetime('now')
  FROM system_settings WHERE key = 'ltx.identity_guidance_scale';
INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at)
  SELECT lower(hex(randomblob(12))), 'ltx.2pass.identity_start_percent', value, type, category, datetime('now'), datetime('now')
  FROM system_settings WHERE key = 'ltx.identity_start_percent';
INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at)
  SELECT lower(hex(randomblob(12))), 'ltx.2pass.identity_end_percent', value, type, category, datetime('now'), datetime('now')
  FROM system_settings WHERE key = 'ltx.identity_end_percent';
INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at)
  SELECT lower(hex(randomblob(12))), 'ltx.2pass.identity_guidance_scale_2nd', value, type, category, datetime('now'), datetime('now')
  FROM system_settings WHERE key = 'ltx.identity_guidance_scale_2nd';
INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at)
  SELECT lower(hex(randomblob(12))), 'ltx.2pass.identity_start_percent_2nd', value, type, category, datetime('now'), datetime('now')
  FROM system_settings WHERE key = 'ltx.identity_start_percent_2nd';
INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at)
  SELECT lower(hex(randomblob(12))), 'ltx.2pass.identity_end_percent_2nd', value, type, category, datetime('now'), datetime('now')
  FROM system_settings WHERE key = 'ltx.identity_end_percent_2nd';

-- Phase 3: Insert 1pass keys with placeholders/defaults
INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at)
VALUES
  (lower(hex(randomblob(12))), 'ltx.1pass.unet', 'CONFIGURE_IN_ADMIN', 'string', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.1pass.weight_dtype', 'default', 'string', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.1pass.nag_scale', '5', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.1pass.nag_alpha', '0.25', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.1pass.nag_tau', '2.3', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.1pass.audio_norm_enabled', 'false', 'boolean', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.1pass.audio_norm', 'CONFIGURE_IN_ADMIN', 'string', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.1pass.scheduler_steps', '12', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.1pass.scheduler_max_shift', '2.05', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.1pass.scheduler_base_shift', '0.95', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.1pass.scheduler_stretch', 'false', 'boolean', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.1pass.scheduler_terminal', '0.1', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.1pass.id_lora_strength', '0.75', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.1pass.identity_guidance_scale', '3', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.1pass.identity_start_percent', '0', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.1pass.identity_end_percent', '1', 'number', 'ltx', datetime('now'), datetime('now'));

-- Phase 4: Delete old mode-specific keys (now in 2pass namespace)
DELETE FROM system_settings WHERE key IN (
  'ltx.unet', 'ltx.weight_dtype', 'ltx.unet_2nd', 'ltx.weight_dtype_2nd',
  'ltx.nag_scale', 'ltx.nag_alpha', 'ltx.nag_tau',
  'ltx.nag_scale_2nd', 'ltx.nag_alpha_2nd', 'ltx.nag_tau_2nd',
  'ltx.audio_norm_1st', 'ltx.audio_norm_2nd',
  'ltx.scheduler_steps', 'ltx.scheduler_max_shift', 'ltx.scheduler_base_shift',
  'ltx.scheduler_stretch', 'ltx.scheduler_terminal',
  'ltx.sigmas_2nd',
  'ltx.id_lora_strength', 'ltx.id_lora_strength_2nd',
  'ltx.identity_guidance_scale', 'ltx.identity_start_percent', 'ltx.identity_end_percent',
  'ltx.identity_guidance_scale_2nd', 'ltx.identity_start_percent_2nd', 'ltx.identity_end_percent_2nd'
);
