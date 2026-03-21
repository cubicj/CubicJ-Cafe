-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "discord_id" TEXT NOT NULL,
    "discord_username" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "avatar" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "queue_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "nickname" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "prompt" TEXT NOT NULL,
    "image_file" TEXT,
    "end_image_file" TEXT,
    "end_image_data" TEXT,
    "lora" TEXT,
    "lora_strength" REAL,
    "lora_preset_data" TEXT,
    "is_nsfw" BOOLEAN NOT NULL DEFAULT false,
    "duration" INTEGER DEFAULT 5,
    "workflow_length" INTEGER,
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

-- CreateTable
CREATE TABLE "lora_presets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "lora_presets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lora_preset_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "preset_id" TEXT NOT NULL,
    "lora_filename" TEXT NOT NULL,
    "lora_name" TEXT NOT NULL,
    "strength" REAL NOT NULL DEFAULT 0.8,
    "group" TEXT NOT NULL DEFAULT 'HIGH',
    "order" INTEGER NOT NULL DEFAULT 0,
    "bundle_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lora_preset_items_preset_id_fkey" FOREIGN KEY ("preset_id") REFERENCES "lora_presets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'string',
    "category" TEXT NOT NULL DEFAULT 'general',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "lora_bundles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "display_name" TEXT NOT NULL,
    "high_lora_filename" TEXT,
    "low_lora_filename" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_discord_id_key" ON "users"("discord_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_nickname_key" ON "users"("nickname");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX "queue_requests_user_id_idx" ON "queue_requests"("user_id");

-- CreateIndex
CREATE INDEX "queue_requests_status_idx" ON "queue_requests"("status");

-- CreateIndex
CREATE INDEX "queue_requests_position_idx" ON "queue_requests"("position");

-- CreateIndex
CREATE INDEX "queue_requests_server_type_idx" ON "queue_requests"("server_type");

-- CreateIndex
CREATE INDEX "queue_requests_created_at_idx" ON "queue_requests"("created_at");

-- CreateIndex
CREATE INDEX "lora_presets_user_id_idx" ON "lora_presets"("user_id");

-- CreateIndex
CREATE INDEX "lora_presets_is_default_idx" ON "lora_presets"("is_default");

-- CreateIndex
CREATE INDEX "lora_presets_is_public_idx" ON "lora_presets"("is_public");

-- CreateIndex
CREATE INDEX "lora_presets_order_idx" ON "lora_presets"("order");

-- CreateIndex
CREATE INDEX "lora_preset_items_preset_id_idx" ON "lora_preset_items"("preset_id");

-- CreateIndex
CREATE INDEX "lora_preset_items_order_idx" ON "lora_preset_items"("order");

-- CreateIndex
CREATE INDEX "lora_preset_items_group_idx" ON "lora_preset_items"("group");

-- CreateIndex
CREATE INDEX "lora_preset_items_bundle_id_idx" ON "lora_preset_items"("bundle_id");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "lora_bundles_display_name_key" ON "lora_bundles"("display_name");

-- CreateIndex
CREATE INDEX "lora_bundles_order_idx" ON "lora_bundles"("order");
