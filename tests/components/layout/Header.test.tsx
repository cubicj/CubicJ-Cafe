import { renderToStaticMarkup } from 'react-dom/server';
import Header from '@/components/layout/Header';

const sessionState = vi.hoisted(() => ({
  user: null as null | { id: string; discordId: string; discordUsername: string; nickname: string; avatar: string | null },
  isLoading: false,
  isAdmin: false,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

vi.mock('@/contexts/SessionContext', () => ({
  useSession: () => ({ ...sessionState, refreshSession: async () => {} }),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: { post: vi.fn(), get: vi.fn() },
}));

vi.mock('@/lib/auth/discord-login', () => ({
  startDiscordLogin: vi.fn(),
}));

const testUser = {
  id: 'user-1',
  discordId: 'discord-1',
  discordUsername: 'fake-user',
  nickname: 'Fake Nick',
  avatar: null,
};

describe('Header user menu', () => {
  beforeEach(() => {
    sessionState.user = testUser;
    sessionState.isLoading = false;
    sessionState.isAdmin = false;
  });

  it('renders a closed menu trigger with ARIA state', () => {
    const html = renderToStaticMarkup(<Header />);

    expect(html).toContain('aria-haspopup="menu"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-controls="header-user-menu"');
    expect(html).toContain('id="header-user-menu"');
    expect(html).toContain('role="menu"');
    expect(html).toMatch(/id="header-user-menu"[^>]*class="[^"]*\binvisible\b/);
    expect(html).toContain('Fake Nick');
  });

  it('renders menu items with mobile touch-target height', () => {
    const html = renderToStaticMarkup(<Header />);
    const menuItems = html.match(/role="menuitem"/g) ?? [];

    expect(menuItems).toHaveLength(2);
    expect(html).toMatch(/role="menuitem"[^>]*class="[^"]*\bmin-h-11\b[^"]*\bsm:min-h-9\b/);
  });

  it('hides the admin link for non-admin users', () => {
    const html = renderToStaticMarkup(<Header />);

    expect(html).not.toContain('href="/admin"');
    expect(html).not.toContain('어드민 페이지');
  });

  it('shows the admin link for admin users', () => {
    sessionState.isAdmin = true;

    const html = renderToStaticMarkup(<Header />);

    expect(html).toContain('href="/admin"');
    expect(html).toContain('어드민 페이지');
    expect(html.match(/role="menuitem"/g)).toHaveLength(3);
  });

  it('renders the login button and no menu when signed out', () => {
    sessionState.user = null;

    const html = renderToStaticMarkup(<Header />);

    expect(html).toContain('Discord 로그인');
    expect(html).not.toContain('role="menu"');
  });
});
