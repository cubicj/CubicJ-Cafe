-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_lora_presets" (
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
INSERT INTO "new_lora_presets" ("created_at", "id", "is_default", "is_public", "name", "updated_at", "user_id") SELECT "created_at", "id", "is_default", "is_public", "name", "updated_at", "user_id" FROM "lora_presets";
DROP TABLE "lora_presets";
ALTER TABLE "new_lora_presets" RENAME TO "lora_presets";
CREATE INDEX "lora_presets_user_id_idx" ON "lora_presets"("user_id");
CREATE INDEX "lora_presets_is_default_idx" ON "lora_presets"("is_default");
CREATE INDEX "lora_presets_is_public_idx" ON "lora_presets"("is_public");
CREATE INDEX "lora_presets_order_idx" ON "lora_presets"("order");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
