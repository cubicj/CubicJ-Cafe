'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Cog } from 'lucide-react';
import { useAdminAuth } from './hooks/useAdminAuth';
import { useAdminSettings } from './hooks/useAdminSettings';
import SystemSettingsTab from './tabs/SystemSettingsTab';
import ModelSettingsTab from './tabs/ModelSettingsTab';
import DatabaseTab from './tabs/DatabaseTab';
import LoRABundleTab from './tabs/LoRABundleTab';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const { error } = useAdminAuth();
  const adminSettings = useAdminSettings();

  useEffect(() => {
    const initializeAdmin = async () => {
      // 필수 설정만 먼저 로드 (빠른 API들)
      await Promise.all([
        adminSettings.fetchSystemSettings(),
        adminSettings.fetchModelSettings()
      ]);
      setLoading(false);
      
      // ComfyUI 모델 목록은 백그라운드에서 로드 (느린 API)
      adminSettings.fetchAvailableModels();
    };

    initializeAdmin();
  }, [adminSettings]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">로딩 중...</div>
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