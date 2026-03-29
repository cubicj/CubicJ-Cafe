-- SQLite stores enums as TEXT, no DDL change needed.
-- This migration exists to keep Prisma migration history in sync with schema.prisma.
-- New QueueStatus value: COMPLETED_WITH_ERROR
SELECT 1;
