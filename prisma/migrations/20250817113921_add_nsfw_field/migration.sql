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
    "lora" TEXT,
    "lora_strength" REAL,
    "lora_preset_data" TEXT,
    "is_nsfw" BOOLEAN NOT NULL DEFAULT false,
    "job_id" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" DATETIME,
    "completed_at" DATETIME,
    "failed_at" DATETIME,
    "error" TEXT,
    CONSTRAINT "queue_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_queue_requests" ("completed_at", "created_at", "error", "failed_at", "id", "image_file", "job_id", "lora", "lora_preset_data", "lora_strength", "nickname", "position", "prompt", "started_at", "status", "user_id") SELECT "completed_at", "created_at", "error", "failed_at", "id", "image_file", "job_id", "lora", "lora_preset_data", "lora_strength", "nickname", "position", "prompt", "started_at", "status", "user_id" FROM "queue_requests";
DROP TABLE "queue_requests";
ALTER TABLE "new_queue_requests" RENAME TO "queue_requests";
CREATE INDEX "queue_requests_user_id_idx" ON "queue_requests"("user_id");
CREATE INDEX "queue_requests_status_idx" ON "queue_requests"("status");
CREATE INDEX "queue_requests_position_idx" ON "queue_requests"("position");
CREATE INDEX "queue_requests_created_at_idx" ON "queue_requests"("created_at");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
