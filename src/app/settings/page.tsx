'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createLogger } from '@/lib/logger';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Loader2, BarChart3 } from 'lucide-react';
import { ClientIcon } from '@/components/ui/client-icon';
import { useSession } from '@/contexts/SessionContext';
import Image from 'next/image';

interface UserStats {
  totalQueueRequests: number;
  loraPresetCount: number;
}


const log = createLogger('page');

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading } = useSession();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [statsLoadComplete, setStatsLoadComplete] = useState(false);
  const isStatsLoading = !!user && !statsLoadComplete;

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push('/');
      return;
    }

    let ignore = false;
    apiClient.get<UserStats>('/api/user/stats')
      .then((stats) => {
        if (!ignore) setUserStats(stats);
      })
      .catch((error: unknown) => {
        log.error('Failed to load user stats', { error: error instanceof Error ? error.message : String(error) });
      })
      .finally(() => {
        if (!ignore) setStatsLoadComplete(true);
      });

    return () => {
      ignore = true;
    };
  }, [isLoading, router, user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">로딩 중...</p>
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
            <ClientIcon icon={User} fallback="👤" className="h-6 w-6 text-muted-foreground" />
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
                className="rounded-full border-2 border-border"
              />
            ) : (
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                <User className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <div className="mb-4">
                <h3 className="text-xl font-semibold">
                  {user.nickname || user.discordUsername}
                </h3>
                <p className="text-muted-foreground">{user.discordUsername}</p>
              </div>
              
              {/* 통계 정보 */}
              {isStatsLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">통계 로딩 중...</span>
                </div>
              ) : userStats && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50/60 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4 text-blue-600/70" />
                      <span className="text-sm font-medium text-blue-700/80">총 요청</span>
                    </div>
                    <p className="font-mono text-xl font-bold text-blue-700/80">{userStats.totalQueueRequests}</p>
                  </div>
                  
                  <div className="bg-purple-50/60 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-purple-600/70" />
                      <span className="text-sm font-medium text-purple-700/80">프리셋</span>
                    </div>
                    <p className="font-mono text-xl font-bold text-purple-700/80">{userStats.loraPresetCount}</p>
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
