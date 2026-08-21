'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Loader2, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from '@/contexts/SessionContext';
import { NicknameForm } from '@/components/nickname/NicknameForm';
import { useNicknameForm } from '@/hooks/useNicknameForm';

export default function NicknameChangeePage() {
  const router = useRouter();
  const { user, isLoading, refreshSession } = useSession();
  const currentNickname = user?.nickname || user?.discordUsername || '';
  const form = useNicknameForm({
    currentNickname,
    apiErrorMessage: '닉네임 변경에 실패했습니다.',
    submitErrorLogMessage: 'Nickname change error',
    successNavigation: { type: 'assign', path: '/' },
    unchangedRedirect: '/',
    refreshSession,
  });

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push('/');
      return;
    }

  }, [isLoading, router, user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto pt-12">
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center space-x-3 px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">홈으로 돌아가기</span>
          </Link>
        </div>

        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {user?.avatar ? (
                <Image
                  src={`https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png`}
                  alt={user.nickname || user.discordUsername}
                  width={80}
                  height={80}
                  className="rounded-full border-4 border-border"
                />
              ) : (
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                  <User className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
            </div>
            <CardTitle className="text-2xl font-bold">닉네임 변경</CardTitle>
            <p className="text-muted-foreground">
              현재 닉네임: <strong>{currentNickname}</strong>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              새로운 닉네임을 입력해주세요.
            </p>
          </CardHeader>
          
          <CardContent>
            <NicknameForm
              form={form}
              label="새 닉네임"
              submitLabel="닉네임 변경"
              submittingLabel="변경 중..."
              cancel={{ label: '취소', onClick: () => router.push('/') }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
