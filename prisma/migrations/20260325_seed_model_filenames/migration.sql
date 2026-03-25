INSERT OR IGNORE INTO system_settings (id, key, value, type, category, created_at, updated_at)
VALUES
  -- WAN model files
  (lower(hex(randomblob(12))), 'wan.unet_high', 'CONFIGURE_IN_ADMIN', 'string', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.unet_low', 'CONFIGURE_IN_ADMIN', 'string', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.clip', 'CONFIGURE_IN_ADMIN', 'string', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.vae', 'CONFIGURE_IN_ADMIN', 'string', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.vfi_checkpoint', 'CONFIGURE_IN_ADMIN', 'string', 'wan', datetime('now'), datetime('now')),
  -- WAN NAG
  (lower(hex(randomblob(12))), 'wan.nag_alpha', '0.25', 'number', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.nag_tau', '2.373', 'number', 'wan', datetime('now'), datetime('now')),
  -- WAN Sigma
  (lower(hex(randomblob(12))), 'wan.sigma_start_y_high', '1', 'number', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.sigma_end_y_high', '0.9', 'number', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.sigma_start_y_low', '0.9', 'number', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.sigma_end_y_low', '0', 'number', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.sigma_curve_data', '{"control_points":[{"x":0,"y":1},{"x":1,"y":0}],"samples":[[0,1],[0.5,0.5],[1,0]]}', 'string', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.sigma_preset', 'Simple', 'string', 'wan', datetime('now'), datetime('now')),
  -- WAN Resize
  (lower(hex(randomblob(12))), 'wan.resize_multiple_of', '16', 'number', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.resize_upscale_method', 'lanczos', 'string', 'wan', datetime('now'), datetime('now')),
  -- WAN VFI
  (lower(hex(randomblob(12))), 'wan.vfi_clear_cache', '100', 'number', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.vfi_multiplier', '2', 'number', 'wan', datetime('now'), datetime('now')),
  -- WAN RTX
  (lower(hex(randomblob(12))), 'wan.rtx_resize_type', 'scale by multiplier', 'string', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.rtx_scale', '1.5', 'number', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.rtx_quality', 'ULTRA', 'string', 'wan', datetime('now'), datetime('now')),
  -- WAN Video
  (lower(hex(randomblob(12))), 'wan.frame_rate', '32', 'number', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.video_crf', '20', 'number', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.video_format', 'video/h264-mp4', 'string', 'wan', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'wan.video_pix_fmt', 'yuv420p', 'string', 'wan', datetime('now'), datetime('now')),
  -- LTX model files
  (lower(hex(randomblob(12))), 'ltx.unet', 'CONFIGURE_IN_ADMIN', 'string', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.weight_dtype', 'default', 'string', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.clip_gguf', 'CONFIGURE_IN_ADMIN', 'string', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.clip_embeddings', 'CONFIGURE_IN_ADMIN', 'string', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.audio_vae', 'CONFIGURE_IN_ADMIN', 'string', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.video_vae', 'CONFIGURE_IN_ADMIN', 'string', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.spatial_upscaler', 'CONFIGURE_IN_ADMIN', 'string', 'ltx', datetime('now'), datetime('now')),
  -- LTX frame rate + resize
  (lower(hex(randomblob(12))), 'ltx.frame_rate', '24', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.resize_multiple_of', '32', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.resize_upscale_method', 'lanczos', 'string', 'ltx', datetime('now'), datetime('now')),
  -- LTX VAE decode
  (lower(hex(randomblob(12))), 'ltx.vae_spatial_tiles', '2', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.vae_spatial_overlap', '4', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.vae_temporal_tile_length', '32', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.vae_temporal_overlap', '4', 'number', 'ltx', datetime('now'), datetime('now')),
  -- LTX RTX
  (lower(hex(randomblob(12))), 'ltx.rtx_resize_type', 'scale by multiplier', 'string', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.rtx_scale', '2', 'number', 'ltx', datetime('now'), datetime('now')),
  (lower(hex(randomblob(12))), 'ltx.rtx_quality', 'ULTRA', 'string', 'ltx', datetime('now'), datetime('now'));
