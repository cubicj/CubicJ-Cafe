'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Languages, Loader2 } from 'lucide-react';
import { ClientIcon } from '@/components/ui/client-icon';
import { useSession } from '@/contexts/SessionContext';

export default function LanguageSettingsPage() {
  const router = useRouter();
  const { user, isLoading } = useSession();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [isLoading, router, user]);

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
