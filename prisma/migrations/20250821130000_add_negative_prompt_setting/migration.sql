-- 네거티브 프롬프트 시스템 설정 추가
INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at)
VALUES (
  'cuid_negative_prompt_' || hex(randomblob(16)),
  'negative_prompt', 
  '色调艳丽，过曝，静态，细节模糊不清，字幕，风格，作品，画作，画面，静止，整体发灰，最差质量，低质量，JPEG压缩残留，丑陋的，残缺的，多余的手指，画得不好的手部，画得不好的脸部，畸形的，毁容的，形态畸形的肢体，手指融合，静止不动的画面，杂乱的背景，三条腿，背景人很多，倒着走, wet skin, oily skin, wet hair, oily hair, shiny hair, plastic hair, realistic face, realistic skin',
  'string',
  'video_generation',
  datetime('now'),
  datetime('now')
);