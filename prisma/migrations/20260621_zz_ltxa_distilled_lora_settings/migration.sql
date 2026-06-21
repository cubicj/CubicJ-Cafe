INSERT OR IGNORE INTO system_settings (id, key, value, type, category, created_at, updated_at)
VALUES
  ('ltxa-first-distill-name-20260621', 'ltxa.first_pass_distilled_lora_name', 'CONFIGURE_IN_ADMIN', 'string', 'ltxa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ltxa-first-distill-strength-20260621', 'ltxa.first_pass_distilled_lora_strength', 'CONFIGURE_IN_ADMIN', 'number', 'ltxa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ltxa-second-distill-name-20260621', 'ltxa.second_pass_distilled_lora_name', 'CONFIGURE_IN_ADMIN', 'string', 'ltxa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ltxa-second-distill-strength-20260621', 'ltxa.second_pass_distilled_lora_strength', 'CONFIGURE_IN_ADMIN', 'number', 'ltxa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
