-- AlterTable
ALTER TABLE "queue_requests" ADD COLUMN "aspect_height" INTEGER;
ALTER TABLE "queue_requests" ADD COLUMN "aspect_width" INTEGER;
ALTER TABLE "queue_requests" ADD COLUMN "resolution_mode" TEXT;

-- CreateTable
CREATE TABLE "queue_reference_files" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "request_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "slot" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "blob" BLOB,
    "include_soundtrack" BOOLEAN NOT NULL DEFAULT false,
    "audio_preset_name" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "queue_reference_files_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "queue_requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "queue_reference_files_request_id_idx" ON "queue_reference_files"("request_id");

-- CreateIndex
CREATE UNIQUE INDEX "queue_reference_files_request_id_kind_slot_key" ON "queue_reference_files"("request_id", "kind", "slot");

INSERT OR IGNORE INTO system_settings (id, key, value, type, category, created_at, updated_at)
VALUES
  ('h3-ref2va-enabled-20260821', 'h3-ref2va.enabled', 'false', 'boolean', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-unet-20260821', 'h3-ref2va.unet', 'CONFIGURE_IN_ADMIN', 'string', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-unet-weight-dtype-20260821', 'h3-ref2va.unet_weight_dtype', 'CONFIGURE_IN_ADMIN', 'string', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-clip-name-20260821', 'h3-ref2va.clip_name', 'CONFIGURE_IN_ADMIN', 'string', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-clip-type-20260821', 'h3-ref2va.clip_type', 'CONFIGURE_IN_ADMIN', 'string', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-clip-device-20260821', 'h3-ref2va.clip_device', 'CONFIGURE_IN_ADMIN', 'string', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-video-vae-20260821', 'h3-ref2va.video_vae', 'CONFIGURE_IN_ADMIN', 'string', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-audio-vae-20260821', 'h3-ref2va.audio_vae', 'CONFIGURE_IN_ADMIN', 'string', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-turbo-lora-20260821', 'h3-ref2va.turbo_lora', 'CONFIGURE_IN_ADMIN', 'string', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-turbo-lora-strength-20260821', 'h3-ref2va.turbo_lora_strength', '0', 'number', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-steps-20260821', 'h3-ref2va.steps', '0', 'number', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-sampler-20260821', 'h3-ref2va.sampler', 'CONFIGURE_IN_ADMIN', 'string', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-scheduler-20260821', 'h3-ref2va.scheduler', 'CONFIGURE_IN_ADMIN', 'string', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-shift-video-20260821', 'h3-ref2va.shift_video', '0', 'number', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-shift-audio-20260821', 'h3-ref2va.shift_audio', '0', 'number', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-attention-backend-20260821', 'h3-ref2va.attention_backend', 'CONFIGURE_IN_ADMIN', 'string', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-fused-modulation-20260821', 'h3-ref2va.fused_modulation', 'false', 'boolean', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-chunk-ff-enabled-20260821', 'h3-ref2va.chunk_feedforward_enabled', 'false', 'boolean', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-chunk-ff-chunks-20260821', 'h3-ref2va.chunk_feedforward_chunks', '0', 'number', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-chunk-ff-min-tokens-20260821', 'h3-ref2va.chunk_feedforward_min_tokens', '0', 'number', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-sol-attn-enabled-20260821', 'h3-ref2va.sol_attn_enabled', 'false', 'boolean', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-sol-attn-tau-start-20260821', 'h3-ref2va.sol_attn_tau_start', '0', 'number', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-sol-attn-tau-end-20260821', 'h3-ref2va.sol_attn_tau_end', '0', 'number', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-sol-attn-curve-20260821', 'h3-ref2va.sol_attn_curve', 'CONFIGURE_IN_ADMIN', 'string', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-sol-attn-min-tokens-20260821', 'h3-ref2va.sol_attn_min_tokens', '0', 'number', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-sol-attn-strict-20260821', 'h3-ref2va.sol_attn_strict', 'false', 'boolean', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-sol-attn-dense-percent-20260821', 'h3-ref2va.sol_attn_dense_percent', '0', 'number', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-sol-attn-thresh-type-20260821', 'h3-ref2va.sol_attn_thresh_type', 'CONFIGURE_IN_ADMIN', 'string', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-sol-attn-int8-qk-20260821', 'h3-ref2va.sol_attn_int8_qk', 'false', 'boolean', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-sol-attn-int8-pv-20260821', 'h3-ref2va.sol_attn_int8_pv', 'false', 'boolean', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-sol-attn-sink-conditioning-20260821', 'h3-ref2va.sol_attn_sink_conditioning', 'CONFIGURE_IN_ADMIN', 'string', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-sol-attn-dense-blocks-20260821', 'h3-ref2va.sol_attn_dense_blocks', '', 'string', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-megapixels-20260821', 'h3-ref2va.megapixels', '0', 'number', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-resize-multiple-of-20260821', 'h3-ref2va.resize_multiple_of', '0', 'number', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-resize-upscale-method-20260821', 'h3-ref2va.resize_upscale_method', 'CONFIGURE_IN_ADMIN', 'string', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-ref-image-size-20260821', 'h3-ref2va.ref_image_size', 'CONFIGURE_IN_ADMIN', 'string', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-duration-options-20260821', 'h3-ref2va.duration_options', '0', 'string', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-frames-per-step-20260821', 'h3-ref2va.frames_per_step', '0', 'number', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-frame-base-20260821', 'h3-ref2va.frame_base', '0', 'number', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-frame-rate-20260821', 'h3-ref2va.frame_rate', '0', 'number', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-video-crf-20260821', 'h3-ref2va.video_crf', '0', 'number', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-video-format-20260821', 'h3-ref2va.video_format', 'CONFIGURE_IN_ADMIN', 'string', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-video-pix-fmt-20260821', 'h3-ref2va.video_pix_fmt', 'CONFIGURE_IN_ADMIN', 'string', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-rtx-enabled-20260821', 'h3-ref2va.rtx_enabled', 'false', 'boolean', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-rtx-resize-type-20260821', 'h3-ref2va.rtx_resize_type', 'CONFIGURE_IN_ADMIN', 'string', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-rtx-scale-20260821', 'h3-ref2va.rtx_scale', '0', 'number', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('h3-ref2va-rtx-quality-20260821', 'h3-ref2va.rtx_quality', 'CONFIGURE_IN_ADMIN', 'string', 'h3-ref2va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
