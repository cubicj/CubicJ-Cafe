import { NextRequest, NextResponse } from 'next/server';
import { generationStore } from '@/lib/generation-store';
import { parseQuery } from '@/lib/validations/parse';
import { generateStatusQuerySchema } from '@/lib/validations/schemas/generate';

import { createLogger } from '@/lib/logger';

const log = createLogger('api');

export async function GET(request: NextRequest) {
  const queryResult = parseQuery(generateStatusQuerySchema, request.nextUrl.searchParams);
  if (!queryResult.success) return queryResult.response;
  const { jobId } = queryResult.data;

  try {
    const job = generationStore.getJob(jobId);
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      prompt: job.prompt,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      error: job.error,
      promptId: job.promptId
    });

  } catch (error) {
    log.error('Error checking job status', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}