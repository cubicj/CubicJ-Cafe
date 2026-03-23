import { createRouteHandler } from '@/lib/api/route-handler';

export const GET = createRouteHandler(
  { auth: 'admin' },
  async () => {
    return { isAdmin: true };
  }
);
