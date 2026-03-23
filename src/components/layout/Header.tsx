'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createLogger } from '@/lib/logger';
import { apiClient } from '@/lib/api-client';
import { useSession } from '@/contexts/SessionContext';

const log = createLogger('ui');
import { Button } from '@/components/ui/button';
import { ClientIcon } from '@/components/ui/client-icon';
import { Home, Video, Image, User, LogOut, Coffee, Settings, Shield } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const { user, isLoading, isAdmin } = useSession();

  const handleSignOut = async () => {
    try {
      await apiClient.post('/api/auth/signout');
      if (window.location.pathname.startsWith('/settings') ||
          window.location.pathname.startsWith('/i2v') ||
          window.location.pathname.startsWith('/profile')) {
        window.location.href = '/';
      } else {
        window.location.reload();
      }
    } catch (error) {
      log.error('Sign-out failed', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const handleSignIn = async () => {
    try {
      const { url } = await apiClient.post<{ url: string }>('/api/auth/discord');
      window.location.href = url;
    } catch (error) {
      log.error('Failed to initiate Discord login', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  return (
    <header className="bg-white border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
            <ClientIcon icon={Coffee} fallback="☕" className="h-6 w-6 sm:h-7 sm:w-7 text-amber-700" />
            <span className="font-bold text-lg sm:text-xl text-gray-800 hidden sm:block">CubicJ Cafe</span>
            <span className="font-bold text-lg text-gray-800 block sm:hidden">Cafe</span>
          </Link>

          <nav className="flex items-center">
            <div className="flex bg-muted rounded-lg p-1">
              <Link
                href="/"
                className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  pathname === '/'
                    ? 'bg-background text-foreground shadow-sm'
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
                    ? 'bg-background text-foreground shadow-sm'
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
              <div className="w-8 h-8 animate-pulse bg-gray-200 rounded-full"></div>
            ) : user ? (
              <div className="flex items-center">
                <div className="relative group">
                  <Button variant="outline" size="sm" className="flex items-center space-x-2">
                    <ClientIcon icon={User} fallback="👤" className="h-4 w-4" />
                    <span className="text-sm">
                      {user.nickname || user.discordUsername}
                    </span>
                  </Button>
                  <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-1">
                      <Link
                        href="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <span className="flex items-center space-x-2">
                          <ClientIcon icon={Settings} fallback="⚙️" className="h-4 w-4" />
                          <span>사용자 설정</span>
                        </span>
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <span className="flex items-center space-x-2">
                            <ClientIcon icon={Shield} fallback="🛡️" className="h-4 w-4" />
                            <span>어드민 페이지</span>
                          </span>
                        </Link>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
