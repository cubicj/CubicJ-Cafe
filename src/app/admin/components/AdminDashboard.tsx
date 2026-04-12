'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createLogger } from '@/lib/logger';
import { apiClient, ApiError } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database, Shield, AlertCircle, ScrollText, Power, Pause, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from './hooks/useAdminAuth';
import { useAdminSettings } from './hooks/useAdminSettings';
import DatabaseTab from './tabs/DatabaseTab';
import LogViewerTab from './tabs/LogViewerTab';
import WanSettingsTab from './tabs/WanSettingsTab';
import LtxSettingsTab from './tabs/LtxSettingsTab';
import LtxWanSettingsTab from './tabs/LtxWanSettingsTab';

const log = createLogger('admin');

const ADMIN_TABS = [
  { value: 'database', label: '데이터베이스', icon: Database },
  { value: 'wan-settings', label: 'WAN', icon: SlidersHorizontal },
  { value: 'ltx-settings', label: 'LTX', icon: SlidersHorizontal },
  { value: 'ltx-wan-settings', label: 'L+W', icon: SlidersHorizontal },
  { value: 'logs', label: 'Logs', icon: ScrollText },
] as const;

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
  const [pausePosition, setPausePosition] = useState('');
  const [currentPause, setCurrentPause] = useState<number | null>(null);
  const [pauseLoading, setPauseLoading] = useState(false);
  const [pauseMessage, setPauseMessage] = useState('');
  const [activeTab, setActiveTab] = useState('database');

  const fetchComfyUIState = async (): Promise<boolean> => {
    try {
      const data = await apiClient.get<{ enabled: boolean }>('/api/admin/comfyui-toggle');
      setComfyuiEnabled(data.enabled);
      return data.enabled;
    } catch {
      return false;
    } finally {
      setComfyuiLoading(false);
    }
  };

  const toggleComfyUI = async (enabled: boolean) => {
    try {
      setComfyuiLoading(true);
      const data = await apiClient.post<{ enabled: boolean }>('/api/admin/comfyui-toggle', { enabled });
      setComfyuiEnabled(data.enabled);
      setComfyuiMessage(`ComfyUI ${data.enabled ? '활성화' : '비활성화'}됨`);
      setTimeout(() => setComfyuiMessage(''), 3000);
    } catch {
    } finally {
      setComfyuiLoading(false);
    }
  };

  const fetchPauseState = async () => {
    try {
      const data = await apiClient.get<{ pauseAfterPosition?: number }>('/api/queue?action=list');
      setCurrentPause(data.pauseAfterPosition ?? null);
    } catch {}
  };

  const handleSetPause = async () => {
    const position = parseInt(pausePosition);
    if (!position || position < 1) return;

    setPauseLoading(true);
    try {
      const data = await apiClient.post<{ pauseAfterPosition: number }>('/api/admin/queue-pause', { position });
      setCurrentPause(data.pauseAfterPosition);
      setPausePosition('');
      setPauseMessage(`#${data.pauseAfterPosition} 이후 큐 일시정지 예약됨`);
      setTimeout(() => setPauseMessage(''), 3000);
    } catch (err) {
      const message = err instanceof ApiError ? err.errorMessage : '네트워크 오류';
      setPauseMessage(message);
      setTimeout(() => setPauseMessage(''), 3000);
    } finally {
      setPauseLoading(false);
    }
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const checkAdminPermission = async () => {
      try {
        await apiClient.get('/api/auth/admin-check');
        setIsAuthorized(true);
        await initializeAdminSettings();
      } catch (error) {
        if (error instanceof ApiError) {
          setAuthError(error.errorMessage || '관리자 권한이 없습니다.');
        } else {
          log.error('Admin permission check failed', { error: error instanceof Error ? error.message : String(error) });
          setAuthError('서버 오류가 발생했습니다.');
        }
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    const initializeAdminSettings = async () => {
      try {
        await fetchComfyUIState();
        fetchPauseState();
      } catch (error) {
        log.error('Admin settings initialization failed', { error: error instanceof Error ? error.message : String(error) });
      }
    };

    checkAdminPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time mount check only
  }, []);

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

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Pause className={`h-5 w-5 ${currentPause !== null ? 'text-amber-500' : 'text-gray-400'}`} />
            <div>
              <h3 className="font-semibold">큐 일시정지 예약</h3>
              <p className="text-sm text-muted-foreground">
                {currentPause !== null
                  ? `#${currentPause} 이후 큐 일시정지 예약됨`
                  : '지정한 큐 번호 이후 처리를 일시정지합니다'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              value={pausePosition}
              onChange={(e) => setPausePosition(e.target.value)}
              placeholder="#"
              className="w-20 px-2 py-1 text-sm border rounded-md"
              disabled={pauseLoading}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSetPause}
              disabled={pauseLoading || !pausePosition}
            >
              설정
            </Button>
          </div>
        </div>
        {pauseMessage && (
          <p className="text-sm text-muted-foreground mt-2">{pauseMessage}</p>
        )}
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="block md:hidden mb-4">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ADMIN_TABS.map((tab) => (
                <SelectItem key={tab.value} value={tab.value}>
                  <div className="flex items-center gap-2">
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TabsList className="hidden md:grid w-full grid-cols-5">
          {ADMIN_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center">
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="wan-settings" className="space-y-4">
          <WanSettingsTab />
        </TabsContent>

        <TabsContent value="ltx-settings" className="space-y-4">
          <LtxSettingsTab />
        </TabsContent>

        <TabsContent value="ltx-wan-settings" className="space-y-4">
          <LtxWanSettingsTab />
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