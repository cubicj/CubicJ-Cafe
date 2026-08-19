import { vi } from 'vitest';
import { startDiscordLogin } from '@/lib/auth/discord-login';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

describe('startDiscordLogin', () => {
  it('starts login through the server OAuth endpoint', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      url: 'https://discord.com/api/oauth2/authorize?state=fake-state',
    });
    const navigate = vi.fn();

    await startDiscordLogin(navigate);

    expect(apiClient.post).toHaveBeenCalledWith('/api/auth/discord');
    expect(navigate).toHaveBeenCalledWith(
      'https://discord.com/api/oauth2/authorize?state=fake-state'
    );
  });
});
