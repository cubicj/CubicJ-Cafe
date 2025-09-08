'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Check, X, Loader2, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface SessionUser {
  id: string;
  discordId: string;
  discordUsername: string;
  nickname: string;
  avatar?: string;
  name?: string;
}

export default function NicknameChangeePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [currentNickname, setCurrentNickname] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [user, setUser] = useState<SessionUser | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUser(data.user);
            setCurrentNickname(data.user.nickname || data.user.name);
            setNickname(data.user.nickname || data.user.name);
          } else {
            router.push('/');
          }
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Auth status check failed:', error);
        router.push('/');
      }
    };

    checkAuthStatus();
  }, [router]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // 닉네임 중복 확인
  const checkNickname = async (value: string) => {
    if (value.length < 2 || value === currentNickname) {
      setIsAvailable(value === currentNickname ? true : null);
      return;
    }

    setIsChecking(true);
    try {
      const response = await fetch(`/api/setup/nickname?check=${encodeURIComponent(value)}`, {
        credentials: 'include'
      });
      const data = await response.json();
      setIsAvailable(data.available);
    } catch (error) {
      console.error('Nickname check error:', error);
      setIsAvailable(null);
    } finally {
      setIsChecking(false);
    }
  };

  // 닉네임 입력 처리
  const handleNicknameChange = (value: string) => {
    setNickname(value);
    setError('');
    setIsAvailable(null); // 즉시 상태 초기화로 반짝임 방지
    
    // 이전 타이머 정리
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // 새 타이머 설정 (1초로 증가)
    debounceTimer.current = setTimeout(() => {
      checkNickname(value);
    }, 1000);
  };

  // 닉네임 변경 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nickname.trim() || isSubmitting) return;
    if (nickname === currentNickname) {
      router.push('/');
      return;
    }
    if (isAvailable === false) {
      setError('이미 사용 중인 닉네임입니다.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/setup/nickname', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ nickname: nickname.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        // 성공 시 홈페이지로 이동하고 새로고침
        window.location.href = '/';
      } else {
        setError(data.error || '닉네임 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('Nickname change error:', error);
      setError('서버 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 p-6">
      <div className="max-w-2xl mx-auto pt-12">
        {/* 뒤로 가기 버튼 */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center space-x-3 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-white/50 rounded-lg transition-all duration-200"
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nickname">새 닉네임</Label>
                <div className="relative">
                  <Input
                    id="nickname"
                    type="text"
                    placeholder="2-20자 사이의 닉네임"
                    value={nickname}
                    onChange={(e) => handleNicknameChange(e.target.value)}
                    className="pr-10"
                    maxLength={20}
                    autoComplete="off"
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isChecking ? (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    ) : nickname.length >= 2 ? (
                      isAvailable === true ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : isAvailable === false ? (
                        <X className="h-4 w-4 text-red-500" />
                      ) : null
                    ) : null}
                  </div>
                </div>
                
                {/* 상태 메시지 - 항상 표시하여 레이아웃 안정화 */}
                <p className={`text-sm transition-colors duration-200 min-h-[20px] ${
                  nickname.length < 2
                    ? 'text-gray-400'
                    : isChecking 
                      ? 'text-gray-500' 
                      : nickname === currentNickname 
                        ? 'text-blue-600'
                        : isAvailable === true 
                          ? 'text-green-600' 
                          : isAvailable === false
                            ? 'text-red-600'
                            : 'text-gray-400'
                }`}>
                  {nickname.length < 2
                    ? '2자 이상 입력해주세요'
                    : isChecking 
                      ? '확인 중...'
                      : nickname === currentNickname 
                        ? '현재 닉네임과 동일합니다' 
                        : isAvailable === true
                          ? '✓ 사용 가능한 닉네임입니다' 
                          : isAvailable === false
                            ? '✗ 이미 사용 중인 닉네임입니다'
                            : '닉네임을 입력해주세요'
                  }
                </p>
                
                {/* 에러 메시지 */}
                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}
                
                {/* 도움말 */}
                <p className="text-xs text-gray-500">
                  한글, 영문, 숫자, _, -, 공백만 사용 가능합니다.
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={() => router.push('/')}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  className="flex-1"
                  disabled={!nickname.trim() || nickname === currentNickname || isAvailable === false || isSubmitting || isChecking}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      변경 중...
                    </>
                  ) : (
                    '닉네임 변경'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}