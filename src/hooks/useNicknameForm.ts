'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, apiClient } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';

const log = createLogger('page');

type SuccessNavigation =
  | { type: 'assign'; path: string }
  | { type: 'push-and-reload'; path: string };

interface UseNicknameFormOptions {
  currentNickname?: string;
  apiErrorMessage: string;
  submitErrorLogMessage: string;
  successNavigation: SuccessNavigation;
  unchangedRedirect?: string;
  refreshSession?: () => Promise<void>;
}

export function useNicknameForm({
  currentNickname,
  apiErrorMessage,
  submitErrorLogMessage,
  successNavigation,
  unchangedRedirect,
  refreshSession,
}: UseNicknameFormOptions) {
  const router = useRouter();
  const [editedNickname, setEditedNickname] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nickname = editedNickname ?? currentNickname ?? '';
  const isCurrentNickname = currentNickname !== undefined && nickname === currentNickname;

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const checkNickname = async (value: string) => {
    if (value.length < 2 || (currentNickname !== undefined && value === currentNickname)) {
      setIsAvailable(value === currentNickname ? true : null);
      return;
    }

    setIsChecking(true);
    try {
      const data = await apiClient.get<{ available: boolean }>(
        `/api/setup/nickname?check=${encodeURIComponent(value)}`,
      );
      setIsAvailable(data.available);
    } catch (error) {
      log.error('Nickname check error', {
        error: error instanceof Error ? error.message : String(error),
      });
      setIsAvailable(null);
    } finally {
      setIsChecking(false);
    }
  };

  const handleNicknameChange = (value: string) => {
    setEditedNickname(value);
    setError('');
    setIsAvailable(null);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      checkNickname(value);
    }, 1000);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!nickname.trim() || isSubmitting) return;
    if (isCurrentNickname && unchangedRedirect) {
      router.push(unchangedRedirect);
      return;
    }
    if (isAvailable === false) {
      setError('이미 사용 중인 닉네임입니다.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await apiClient.post('/api/setup/nickname', { nickname: nickname.trim() });
      if (refreshSession) {
        await refreshSession();
      }

      if (successNavigation.type === 'assign') {
        window.location.assign(new URL(successNavigation.path, window.location.origin));
      } else {
        router.push(successNavigation.path);
        window.location.reload();
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setError(error.errorMessage || apiErrorMessage);
      } else {
        log.error(submitErrorLogMessage, {
          error: error instanceof Error ? error.message : String(error),
        });
        setError('서버 오류가 발생했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    nickname,
    isChecking,
    isSubmitting,
    isAvailable,
    isCurrentNickname,
    error,
    handleNicknameChange,
    handleSubmit,
    isSubmitDisabled:
      !nickname.trim() ||
      isCurrentNickname ||
      isAvailable === false ||
      isSubmitting ||
      isChecking,
  };
}

export type NicknameFormState = ReturnType<typeof useNicknameForm>;
