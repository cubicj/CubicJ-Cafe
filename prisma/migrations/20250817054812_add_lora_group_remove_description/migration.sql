/*
  Warnings:

  - You are about to drop the column `description` on the `lora_presets` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_lora_preset_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "preset_id" TEXT NOT NULL,
    "lora_filename" TEXT NOT NULL,
    "lora_name" TEXT NOT NULL,
    "strength" REAL NOT NULL DEFAULT 0.8,
    "group" TEXT NOT NULL DEFAULT 'HIGH',
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lora_preset_items_preset_id_fkey" FOREIGN KEY ("preset_id") REFERENCES "lora_presets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_lora_preset_items" ("created_at", "id", "lora_filename", "lora_name", "order", "preset_id", "strength") SELECT "created_at", "id", "lora_filename", "lora_name", "order", "preset_id", "strength" FROM "lora_preset_items";
DROP TABLE "lora_preset_items";
ALTER TABLE "new_lora_preset_items" RENAME TO "lora_preset_items";
CREATE INDEX "lora_preset_items_preset_id_idx" ON "lora_preset_items"("preset_id");
CREATE INDEX "lora_preset_items_order_idx" ON "lora_preset_items"("order");
CREATE INDEX "lora_preset_items_group_idx" ON "lora_preset_items"("group");
CREATE TABLE "new_lora_presets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "lora_presets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_lora_presets" ("created_at", "id", "is_default", "is_public", "name", "updated_at", "user_id") SELECT "created_at", "id", "is_default", "is_public", "name", "updated_at", "user_id" FROM "lora_presets";
DROP TABLE "lora_presets";
ALTER TABLE "new_lora_presets" RENAME TO "lora_presets";
CREATE INDEX "lora_presets_user_id_idx" ON "lora_presets"("user_id");
CREATE INDEX "lora_presets_is_default_idx" ON "lora_presets"("is_default");
CREATE INDEX "lora_presets_is_public_idx" ON "lora_presets"("is_public");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
