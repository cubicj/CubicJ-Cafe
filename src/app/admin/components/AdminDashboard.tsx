'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createLogger } from '@/lib/logger';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Cog, Shield, AlertCircle, ScrollText, Power } from 'lucide-react';
import { useAdminAuth } from './hooks/useAdminAuth';
import { useAdminSettings } from './hooks/useAdminSettings';
import SystemSettingsTab from './tabs/SystemSettingsTab';
import ModelSettingsTab from './tabs/ModelSettingsTab';
import DatabaseTab from './tabs/DatabaseTab';
import LoRABundleTab from './tabs/LoRABundleTab';
import LogViewerTab from './tabs/LogViewerTab';

const log = createLogger('admin');

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState('');
  const initialized = useRef(false);
  const { error } = useAdminAuth();
  const adminSettings = useAdminSettings();
  const [comfyuiEnabled, setComfyuiEnabled] = useState(false);
  const [comfyuiLoading, setComfyuiLoading] = useState(true);
  const [comfyuiMessage, setComfyuiMessage] = useState('');

  const fetchComfyUIState = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/comfyui-toggle', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setComfyuiEnabled(data.enabled);
        return data.enabled;
      }
    } catch {
      // ignore
    } finally {
      setComfyuiLoading(false);
    }
    return false;
  };

  const toggleComfyUI = async (enabled: boolean) => {
    try {
      setComfyuiLoading(true);
      const response = await fetch('/api/admin/comfyui-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ enabled })
      });
      if (response.ok) {
        const data = await response.json();
        setComfyuiEnabled(data.enabled);
        setComfyuiMessage(`ComfyUI ${data.enabled ? '활성화' : '비활성화'}됨`);
        setTimeout(() => setComfyuiMessage(''), 3000);
        if (data.enabled) {
          adminSettings.fetchAvailableModels();
        }
      }
    } catch {
      // ignore
    } finally {
      setComfyuiLoading(false);
    }
  };

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
        log.error('Admin permission check failed', { error: error instanceof Error ? error.message : String(error) });
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
        const [, , comfyState] = await Promise.all([
          adminSettings.fetchSystemSettings(),
          adminSettings.fetchModelSettings(),
          fetchComfyUIState()
        ]);

        if (comfyState) {
          adminSettings.fetchAvailableModels();
        }
      } catch (error) {
        log.error('Admin settings initialization failed', { error: error instanceof Error ? error.message : String(error) });
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

      {comfyuiMessage && (
        <Alert>
          <AlertDescription>{comfyuiMessage}</AlertDescription>
        </Alert>
      )}

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Power className={`h-5 w-5 ${comfyuiEnabled ? 'text-green-500' : 'text-gray-400'}`} />
            <div>
              <h3 className="font-semibold">ComfyUI 서버</h3>
              <p className="text-sm text-muted-foreground">
                {comfyuiEnabled ? '활성 — 큐 모니터링 및 서버 체크 동작 중' : '비활성 — 모든 ComfyUI 연동 중단'}
              </p>
            </div>
          </div>
          <Switch
            checked={comfyuiEnabled}
            onCheckedChange={toggleComfyUI}
            disabled={comfyuiLoading}
          />
        </div>
      </Card>

      <Tabs defaultValue="advanced" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
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
          <TabsTrigger value="logs" className="flex items-center">
            <ScrollText className="w-4 h-4 mr-2" />
            Logs
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

        <TabsContent value="logs">
          <LogViewerTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}