'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ClientIcon } from '@/components/ui/client-icon';
import { Home, Palette, User, LogOut, Coffee, Settings, Shield } from 'lucide-react';
import { User as UserType } from '@/types';

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchUser = useCallback(async (retryCount = 0) => {
    const maxRetries = 3;
    const timeoutMs = 5000;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch('/api/auth/session', {
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setUser(data.user || null);
        
        if (data.user?.discordId) {
          checkAdminStatus(data.user.discordId);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
      
      if (retryCount < maxRetries && error instanceof Error && error.name !== 'AbortError') {
        console.log(`재시도 ${retryCount + 1}/${maxRetries}`);
        setTimeout(() => fetchUser(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
      
      setUser(null);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const checkAdminStatus = (discordId: string) => {
    const adminIds = process.env.NEXT_PUBLIC_ADMIN_DISCORD_IDS?.split(',').map(id => id.trim()) || [];
    setIsAdmin(adminIds.includes(discordId));
  };

  const handleSignOut = async () => {
    try {
      const response = await fetch('/api/auth/signout', { method: 'POST' });
      if (response.ok) {
        setUser(null);
        // 페이지 리로드 대신 현재 페이지가 인증이 필요한 페이지인 경우만 홈으로 이동
        if (window.location.pathname.startsWith('/settings') || 
            window.location.pathname.startsWith('/generate') ||
            window.location.pathname.startsWith('/profile')) {
          window.location.href = '/';
        }
        // 그 외의 경우는 상태만 업데이트 (페이지 리로드 없음)
      }
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const handleSignIn = () => {
    // Discord OAuth URL 직접 생성
    const discordClientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/auth/callback/discord`;
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${discordClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify`;
    window.location.href = discordAuthUrl;
  };

  return (
    <header className="bg-white border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
            <ClientIcon icon={Coffee} fallback="☕" className="h-6 w-6 sm:h-7 sm:w-7 text-amber-700" />
            <span className="font-bold text-lg sm:text-xl text-gray-800 hidden sm:block">CubicJ Cafe</span>
            <span className="font-bold text-lg text-gray-800 block sm:hidden">Cafe</span>
          </Link>

          {/* 네비게이션 탭 */}
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
              <Link 
                href="/generate" 
                className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  pathname === '/generate' 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                <ClientIcon icon={Palette} fallback="🎨" className="h-4 w-4" />
                <span className="hidden sm:block">ComfyUI</span>
              </Link>
            </div>
          </nav>

          {/* 사용자 영역 */}
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