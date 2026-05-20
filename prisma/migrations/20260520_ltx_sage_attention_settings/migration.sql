INSERT OR IGNORE INTO "system_settings" ("id", "key", "value", "type", "category", "created_at", "updated_at") VALUES
  (lower(hex(randomblob(12))), 'ltxa.sage_attention', 'auto', 'string', 'ltxa', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltxa.sage_allow_compile', 'false', 'boolean', 'ltxa', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltxr.sage_attention', 'auto', 'string', 'ltxr', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltxr.sage_allow_compile', 'false', 'boolean', 'ltxr', datetime('now'), datetime('now'));
