'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, ArrowRight, Loader2 } from 'lucide-react';
import { ClientIcon } from '@/components/ui/client-icon';
import Image from 'next/image';

interface SessionUser {
  id: string;
  discordId: string;
  discordUsername: string;
  nickname: string;
  avatar?: string;
  name?: string;
}

const settingsOptions = [
  {
    href: '/settings/nickname',
    icon: User,
    title: '닉네임 변경',
    description: '사용자 닉네임을 변경하고 관리합니다',
    color: 'text-blue-600'
  },
  // 나중에 추가될 설정들
  // {
  //   href: '/settings/notifications',
  //   icon: Bell,
  //   title: '알림 설정',
  //   description: 'Discord 알림 및 이메일 설정을 관리합니다',
  //   color: 'text-green-600'
  // },
  // {
  //   href: '/settings/privacy',
  //   icon: Shield,
  //   title: '개인정보 설정',
  //   description: '개인정보 및 프라이버시 설정을 관리합니다',
  //   color: 'text-purple-600'
  // },
  // {
  //   href: '/settings/account',
  //   icon: UserCircle,
  //   title: '계정 관리',
  //   description: '계정 정보 및 연결된 서비스를 관리합니다',
  //   color: 'text-orange-600'
  // }
];

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUser(data.user);
          } else {
            router.push('/');
          }
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Auth status check failed:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-slate-600" />
          <p className="text-slate-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* 사용자 정보 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <ClientIcon icon={User} fallback="👤" className="h-6 w-6 text-slate-700" />
            <span>계정 정보</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            {user?.avatar ? (
              <Image
                src={`https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png`}
                alt={user.nickname || user.discordUsername}
                width={64}
                height={64}
                className="rounded-full border-2 border-slate-200"
              />
            ) : (
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-slate-600" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                {user.nickname || user.discordUsername}
              </h3>
              <p className="text-slate-600">Discord: {user.discordUsername}</p>
              <p className="text-sm text-slate-500">ID: {user.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 설정 옵션들 */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-slate-800">설정 옵션</h2>
        <div className="grid gap-4">
          {settingsOptions.map((option) => (
            <Link key={option.href} href={option.href}>
              <Card className="transition-all duration-200 hover:shadow-md hover:bg-slate-50 cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg bg-slate-100 ${option.color}`}>
                        <ClientIcon 
                          icon={option.icon} 
                          fallback="⚙️" 
                          className="h-6 w-6" 
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-slate-800">
                          {option.title}
                        </h3>
                        <p className="text-slate-600">
                          {option.description}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* 빠른 실행 버튼들 */}
      <Card>
        <CardHeader>
          <CardTitle>빠른 실행</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/settings/nickname">
                <User className="h-4 w-4 mr-2" />
                닉네임 변경
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/generate">
                <ArrowRight className="h-4 w-4 mr-2" />
                생성 페이지로
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}