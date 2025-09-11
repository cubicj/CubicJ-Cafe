'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Languages, Loader2, Globe, Save } from 'lucide-react';
import { ClientIcon } from '@/components/ui/client-icon';

interface SessionUser {
  id: string;
  discordId: string;
  discordUsername: string;
  nickname: string;
  avatar?: string;
}

interface LanguageSettings {
  primaryLanguage: string;
  autoTranslate: boolean;
  showOriginal: boolean;
  translateUI: boolean;
}

const languageOptions = [
  { value: 'ko', label: '한국어 (Korean)', flag: '🇰🇷' },
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'ja', label: '日本語 (Japanese)', flag: '🇯🇵' },
  { value: 'zh', label: '中文 (Chinese)', flag: '🇨🇳' },
  { value: 'es', label: 'Español (Spanish)', flag: '🇪🇸' },
  { value: 'fr', label: 'Français (French)', flag: '🇫🇷' },
  { value: 'de', label: 'Deutsch (German)', flag: '🇩🇪' },
];

export default function LanguageSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<LanguageSettings>({
    primaryLanguage: 'ko',
    autoTranslate: true,
    showOriginal: false,
    translateUI: false
  });

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUser(data.user);
            loadLanguageSettings(data.user.id);
          } else {
            router.push('/');
          }
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Auth status check failed:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, [router]);

  const loadLanguageSettings = (userId: string) => {
    const saved = localStorage.getItem(`language-settings-${userId}`);
    if (saved) {
      try {
        const parsedSettings = JSON.parse(saved);
        setSettings(parsedSettings);
      } catch (error) {
        console.error('Failed to parse language settings:', error);
      }
    }
  };

  const saveSettings = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      localStorage.setItem(`language-settings-${user.id}`, JSON.stringify(settings));
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Failed to save language settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

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
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center space-x-3">
        <ClientIcon icon={Languages} fallback="🌐" className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-800">번역 설정</h1>
          <p className="text-slate-600">언어 및 번역 옵션을 관리하세요</p>
        </div>
      </div>

      {/* 기본 언어 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5 text-blue-600" />
            <span>기본 언어</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="primary-language">선호 언어</Label>
            <Select
              value={settings.primaryLanguage}
              onValueChange={(value) => setSettings({ ...settings, primaryLanguage: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="언어를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {languageOptions.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    <div className="flex items-center space-x-2">
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 자동 번역 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>자동 번역</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-translate">자동 번역 활성화</Label>
              <p className="text-sm text-slate-500">
                콘텐츠를 자동으로 선택한 언어로 번역합니다
              </p>
            </div>
            <Switch
              id="auto-translate"
              checked={settings.autoTranslate}
              onCheckedChange={(checked) => setSettings({ ...settings, autoTranslate: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-original">원문 표시</Label>
              <p className="text-sm text-slate-500">
                번역된 텍스트와 함께 원문도 표시합니다
              </p>
            </div>
            <Switch
              id="show-original"
              checked={settings.showOriginal}
              onCheckedChange={(checked) => setSettings({ ...settings, showOriginal: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="translate-ui">UI 번역</Label>
              <p className="text-sm text-slate-500">
                인터페이스 요소들도 번역합니다 (실험적 기능)
              </p>
            </div>
            <Switch
              id="translate-ui"
              checked={settings.translateUI}
              onCheckedChange={(checked) => setSettings({ ...settings, translateUI: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* 저장 버튼 */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              설정 저장
            </>
          )}
        </Button>
      </div>
    </div>
  );
}