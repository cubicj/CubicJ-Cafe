'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { LogOut, Settings, Shield, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClientIcon } from '@/components/ui/client-icon';
import type { User } from '@/types';

interface HeaderUserMenuProps {
  user: User;
  isAdmin: boolean;
  onSignOut: () => void;
}

export default function HeaderUserMenu({ user, isAdmin, onSignOut }: HeaderUserMenuProps) {
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

  return (
    <div ref={menuRef} className="relative group">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="flex items-center space-x-2 min-h-11 sm:min-h-8"
        aria-expanded={menuOpen}
        aria-controls="header-user-menu"
        onClick={() => setMenuOpen((value) => !value)}
      >
        <ClientIcon icon={UserIcon} fallback="👤" className="h-4 w-4" />
        <span className="text-sm max-w-[8rem] truncate sm:max-w-none">
          {user.nickname || user.discordUsername}
        </span>
      </Button>
      <div
        id="header-user-menu"
        className={`absolute right-0 mt-2 w-48 bg-popover border rounded-lg shadow-lg transition-all duration-200 z-50 group-hover:opacity-100 group-hover:visible ${
          menuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        <div className="py-1">
          <Link
            href="/settings"
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
            onClick={onSignOut}
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
  );
}
