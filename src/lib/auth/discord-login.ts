import { apiClient } from '@/lib/api-client';

export async function startDiscordLogin(
  navigate: (url: string) => void = url => {
    window.location.href = url;
  }
) {
  const { url } = await apiClient.post<{ url: string }>('/api/auth/discord');
  navigate(url);
}
