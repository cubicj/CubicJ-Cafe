-- AlterTable
ALTER TABLE "queue_requests" ADD COLUMN "server_type" TEXT;

-- CreateIndex
CREATE INDEX "queue_requests_server_type_idx" ON "queue_requests"("server_type");
