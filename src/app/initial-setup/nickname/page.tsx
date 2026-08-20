'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useSession } from '@/contexts/SessionContext';
import { NicknameForm } from '@/components/nickname/NicknameForm';
import { useNicknameForm } from '@/hooks/useNicknameForm';

export default function NicknameSetupPage() {
  const router = useRouter();
  const { user, isLoading, refreshSession } = useSession();
  const form = useNicknameForm({
    apiErrorMessage: '닉네임 설정에 실패했습니다.',
    submitErrorLogMessage: 'Nickname setup error',
    successNavigation: { type: 'assign', path: '/' },
    refreshSession,
  });

  useEffect(() => {
    if (isLoading) return;
    if (!user || user.nickname) {
      router.push('/');
    }
  }, [isLoading, router, user]);

  if (!user || user.nickname) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 p-4">
      <Card className="w-full max-w-md">
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
          <CardTitle className="text-2xl font-bold">환영합니다! 🎉</CardTitle>
          <p className="text-gray-600">
            <strong>{user.discordUsername}</strong>님, CubicJ Cafe에 오신 것을 환영합니다!
          </p>
          <p className="text-sm text-gray-500 mt-2">
            다른 사용자들이 볼 수 있는 닉네임을 설정해주세요.
          </p>
        </CardHeader>
        
        <CardContent>
          <NicknameForm
            form={form}
            label="닉네임"
            submitLabel="닉네임 설정 완료"
            submittingLabel="설정 중..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
