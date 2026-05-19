UPDATE queue_requests
SET video_model = 'ltxa'
WHERE video_model = 'ltx';

UPDATE lora_presets
SET model = 'ltxa'
WHERE model = 'ltx';

UPDATE system_settings
SET key = 'ltxa.' || substr(key, 5),
    category = 'ltxa',
    updated_at = datetime('now')
WHERE key LIKE 'ltx.%';

UPDATE system_settings
SET category = 'ltxa',
    updated_at = datetime('now')
WHERE category = 'ltx';
