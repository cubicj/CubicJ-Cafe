'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createLogger } from '@/lib/logger';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Languages, Loader2 } from 'lucide-react';
import { ClientIcon } from '@/components/ui/client-icon';

const log = createLogger('page');

export default function LanguageSettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const data = await apiClient.get<{ user: { id: string } | null }>('/api/auth/session');
        if (!data.user) {
          router.push('/');
          return;
        }
      } catch (error) {
        log.error('Auth status check failed', { error: error instanceof Error ? error.message : String(error) });
        router.push('/');
        return;
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <ClientIcon icon={Languages} fallback="🌐" className="h-6 w-6 text-slate-700" />
            <span>번역 툴</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            현재 구글 번역을 사용하고 있습니다. 프롬프트 입력 시 한→영, 한→중 번역을 이용할 수 있습니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
