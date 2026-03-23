import { NextRequest } from 'next/server';
import { createRouteHandler } from '@/lib/api/route-handler';

function createRequest(url: string) {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

const noParams = { params: Promise.resolve({}) };

describe('createRouteHandler', () => {
  describe('auth: none', () => {
    it('should call handler without auth check', async () => {
      const handler = createRouteHandler({ auth: 'none' }, async () => {
        return { data: 'test' };
      });
      const res = await handler(createRequest('/api/test'), noParams);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ data: 'test' });
    });
  });

  describe('auth: user', () => {
    it('should return 401 when no session cookie', async () => {
      const handler = createRouteHandler({ auth: 'user' }, async () => {
        return { data: 'test' };
      });
      const res = await handler(createRequest('/api/test'), noParams);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toEqual({ error: '로그인이 필요합니다' });
    });
  });

  describe('auth: admin', () => {
    it('should return 401 when no session cookie', async () => {
      const handler = createRouteHandler({ auth: 'admin' }, async () => {
        return { data: 'test' };
      });
      const res = await handler(createRequest('/api/test'), noParams);
      expect(res.status).toBe(401);
    });
  });

  describe('error handling', () => {
    it('should catch thrown errors and return 500', async () => {
      const handler = createRouteHandler({ auth: 'none' }, async () => {
        throw new Error('something broke');
      });
      const res = await handler(createRequest('/api/test'), noParams);
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body).toEqual({ error: '서버 오류가 발생했습니다.' });
    });
  });

  describe('response wrapping', () => {
    it('should pass through Response instances', async () => {
      const { NextResponse } = await import('next/server');
      const handler = createRouteHandler({ auth: 'none' }, async () => {
        return NextResponse.json({ custom: true }, { status: 201 });
      });
      const res = await handler(createRequest('/api/test'), noParams);
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body).toEqual({ custom: true });
    });

    it('should wrap plain objects as 200 JSON', async () => {
      const handler = createRouteHandler({ auth: 'none' }, async () => {
        return { items: [1, 2, 3] };
      });
      const res = await handler(createRequest('/api/test'), noParams);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ items: [1, 2, 3] });
    });
  });

  describe('params', () => {
    it('should resolve and pass params to handler', async () => {
      const handler = createRouteHandler<{ id: string }>(
        { auth: 'none' },
        async (_req, { params }) => {
          return { id: params.id };
        }
      );
      const res = await handler(
        createRequest('/api/test/123'),
        { params: Promise.resolve({ id: '123' }) }
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ id: '123' });
    });
  });
});
