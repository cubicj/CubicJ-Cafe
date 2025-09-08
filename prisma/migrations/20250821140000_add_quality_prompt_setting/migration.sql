-- 퀄리티 프롬프트 시스템 설정 추가
INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at)
VALUES (
  'cuid_quality_prompt_' || hex(randomblob(16)),
  'quality_prompt', 
  'The animation''s character design, line work, and color palette must remain perfectly consistent with the anime aesthetic of the provided source image in every frame.',
  'string',
  'video_generation',
  datetime('now'),
  datetime('now')
);