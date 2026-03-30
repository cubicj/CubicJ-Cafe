/*
  Warnings:

  - You are about to drop the column `end_image_data` on the `queue_requests` table. All the data in the column will be lost.
  - You are about to drop the column `image_data` on the `queue_requests` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "audio_presets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "audio_blob" BLOB NOT NULL,
    "audio_filename" TEXT NOT NULL,
    "audio_mime_type" TEXT NOT NULL,
    "audio_size" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "audio_presets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_queue_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "nickname" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "prompt" TEXT NOT NULL,
    "image_file" TEXT,
    "image_blob" BLOB,
    "end_image_file" TEXT,
    "end_image_blob" BLOB,
    "audio_file" TEXT,
    "audio_blob" BLOB,
    "lora_preset_data" TEXT,
    "is_nsfw" BOOLEAN NOT NULL DEFAULT false,
    "job_id" TEXT,
    "server_type" TEXT,
    "server_id" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" DATETIME,
    "completed_at" DATETIME,
    "failed_at" DATETIME,
    "error" TEXT,
    "video_model" TEXT NOT NULL DEFAULT 'wan',
    "generation_mode" TEXT NOT NULL DEFAULT 'START_ONLY',
    "workflow_json" TEXT,
    CONSTRAINT "queue_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_queue_requests" ("audio_blob", "audio_file", "completed_at", "created_at", "end_image_file", "error", "failed_at", "id", "image_file", "is_nsfw", "job_id", "lora_preset_data", "nickname", "position", "prompt", "server_id", "server_type", "started_at", "status", "user_id", "video_model", "workflow_json") SELECT "audio_blob", "audio_file", "completed_at", "created_at", "end_image_file", "error", "failed_at", "id", "image_file", "is_nsfw", "job_id", "lora_preset_data", "nickname", "position", "prompt", "server_id", "server_type", "started_at", "status", "user_id", "video_model", "workflow_json" FROM "queue_requests";
DROP TABLE "queue_requests";
ALTER TABLE "new_queue_requests" RENAME TO "queue_requests";
CREATE INDEX "queue_requests_user_id_idx" ON "queue_requests"("user_id");
CREATE INDEX "queue_requests_status_idx" ON "queue_requests"("status");
CREATE INDEX "queue_requests_position_idx" ON "queue_requests"("position");
CREATE INDEX "queue_requests_server_type_idx" ON "queue_requests"("server_type");
CREATE INDEX "queue_requests_created_at_idx" ON "queue_requests"("created_at");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "audio_presets_user_id_idx" ON "audio_presets"("user_id");

-- CreateIndex
CREATE INDEX "audio_presets_order_idx" ON "audio_presets"("order");
