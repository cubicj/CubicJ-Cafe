INSERT OR IGNORE INTO "system_settings" ("id", "key", "value", "type", "category", "updated_at") VALUES (hex(randomblob(12)), 'ltx.video_format', 'video/h264-mp4', 'string', 'ltx', datetime('now'));
INSERT OR IGNORE INTO "system_settings" ("id", "key", "value", "type", "category", "updated_at") VALUES (hex(randomblob(12)), 'ltx.video_pix_fmt', 'yuv420p', 'string', 'ltx', datetime('now'));
