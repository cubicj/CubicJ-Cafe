/*
  Warnings:

  - You are about to drop the column `duration` on the `queue_requests` table. All the data in the column will be lost.
  - You are about to drop the column `lora` on the `queue_requests` table. All the data in the column will be lost.
  - You are about to drop the column `lora_strength` on the `queue_requests` table. All the data in the column will be lost.
  - You are about to drop the column `workflow_length` on the `queue_requests` table. All the data in the column will be lost.

*/
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
    "end_image_file" TEXT,
    "end_image_data" TEXT,
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
    "image_data" TEXT,
    CONSTRAINT "queue_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_queue_requests" ("completed_at", "created_at", "end_image_data", "end_image_file", "error", "failed_at", "id", "image_data", "image_file", "is_nsfw", "job_id", "lora_preset_data", "nickname", "position", "prompt", "server_id", "server_type", "started_at", "status", "user_id", "video_model") SELECT "completed_at", "created_at", "end_image_data", "end_image_file", "error", "failed_at", "id", "image_data", "image_file", "is_nsfw", "job_id", "lora_preset_data", "nickname", "position", "prompt", "server_id", "server_type", "started_at", "status", "user_id", "video_model" FROM "queue_requests";
DROP TABLE "queue_requests";
ALTER TABLE "new_queue_requests" RENAME TO "queue_requests";
CREATE INDEX "queue_requests_user_id_idx" ON "queue_requests"("user_id");
CREATE INDEX "queue_requests_status_idx" ON "queue_requests"("status");
CREATE INDEX "queue_requests_position_idx" ON "queue_requests"("position");
CREATE INDEX "queue_requests_server_type_idx" ON "queue_requests"("server_type");
CREATE INDEX "queue_requests_created_at_idx" ON "queue_requests"("created_at");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
