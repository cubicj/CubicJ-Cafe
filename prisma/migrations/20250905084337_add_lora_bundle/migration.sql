-- CreateTable
CREATE TABLE "lora_bundles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "display_name" TEXT NOT NULL,
    "description" TEXT DEFAULT '',
    "high_lora_filename" TEXT NOT NULL,
    "low_lora_filename" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "lora_bundles_display_name_key" ON "lora_bundles"("display_name");

-- CreateIndex
CREATE INDEX "lora_bundles_is_active_idx" ON "lora_bundles"("is_active");

-- CreateIndex
CREATE INDEX "lora_bundles_order_idx" ON "lora_bundles"("order");
