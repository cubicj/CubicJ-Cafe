-- AlterTable
ALTER TABLE "lora_preset_items" ADD COLUMN "bundle_id" TEXT;

-- CreateIndex
CREATE INDEX "lora_preset_items_bundle_id_idx" ON "lora_preset_items"("bundle_id");
