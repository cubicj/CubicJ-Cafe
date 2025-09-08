import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export function useAdminAuth() {
  const [error, setError] = useState('');
  const router = useRouter();

  const checkAdminResponse = useCallback(async (response: Response) => {
    if (response.status === 401) {
      router.push('/');
      return false;
    }
    if (response.status === 403) {
      setError('관리자 권한이 필요합니다.');
      return false;
    }
    return true;
  }, [router]);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  return {
    error,
    setError,
    clearError,
    checkAdminResponse
  };
}