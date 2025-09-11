'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Loader2, BarChart3 } from 'lucide-react';
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

interface UserStats {
  totalQueueRequests: number;
  loraPresetCount: number;
}


export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUser(data.user);
            loadUserStats();
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

  const loadUserStats = async () => {
    setIsStatsLoading(true);
    try {
      const response = await fetch('/api/user/stats');
      if (response.ok) {
        const stats = await response.json();
        setUserStats(stats);
      }
    } catch (error) {
      console.error('사용자 통계 로드 실패:', error);
    } finally {
      setIsStatsLoading(false);
    }
  };

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
          <div className="flex items-start space-x-6">
            {user?.avatar ? (
              <Image
                src={`https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png`}
                alt={user.nickname || user.discordUsername}
                width={80}
                height={80}
                className="rounded-full border-2 border-slate-200"
              />
            ) : (
              <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center">
                <User className="h-10 w-10 text-slate-600" />
              </div>
            )}
            <div className="flex-1">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-slate-800">
                  {user.nickname || user.discordUsername}
                </h3>
                <p className="text-slate-600">{user.discordUsername}</p>
              </div>
              
              {/* 통계 정보 */}
              {isStatsLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-slate-500">통계 로딩 중...</span>
                </div>
              ) : userStats && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">총 요청</span>
                    </div>
                    <p className="text-xl font-bold text-blue-800">{userStats.totalQueueRequests}</p>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-700">프리셋</span>
                    </div>
                    <p className="text-xl font-bold text-purple-800">{userStats.loraPresetCount}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}