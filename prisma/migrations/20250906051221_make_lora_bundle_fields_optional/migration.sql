/*
  Warnings:

  - You are about to drop the column `description` on the `lora_bundles` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `lora_bundles` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_lora_bundles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "display_name" TEXT NOT NULL,
    "high_lora_filename" TEXT,
    "low_lora_filename" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_lora_bundles" ("created_at", "display_name", "high_lora_filename", "id", "low_lora_filename", "order", "updated_at") SELECT "created_at", "display_name", "high_lora_filename", "id", "low_lora_filename", "order", "updated_at" FROM "lora_bundles";
DROP TABLE "lora_bundles";
ALTER TABLE "new_lora_bundles" RENAME TO "lora_bundles";
CREATE UNIQUE INDEX "lora_bundles_display_name_key" ON "lora_bundles"("display_name");
CREATE INDEX "lora_bundles_order_idx" ON "lora_bundles"("order");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
