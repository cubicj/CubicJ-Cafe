import { vi } from 'vitest';
import { ApiError, apiClient } from '@/lib/api-client';

describe('apiClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns undefined for successful empty responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 200 })));

    await expect(apiClient.post('/api/example')).resolves.toBeUndefined();
  });

  it('uses plain-text error responses when JSON error bodies are absent', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('upstream failed', { status: 502 })));

    await expect(apiClient.get('/api/example')).rejects.toMatchObject({
      status: 502,
      errorMessage: 'upstream failed',
    });
  });

  it('uses validation detail messages for JSON error responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: 'Validation failed',
      details: [{ field: 'refImage_3', message: 'X' }],
    }), { status: 400 })));

    const error = await apiClient.get('/api/example').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).errorMessage).toBe('X');
  });

  it('uses the JSON error message when validation details are absent', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: 'Validation failed',
    }), { status: 400 })));

    await expect(apiClient.get('/api/example')).rejects.toMatchObject({
      status: 400,
      errorMessage: 'Validation failed',
    });
  });
});
