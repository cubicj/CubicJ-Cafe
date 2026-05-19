CREATE TABLE IF NOT EXISTS "watermark_assets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "image_blob" BLOB NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

INSERT OR IGNORE INTO "system_settings" ("id", "key", "value", "type", "category", "created_at", "updated_at") VALUES
  (lower(hex(randomblob(12))), 'ltxr.enabled', 'false', 'boolean', 'ltxr', datetime('now'), datetime('now'));

INSERT OR IGNORE INTO "system_settings" ("id", "key", "value", "type", "category", "created_at", "updated_at")
SELECT
  lower(hex(randomblob(12))),
  'ltxr.' || substr("key", 6),
  "value",
  "type",
  'ltxr',
  datetime('now'),
  datetime('now')
FROM "system_settings"
WHERE "key" LIKE 'ltxa.%'
  AND "key" NOT IN ('ltxa.enabled', 'ltxa.nsfw_lora_chain');

INSERT OR IGNORE INTO "system_settings" ("id", "key", "value", "type", "category", "created_at", "updated_at") VALUES
  (lower(hex(randomblob(12))), 'ltxr.watermark_enabled', 'false', 'boolean', 'ltxr', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltxr.watermark_image', '', 'string', 'ltxr', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltxr.watermark_position', 'center', 'string', 'ltxr', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltxr.watermark_scale', '80', 'number', 'ltxr', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltxr.watermark_transparency', '50', 'number', 'ltxr', datetime('now'), datetime('now'));
