-- CreateTable
CREATE TABLE "lora_presets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
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
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lora_preset_items_preset_id_fkey" FOREIGN KEY ("preset_id") REFERENCES "lora_presets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "lora_presets_user_id_idx" ON "lora_presets"("user_id");

-- CreateIndex
CREATE INDEX "lora_presets_is_default_idx" ON "lora_presets"("is_default");

-- CreateIndex
CREATE INDEX "lora_presets_is_public_idx" ON "lora_presets"("is_public");

-- CreateIndex
CREATE INDEX "lora_preset_items_preset_id_idx" ON "lora_preset_items"("preset_id");

-- CreateIndex
CREATE INDEX "lora_preset_items_order_idx" ON "lora_preset_items"("order");
