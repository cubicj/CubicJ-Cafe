import { NextResponse } from 'next/server';
import { createRouteHandler } from '@/lib/api/route-handler';
import { prisma } from '@/lib/database/prisma';

export const GET = createRouteHandler(
  { auth: 'admin', category: 'admin' },
  async (_req, context) => {
    const { id } = await context!.params;

    const request = await prisma.queueRequest.findUnique({
      where: { id },
      select: {
        id: true,
        workflowJson: true,
        videoModel: true,
        prompt: true,
        createdAt: true,
      },
    });

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (!request.workflowJson) {
      return NextResponse.json({ error: 'No workflow data available' }, { status: 404 });
    }

    const filename = `workflow_${request.videoModel}_${request.id}.json`;

    return new NextResponse(request.workflowJson, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  }
);
