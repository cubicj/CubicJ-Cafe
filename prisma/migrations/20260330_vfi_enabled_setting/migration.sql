INSERT OR IGNORE INTO "system_settings" ("id", "key", "value", "type", "category", "updated_at") VALUES (hex(randomblob(12)), 'wan.vfi_enabled', 'true', 'boolean', 'wan', datetime('now'));
INSERT OR IGNORE INTO "system_settings" ("id", "key", "value", "type", "category", "updated_at") VALUES (hex(randomblob(12)), 'ltx.vfi_enabled', 'true', 'boolean', 'ltx', datetime('now'));
