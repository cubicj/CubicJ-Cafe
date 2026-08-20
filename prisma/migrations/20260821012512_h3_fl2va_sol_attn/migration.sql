INSERT OR IGNORE INTO system_settings (id, key, value, type, category, created_at, updated_at)
VALUES
  ('h3-fl2va-sol-attn-enabled-20260821', 'h3-fl2va.sol_attn_enabled', 'false', 'boolean', 'h3-fl2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-fl2va-sol-attn-tau-start-20260821', 'h3-fl2va.sol_attn_tau_start', '0', 'number', 'h3-fl2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-fl2va-sol-attn-tau-end-20260821', 'h3-fl2va.sol_attn_tau_end', '0', 'number', 'h3-fl2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-fl2va-sol-attn-curve-20260821', 'h3-fl2va.sol_attn_curve', 'CONFIGURE_IN_ADMIN', 'string', 'h3-fl2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-fl2va-sol-attn-min-tokens-20260821', 'h3-fl2va.sol_attn_min_tokens', '0', 'number', 'h3-fl2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-fl2va-sol-attn-strict-20260821', 'h3-fl2va.sol_attn_strict', 'false', 'boolean', 'h3-fl2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-fl2va-sol-attn-dense-percent-20260821', 'h3-fl2va.sol_attn_dense_percent', '0', 'number', 'h3-fl2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-fl2va-sol-attn-thresh-type-20260821', 'h3-fl2va.sol_attn_thresh_type', 'CONFIGURE_IN_ADMIN', 'string', 'h3-fl2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-fl2va-sol-attn-int8-qk-20260821', 'h3-fl2va.sol_attn_int8_qk', 'false', 'boolean', 'h3-fl2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-fl2va-sol-attn-int8-pv-20260821', 'h3-fl2va.sol_attn_int8_pv', 'false', 'boolean', 'h3-fl2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-fl2va-sol-attn-sink-conditioning-20260821', 'h3-fl2va.sol_attn_sink_conditioning', 'CONFIGURE_IN_ADMIN', 'string', 'h3-fl2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-fl2va-sol-attn-dense-blocks-20260821', 'h3-fl2va.sol_attn_dense_blocks', '', 'string', 'h3-fl2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
