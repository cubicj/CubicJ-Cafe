-- CFG 기본 설정 추가
INSERT OR IGNORE INTO "system_settings" ("id", "key", "value", "type", "category", "created_at", "updated_at") 
VALUES (
  lower(hex(randomblob(16))),
  'cfg_scale',
  '3',
  'number',
  'generation',
  datetime('now'),
  datetime('now')
);

-- 비디오 해상도 기본 설정도 추가 (이미 있으면 무시)
INSERT OR IGNORE INTO "system_settings" ("id", "key", "value", "type", "category", "created_at", "updated_at") 
VALUES (
  lower(hex(randomblob(16))),
  'video_resolution',
  '560',
  'number',
  'video',
  datetime('now'),
  datetime('now')
);