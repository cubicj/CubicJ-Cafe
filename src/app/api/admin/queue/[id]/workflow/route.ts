import { NextResponse } from 'next/server';
import { createRouteHandler } from '@/lib/api/route-handler';
import { QueueService } from '@/lib/database/queue';

export const GET = createRouteHandler(
  { auth: 'admin', category: 'admin' },
  async (_req, context) => {
    const { id } = await context!.params;

    const request = await QueueService.getWorkflowDownloadById(id);

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (!request.workflowJson) {
      return NextResponse.json({ error: 'No workflow data available' }, { status: 404 });
    }

    const filename = `workflow_${request.videoModel}_${request.id}.json`;
    const pretty = JSON.stringify(JSON.parse(request.workflowJson), null, 2);

    return new NextResponse(pretty, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  }
);
