'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { User, Settings, BarChart3, Languages } from 'lucide-react';
import { ClientIcon } from '@/components/ui/client-icon';

interface SettingsLayoutProps {
  children: ReactNode;
}

const settingsNavItems = [
  {
    href: '/settings',
    label: '대시보드',
    icon: BarChart3
  },
  {
    href: '/settings/nickname',
    label: '닉네임 변경',
    icon: User
  },
  {
    href: '/settings/language',
    label: '번역 설정',
    icon: Languages
  },
];

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <ClientIcon icon={Settings} fallback="⚙️" className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold">설정</h1>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-80">
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-muted-foreground mb-4">설정 메뉴</h2>
              <nav className="space-y-2">
                {settingsNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block p-3 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <ClientIcon 
                          icon={item.icon} 
                          fallback="⚙️" 
                          className={`h-5 w-5 ${
                            isActive ? 'text-primary' : 'text-muted-foreground'
                          }`} 
                        />
                        <div className={`font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>
                          {item.label}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </Card>
          </div>

          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
