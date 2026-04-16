-- Seed 9 operational settings into existing system_settings table (category: 'ops').
-- These externalize previously-hardcoded timeouts, intervals, and limits.
-- Tuning is done via direct sqlite edit; no admin UI per design.

INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at) VALUES
  ('ops_discord_channel_cache_ms',     'ops.discord_channel_cache_ms',     '300000',  'number', 'ops', datetime('now'), datetime('now')),
  ('ops_generation_sweep_interval_ms', 'ops.generation_sweep_interval_ms', '300000',  'number', 'ops', datetime('now'), datetime('now')),
  ('ops_generation_sweep_max_age_ms',  'ops.generation_sweep_max_age_ms',  '1800000', 'number', 'ops', datetime('now'), datetime('now')),
  ('ops_job_monitor_timeout_ms',       'ops.job_monitor_timeout_ms',       '1800000', 'number', 'ops', datetime('now'), datetime('now')),
  ('ops_queue_health_check_interval_ms', 'ops.queue_health_check_interval_ms', '60000', 'number', 'ops', datetime('now'), datetime('now')),
  ('ops_comfyui_http_timeout_ms',      'ops.comfyui_http_timeout_ms',      '30000',   'number', 'ops', datetime('now'), datetime('now')),
  ('ops_log_file_max_bytes',           'ops.log_file_max_bytes',           '20971520','number', 'ops', datetime('now'), datetime('now')),
  ('ops_log_file_retention_days',      'ops.log_file_retention_days',      '14',      'number', 'ops', datetime('now'), datetime('now')),
  ('ops_ws_history_poll_interval_ms',  'ops.ws_history_poll_interval_ms',  '60000',   'number', 'ops', datetime('now'), datetime('now'));
