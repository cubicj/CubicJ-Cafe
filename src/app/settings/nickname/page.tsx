'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useSession } from '@/contexts/SessionContext';
import { NicknameForm } from '@/components/nickname/NicknameForm';
import { useNicknameForm } from '@/hooks/useNicknameForm';

export default function NicknameSettingsPage() {
  const router = useRouter();
  const { user, isLoading, refreshSession } = useSession();
  const currentNickname = user?.nickname || user?.discordUsername || '';
  const form = useNicknameForm({
    currentNickname,
    apiErrorMessage: '닉네임 변경에 실패했습니다.',
    submitErrorLogMessage: 'Nickname change error',
    successNavigation: { type: 'push-and-reload', path: '/settings' },
    unchangedRedirect: '/settings',
    refreshSession,
  });

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push('/');
      return;
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

  if (!user) {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          {user?.avatar ? (
            <Image
              src={`https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png`}
              alt={user.nickname || user.discordUsername}
              width={80}
              height={80}
              className="rounded-full border-4 border-blue-100"
            />
          ) : (
            <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="h-10 w-10 text-gray-600" />
            </div>
          )}
        </div>
        <CardTitle className="text-2xl font-bold">닉네임 변경</CardTitle>
        <p className="text-gray-600">
          현재 닉네임: <strong>{currentNickname}</strong>
        </p>
        <p className="text-sm text-gray-500 mt-2">
          새로운 닉네임을 입력해주세요.
        </p>
      </CardHeader>
      
      <CardContent>
        <NicknameForm
          form={form}
          label="새 닉네임"
          submitLabel="닉네임 변경"
          submittingLabel="변경 중..."
          cancel={{ label: '취소', onClick: () => router.push('/settings') }}
        />
      </CardContent>
    </Card>
  );
}
