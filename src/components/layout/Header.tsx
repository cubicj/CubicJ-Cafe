'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createLogger } from '@/lib/logger';
import { useSession } from '@/contexts/SessionContext';
import { apiClient } from '@/lib/api-client';
import { startDiscordLogin } from '@/lib/auth/discord-login';

const log = createLogger('ui');
import { Button } from '@/components/ui/button';
import { ClientIcon } from '@/components/ui/client-icon';
import { Home, Video, Image, User, LogOut, Coffee, Settings, Shield } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const { user, isLoading, isAdmin } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const handleSignOut = async () => {
    try {
      await apiClient.post('/api/auth/signout');
      if (window.location.pathname.startsWith('/settings') ||
          window.location.pathname.startsWith('/i2v') ||
          window.location.pathname.startsWith('/profile')) {
        window.location.assign(new URL('/', window.location.origin));
      } else {
        window.location.reload();
      }
    } catch (error) {
      log.error('Sign-out failed', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const handleSignIn = async () => {
    try {
      await startDiscordLogin();
    } catch (error) {
      log.error('Failed to initiate Discord login', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  return (
    <header className="bg-card border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
            <ClientIcon icon={Coffee} fallback="☕" className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            <span className="font-bold text-lg sm:text-xl text-foreground hidden sm:block">CubicJ Cafe</span>
            <span className="font-bold text-lg text-foreground block sm:hidden">Cafe</span>
          </Link>

          <nav className="flex items-center">
            <div className="flex bg-muted rounded-lg p-1">
              <Link
                href="/"
                className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  pathname === '/'
                    ? 'bg-background text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                <ClientIcon icon={Home} fallback="🏠" className="h-4 w-4" />
                <span className="hidden sm:block">홈</span>
              </Link>
              <span
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium text-muted-foreground/50 cursor-default"
                title="준비중"
              >
                <ClientIcon icon={Image} fallback="🖼️" className="h-4 w-4" />
                <span className="hidden sm:block">Txt to Img</span>
              </span>
              <Link
                href="/i2v"
                className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  pathname === '/i2v'
                    ? 'bg-background text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                <ClientIcon icon={Video} fallback="🎬" className="h-4 w-4" />
                <span className="hidden sm:block">Img to Vid</span>
              </Link>
            </div>
          </nav>

          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="w-8 h-8 animate-pulse bg-muted rounded-full"></div>
            ) : user ? (
              <div className="flex items-center">
                <div ref={menuRef} className="relative group">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    aria-controls="header-user-menu"
                    onClick={() => setMenuOpen((value) => !value)}
                  >
                    <ClientIcon icon={User} fallback="👤" className="h-4 w-4" />
                    <span className="text-sm max-w-[8rem] truncate sm:max-w-none">
                      {user.nickname || user.discordUsername}
                    </span>
                  </Button>
                  <div
                    id="header-user-menu"
                    role="menu"
                    className={`absolute right-0 mt-2 w-48 bg-popover border rounded-lg shadow-lg transition-all duration-200 z-50 group-hover:opacity-100 group-hover:visible ${
                      menuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                    }`}
                  >
                    <div className="py-1">
                      <Link
                        href="/settings"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center min-h-11 sm:min-h-9 px-4 text-sm text-popover-foreground hover:bg-muted"
                      >
                        <span className="flex items-center space-x-2">
                          <ClientIcon icon={Settings} fallback="⚙️" className="h-4 w-4" />
                          <span>사용자 설정</span>
                        </span>
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          role="menuitem"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center min-h-11 sm:min-h-9 px-4 text-sm text-popover-foreground hover:bg-muted"
                        >
                          <span className="flex items-center space-x-2">
                            <ClientIcon icon={Shield} fallback="🛡️" className="h-4 w-4" />
                            <span>어드민 페이지</span>
                          </span>
                        </Link>
                      )}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleSignOut}
                        className="flex items-center w-full min-h-11 sm:min-h-9 px-4 text-sm text-left text-popover-foreground hover:bg-muted"
                      >
                        <span className="flex items-center space-x-2">
                          <ClientIcon icon={LogOut} fallback="🚪" className="h-4 w-4" />
                          <span>로그아웃</span>
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Button onClick={handleSignIn}>
                Discord 로그인
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
