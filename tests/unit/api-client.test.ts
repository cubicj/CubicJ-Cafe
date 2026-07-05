import { vi } from 'vitest';
import { apiClient } from '@/lib/api-client';

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
});
