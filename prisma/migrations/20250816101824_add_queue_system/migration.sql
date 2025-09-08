-- CreateTable
CREATE TABLE "queue_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "nickname" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "prompt" TEXT NOT NULL,
    "image_file" TEXT,
    "lora" TEXT,
    "lora_strength" REAL,
    "job_id" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" DATETIME,
    "completed_at" DATETIME,
    "failed_at" DATETIME,
    "error" TEXT,
    CONSTRAINT "queue_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "queue_requests_user_id_idx" ON "queue_requests"("user_id");

-- CreateIndex
CREATE INDEX "queue_requests_status_idx" ON "queue_requests"("status");

-- CreateIndex
CREATE INDEX "queue_requests_position_idx" ON "queue_requests"("position");

-- CreateIndex
CREATE INDEX "queue_requests_created_at_idx" ON "queue_requests"("created_at");
