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
    const triggerTag = html.match(/<button\b[^>]*aria-expanded="false"[^>]*>/)?.[0];
    const triggerClass = triggerTag?.match(/class="([^"]*)"/)?.[1];
    const nicknameClass = html.match(/<span class="([^"]*)">Fake Nick<\/span>/)?.[1];
    const panelClass = html.match(/<div id="header-user-menu" class="([^"]*)">/)?.[1];

    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-controls="header-user-menu"');
    expect(html).toContain('id="header-user-menu"');
    expect(html).toContain('Fake Nick');
    expect(triggerClass).toContain('min-h-11');
    expect(triggerClass).toContain('sm:min-h-8');
    expect(nicknameClass).toContain('max-w-[8rem]');
    expect(nicknameClass).toContain('truncate');
    expect(nicknameClass).toContain('sm:max-w-none');
    expect(panelClass).toContain('group-hover:opacity-100');
    expect(panelClass).toContain('group-hover:visible');
    expect(panelClass).toContain('opacity-0');
    expect(panelClass).toContain('invisible');
  });

  it('renders menu items with mobile touch-target height', () => {
    sessionState.isAdmin = true;

    const html = renderToStaticMarkup(<Header />);
    const panelStart = html.indexOf('id="header-user-menu"');
    const panelHtml = html.slice(panelStart, html.indexOf('</header>', panelStart));
    const itemTags = panelHtml.match(/<(?:a|button)\b[^>]*>/g) ?? [];

    expect(itemTags).toHaveLength(3);
    for (const itemTag of itemTags) {
      const itemClass = itemTag.match(/class="([^"]*)"/)?.[1];

      expect(itemClass).toContain('min-h-11');
      expect(itemClass).toContain('sm:min-h-9');
    }
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
  });

  it('renders the login button and no menu when signed out', () => {
    sessionState.user = null;

    const html = renderToStaticMarkup(<Header />);

    expect(html).toContain('Discord 로그인');
    expect(html).not.toContain('id="header-user-menu"');
  });
});
