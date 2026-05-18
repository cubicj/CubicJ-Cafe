INSERT OR IGNORE INTO system_settings (id, key, value, type, category, created_at, updated_at) VALUES
  (lower(hex(randomblob(12))), 'ltx.sfw_lora_chain', '[]', 'string', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.nsfw_lora_chain', '[]', 'string', 'ltx', datetime('now'), datetime('now'));

WITH slots(slot) AS (VALUES (1), (2), (3), (4)),
legacy AS (
  SELECT
    slots.slot,
    json_object(
      'id', 'legacy-sfw-lora-' || slots.slot,
      'enabled', CASE lower(enabled.value) WHEN 'true' THEN json('true') ELSE json('false') END,
      'name', name.value,
      'strength', CAST(strength.value AS REAL),
      'video', CAST(video.value AS REAL),
      'videoToAudio', CAST(video_to_audio.value AS REAL),
      'audio', CAST(audio.value AS REAL),
      'audioToVideo', CAST(audio_to_video.value AS REAL),
      'other', CAST(other.value AS REAL)
    ) AS item
  FROM slots
  JOIN system_settings enabled ON enabled.key = 'ltx.sfw_lora_' || slots.slot || '_enabled'
  JOIN system_settings name ON name.key = 'ltx.sfw_lora_' || slots.slot || '_name'
  JOIN system_settings strength ON strength.key = 'ltx.sfw_lora_' || slots.slot || '_strength'
  JOIN system_settings video ON video.key = 'ltx.sfw_lora_' || slots.slot || '_video'
  JOIN system_settings video_to_audio ON video_to_audio.key = 'ltx.sfw_lora_' || slots.slot || '_video_to_audio'
  JOIN system_settings audio ON audio.key = 'ltx.sfw_lora_' || slots.slot || '_audio'
  JOIN system_settings audio_to_video ON audio_to_video.key = 'ltx.sfw_lora_' || slots.slot || '_audio_to_video'
  JOIN system_settings other ON other.key = 'ltx.sfw_lora_' || slots.slot || '_other'
)
UPDATE system_settings
SET
  value = (
    SELECT json_group_array(json(item))
    FROM (SELECT item FROM legacy ORDER BY slot)
  ),
  updated_at = datetime('now')
WHERE key = 'ltx.sfw_lora_chain'
  AND EXISTS (SELECT 1 FROM legacy);

WITH slots(slot) AS (VALUES (1), (2), (3), (4)),
legacy AS (
  SELECT
    slots.slot,
    json_object(
      'id', 'legacy-nsfw-lora-' || slots.slot,
      'enabled', CASE lower(enabled.value) WHEN 'true' THEN json('true') ELSE json('false') END,
      'name', name.value,
      'strength', CAST(strength.value AS REAL),
      'video', CAST(video.value AS REAL),
      'videoToAudio', CAST(video_to_audio.value AS REAL),
      'audio', CAST(audio.value AS REAL),
      'audioToVideo', CAST(audio_to_video.value AS REAL),
      'other', CAST(other.value AS REAL)
    ) AS item
  FROM slots
  JOIN system_settings enabled ON enabled.key = 'ltx.nsfw_lora_' || slots.slot || '_enabled'
  JOIN system_settings name ON name.key = 'ltx.nsfw_lora_' || slots.slot || '_name'
  JOIN system_settings strength ON strength.key = 'ltx.nsfw_lora_' || slots.slot || '_strength'
  JOIN system_settings video ON video.key = 'ltx.nsfw_lora_' || slots.slot || '_video'
  JOIN system_settings video_to_audio ON video_to_audio.key = 'ltx.nsfw_lora_' || slots.slot || '_video_to_audio'
  JOIN system_settings audio ON audio.key = 'ltx.nsfw_lora_' || slots.slot || '_audio'
  JOIN system_settings audio_to_video ON audio_to_video.key = 'ltx.nsfw_lora_' || slots.slot || '_audio_to_video'
  JOIN system_settings other ON other.key = 'ltx.nsfw_lora_' || slots.slot || '_other'
)
UPDATE system_settings
SET
  value = (
    SELECT json_group_array(json(item))
    FROM (SELECT item FROM legacy ORDER BY slot)
  ),
  updated_at = datetime('now')
WHERE key = 'ltx.nsfw_lora_chain'
  AND EXISTS (SELECT 1 FROM legacy);
