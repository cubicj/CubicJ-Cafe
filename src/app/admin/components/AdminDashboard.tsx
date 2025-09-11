'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Cog, Shield, AlertCircle } from 'lucide-react';
import { useAdminAuth } from './hooks/useAdminAuth';
import { useAdminSettings } from './hooks/useAdminSettings';
import SystemSettingsTab from './tabs/SystemSettingsTab';
import ModelSettingsTab from './tabs/ModelSettingsTab';
import DatabaseTab from './tabs/DatabaseTab';
import LoRABundleTab from './tabs/LoRABundleTab';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState('');
  const initialized = useRef(false);
  const { error } = useAdminAuth();
  const adminSettings = useAdminSettings();

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const checkAdminPermission = async () => {
      try {
        const response = await fetch('/api/auth/admin-check', {
          credentials: 'include'
        });
        
        if (response.ok) {
          setIsAuthorized(true);
          // 권한 확인 후 관리자 설정 로드
          await initializeAdminSettings();
        } else {
          const data = await response.json();
          setAuthError(data.error || '관리자 권한이 없습니다.');
          // 2초 후 홈으로 리디렉션
          setTimeout(() => {
            router.push('/');
          }, 2000);
        }
      } catch (error) {
        console.error('관리자 권한 확인 실패:', error);
        setAuthError('서버 오류가 발생했습니다.');
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    const initializeAdminSettings = async () => {
      try {
        // 필수 설정만 먼저 로드 (빠른 API들)
        await Promise.all([
          adminSettings.fetchSystemSettings(),
          adminSettings.fetchModelSettings()
        ]);
        
        // ComfyUI 모델 목록은 백그라운드에서 로드 (느린 API)
        adminSettings.fetchAvailableModels();
      } catch (error) {
        console.error('Admin 설정 초기화 실패:', error);
      }
    };

    checkAdminPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 권한이 없는 경우 - 오류 메시지와 리디렉션 안내
  if (!isAuthorized && authError) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-md mx-auto">
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertDescription className="flex flex-col space-y-2">
              <strong>접근 거부</strong>
              <span>{authError}</span>
              <span className="text-sm">잠시 후 홈페이지로 이동됩니다...</span>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // 로딩 중인 경우
  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2">
            <Shield className="h-5 w-5 animate-pulse text-blue-600" />
            <span>관리자 권한 확인 중...</span>
          </div>
        </div>
      </div>
    );
  }

  // 권한이 확인되지 않은 경우 (예상치 못한 상황)
  if (!isAuthorized) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-md mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>권한 확인 실패</strong>
              <br />관리자 페이지에 접근할 수 없습니다.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">관리자 대시보드</h1>
        <Badge variant="destructive">관리자 전용</Badge>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {adminSettings.success && (
        <Alert>
          <AlertDescription>{adminSettings.success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="advanced" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="advanced" className="flex items-center">
            <Cog className="w-4 h-4 mr-2" />
            고급 설정
          </TabsTrigger>
          <TabsTrigger value="lora-bundles" className="flex items-center">
            <Cog className="w-4 h-4 mr-2" />
            LoRA 번들
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center">
            <Database className="w-4 h-4 mr-2" />
            데이터베이스
          </TabsTrigger>
        </TabsList>

        <TabsContent value="advanced" className="space-y-4">
          <SystemSettingsTab {...adminSettings} />
          <ModelSettingsTab {...adminSettings} />
        </TabsContent>

        <TabsContent value="lora-bundles" className="space-y-4">
          <LoRABundleTab />
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <DatabaseTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}