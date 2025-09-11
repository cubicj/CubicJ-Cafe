'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, ArrowLeft, Settings } from 'lucide-react';
import { ClientIcon } from '@/components/ui/client-icon';

interface SettingsLayoutProps {
  children: ReactNode;
}

const settingsNavItems = [
  {
    href: '/settings/nickname',
    label: '닉네임 변경',
    icon: User,
    description: '사용자 닉네임을 변경합니다'
  },
  // 나중에 추가될 설정들
  // {
  //   href: '/settings/notifications',
  //   label: '알림 설정',
  //   icon: Bell,
  //   description: '알림 및 이메일 설정을 관리합니다'
  // },
  // {
  //   href: '/settings/privacy',
  //   label: '개인정보 설정',
  //   icon: Shield,
  //   description: '개인정보 및 프라이버시 설정을 관리합니다'
  // }
];

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center space-x-3 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-white/50 rounded-lg transition-all duration-200 mb-6"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">홈으로 돌아가기</span>
          </Link>
          
          <div className="flex items-center space-x-3">
            <ClientIcon icon={Settings} fallback="⚙️" className="h-8 w-8 text-slate-700" />
            <div>
              <h1 className="text-3xl font-bold text-slate-800">설정</h1>
              <p className="text-slate-600">계정 및 앱 설정을 관리하세요</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* 사이드바 네비게이션 */}
          <div className="lg:w-80">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">설정 메뉴</h2>
              <nav className="space-y-2">
                {settingsNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block p-4 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-50 border-l-4 border-blue-500 text-blue-700'
                          : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <ClientIcon 
                          icon={item.icon} 
                          fallback="⚙️" 
                          className={`h-5 w-5 mt-0.5 ${
                            isActive ? 'text-blue-600' : 'text-slate-500'
                          }`} 
                        />
                        <div>
                          <div className={`font-medium ${isActive ? 'text-blue-700' : 'text-slate-700'}`}>
                            {item.label}
                          </div>
                          <div className={`text-sm ${isActive ? 'text-blue-600' : 'text-slate-500'}`}>
                            {item.description}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </Card>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}