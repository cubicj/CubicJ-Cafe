INSERT OR IGNORE INTO system_settings (id, key, value, type, category, created_at, updated_at)
VALUES
  ('ltxa-audio-vae-20260621', 'ltxa.audio_vae', 'CONFIGURE_IN_ADMIN', 'string', 'ltxa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ltxa-memory-sage-triton-20260621', 'ltxa.memory_sage_triton_kernels', 'false', 'boolean', 'ltxa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ltxa-torch-fp16-20260621', 'ltxa.torch_fp16_accumulation', 'false', 'boolean', 'ltxa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ltxa-chunk-dim-threshold-20260621', 'ltxa.chunk_feed_forward_dim_threshold', '1', 'number', 'ltxa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ltxa-attn-video-scale-20260621', 'ltxa.attention_tuner_video_scale', '1', 'number', 'ltxa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ltxa-attn-video-audio-scale-20260621', 'ltxa.attention_tuner_video_to_audio_scale', '1', 'number', 'ltxa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ltxa-attn-audio-scale-20260621', 'ltxa.attention_tuner_audio_scale', '1', 'number', 'ltxa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ltxa-attn-audio-video-scale-20260621', 'ltxa.attention_tuner_audio_to_video_scale', '1', 'number', 'ltxa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ltxa-attn-blocks-20260621', 'ltxa.attention_tuner_blocks', 'CONFIGURE_IN_ADMIN', 'string', 'ltxa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ltxa-attn-triton-20260621', 'ltxa.attention_tuner_triton_kernels', 'false', 'boolean', 'ltxa', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
