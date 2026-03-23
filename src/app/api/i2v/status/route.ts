import { NextResponse } from 'next/server';
import { generationStore } from '@/lib/generation-store';
import { createRouteHandler } from '@/lib/api/route-handler';
import { parseQuery } from '@/lib/validations/parse';
import { i2vStatusQuerySchema } from '@/lib/validations/schemas/i2v';

export const GET = createRouteHandler(
  { auth: 'none' },
  async (req) => {
    const queryResult = parseQuery(i2vStatusQuerySchema, req.nextUrl.searchParams);
    if (!queryResult.success) return queryResult.response;
    const { jobId } = queryResult.data;

    const job = generationStore.getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return {
      jobId: job.id,
      status: job.status,
      prompt: job.prompt,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      error: job.error,
      promptId: job.promptId
    };
  }
);
