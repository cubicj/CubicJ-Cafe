INSERT INTO system_settings (id, key, value, type, category, created_at, updated_at) VALUES
  ('lw_audio_norm_enabled', 'ltx-wan.audio_norm_enabled', 'true', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_distilled_lora_enabled', 'ltx-wan.distilled_lora_enabled', 'true', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_lora_enabled_wan', 'ltx-wan.lora_enabled_wan', 'false', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_vfi_enabled', 'ltx-wan.vfi_enabled', 'true', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_rtx_enabled', 'ltx-wan.rtx_enabled', 'true', 'string', 'ltx-wan', datetime('now'), datetime('now')),

  ('lw_unet', 'ltx-wan.unet', 'CONFIGURE_IN_ADMIN', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_weight_dtype', 'ltx-wan.weight_dtype', 'default', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_clip_gguf', 'ltx-wan.clip_gguf', 'CONFIGURE_IN_ADMIN', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_clip_embeddings', 'ltx-wan.clip_embeddings', 'CONFIGURE_IN_ADMIN', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_video_vae', 'ltx-wan.video_vae', 'CONFIGURE_IN_ADMIN', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_audio_vae', 'ltx-wan.audio_vae', 'CONFIGURE_IN_ADMIN', 'string', 'ltx-wan', datetime('now'), datetime('now')),

  ('lw_frame_rate', 'ltx-wan.frame_rate', '16', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_megapixels', 'ltx-wan.megapixels', '0.85', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_resize_multiple_of', 'ltx-wan.resize_multiple_of', '32', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_resize_upscale_method', 'ltx-wan.resize_upscale_method', 'lanczos', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_img_compression', 'ltx-wan.img_compression', '5', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_sampler', 'ltx-wan.sampler', 'CONFIGURE_IN_ADMIN', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_clown_eta', 'ltx-wan.clown_eta', '0.25', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_clown_bongmath', 'ltx-wan.clown_bongmath', 'true', 'string', 'ltx-wan', datetime('now'), datetime('now')),

  ('lw_scheduler_steps', 'ltx-wan.scheduler_steps', '12', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_scheduler_max_shift', 'ltx-wan.scheduler_max_shift', '2.05', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_scheduler_base_shift', 'ltx-wan.scheduler_base_shift', '0.95', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_scheduler_stretch', 'ltx-wan.scheduler_stretch', 'true', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_scheduler_terminal', 'ltx-wan.scheduler_terminal', '0.1', 'string', 'ltx-wan', datetime('now'), datetime('now')),

  ('lw_nag_scale', 'ltx-wan.nag_scale', '5', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_nag_alpha', 'ltx-wan.nag_alpha', '0.25', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_nag_tau', 'ltx-wan.nag_tau', '2.373', 'string', 'ltx-wan', datetime('now'), datetime('now')),

  ('lw_audio_norm', 'ltx-wan.audio_norm', '1,1,0.7,1,1,0.7,1,1,1,1,1,1', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_identity_guidance_scale', 'ltx-wan.identity_guidance_scale', '3', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_identity_start_percent', 'ltx-wan.identity_start_percent', '0', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_identity_end_percent', 'ltx-wan.identity_end_percent', '1', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_id_lora_name', 'ltx-wan.id_lora_name', 'CONFIGURE_IN_ADMIN', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_id_lora_strength', 'ltx-wan.id_lora_strength', '0.68', 'string', 'ltx-wan', datetime('now'), datetime('now')),

  ('lw_distilled_lora_name', 'ltx-wan.distilled_lora_name', 'CONFIGURE_IN_ADMIN', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_distilled_lora_strength', 'ltx-wan.distilled_lora_strength', '0.5', 'string', 'ltx-wan', datetime('now'), datetime('now')),

  ('lw_negative_prompt_ltx', 'ltx-wan.negative_prompt_ltx', 'realistic, photorealistic, live action, 3d render, morphing, distortion, warping, flicker, jitter, blurry, artifacts, glitch, overexposure, watermark, text, subtitles, music', 'string', 'ltx-wan', datetime('now'), datetime('now')),

  ('lw_unet_wan', 'ltx-wan.unet_wan', 'CONFIGURE_IN_ADMIN', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_clip_wan', 'ltx-wan.clip_wan', 'CONFIGURE_IN_ADMIN', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_vae_wan', 'ltx-wan.vae_wan', 'CONFIGURE_IN_ADMIN', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_shift', 'ltx-wan.shift', '5', 'string', 'ltx-wan', datetime('now'), datetime('now')),

  ('lw_sampler_wan', 'ltx-wan.sampler_wan', 'CONFIGURE_IN_ADMIN', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_clown_eta_wan', 'ltx-wan.clown_eta_wan', '0.25', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_clown_bongmath_wan', 'ltx-wan.clown_bongmath_wan', 'true', 'string', 'ltx-wan', datetime('now'), datetime('now')),

  ('lw_scheduler_wan', 'ltx-wan.scheduler_wan', 'CONFIGURE_IN_ADMIN', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_steps_wan', 'ltx-wan.steps_wan', '4', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_denoise_wan', 'ltx-wan.denoise_wan', '1', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_sigmas_rescale_start', 'ltx-wan.sigmas_rescale_start', '0.55', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_sigmas_rescale_end', 'ltx-wan.sigmas_rescale_end', '0', 'string', 'ltx-wan', datetime('now'), datetime('now')),

  ('lw_nag_scale_wan', 'ltx-wan.nag_scale_wan', '5', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_nag_alpha_wan', 'ltx-wan.nag_alpha_wan', '0.25', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_nag_tau_wan', 'ltx-wan.nag_tau_wan', '2.373', 'string', 'ltx-wan', datetime('now'), datetime('now')),

  ('lw_negative_prompt_wan', 'ltx-wan.negative_prompt_wan', '色调艳丽, 过曝, 静态, 细节模糊不清, 字幕, 风格, 作品, 画作, 画面, 静止, 整体发灰, 最差质量, 低质量, JPEG压缩残留, 丑陋的, 残缺的, 多余的手指, 画得不好的手部, 画得不好的脸部, 畸形的, 毁容的, 肢体畸形, 手指融合, 静止画面, 杂乱的背景, 三条腿, 背景中有很多人, 倒着走路, worst quality, blurry, static image, inconsistent motion, jittery, distorted, morphing, flickering, watermark, text, subtitles, artifacts', 'string', 'ltx-wan', datetime('now'), datetime('now')),

  ('lw_vfi_method', 'ltx-wan.vfi_method', 'rife', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_rife_model', 'ltx-wan.rife_model', 'CONFIGURE_IN_ADMIN', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_rife_precision', 'ltx-wan.rife_precision', 'fp32', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_rife_resolution_profile', 'ltx-wan.rife_resolution_profile', 'custom', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_rife_custom_min_dim', 'ltx-wan.rife_custom_min_dim', '704', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_rife_custom_opt_dim', 'ltx-wan.rife_custom_opt_dim', '960', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_rife_custom_max_dim', 'ltx-wan.rife_custom_max_dim', '1280', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_gmfss_model', 'ltx-wan.gmfss_model', 'CONFIGURE_IN_ADMIN', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_vfi_multiplier', 'ltx-wan.vfi_multiplier', '1', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_vfi_clear_cache', 'ltx-wan.vfi_clear_cache', '300', 'string', 'ltx-wan', datetime('now'), datetime('now')),

  ('lw_rtx_resize_type', 'ltx-wan.rtx_resize_type', 'scale by multiplier', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_rtx_scale', 'ltx-wan.rtx_scale', '1.5', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_rtx_quality', 'ltx-wan.rtx_quality', 'ULTRA', 'string', 'ltx-wan', datetime('now'), datetime('now')),

  ('lw_video_crf', 'ltx-wan.video_crf', '20', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_video_format', 'ltx-wan.video_format', 'video/h264-mp4', 'string', 'ltx-wan', datetime('now'), datetime('now')),
  ('lw_video_pix_fmt', 'ltx-wan.video_pix_fmt', 'yuv420p', 'string', 'ltx-wan', datetime('now'), datetime('now'));
