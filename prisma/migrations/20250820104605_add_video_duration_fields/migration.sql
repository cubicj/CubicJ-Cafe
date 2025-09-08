-- AlterTable
ALTER TABLE "queue_requests" ADD COLUMN "duration" INTEGER DEFAULT 5;
ALTER TABLE "queue_requests" ADD COLUMN "workflow_length" INTEGER;
