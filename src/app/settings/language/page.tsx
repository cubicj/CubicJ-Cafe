'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createLogger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Languages, Loader2, Check } from 'lucide-react';
import { ClientIcon } from '@/components/ui/client-icon';

interface TranslationService {
  id: string;
  name: string;
  description: string;
  icon: string;
  available: boolean;
}

const translationServices: TranslationService[] = [
  {
    id: 'google',
    name: '구글 번역',
    description: '빠르고 안정적인 웹 번역 서비스',
    icon: '🔍',
    available: true
  },
  {
    id: 'gemini',
    name: 'Gemini API',
    description: 'Google의 최신 AI 번역 서비스',
    icon: '✨',
    available: true
  }
];

const log = createLogger('page');

export default function LanguageSettingsPage() {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState('google');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUser(data.user);
            loadTranslationSettings(data.user.id);
          } else {
            router.push('/');
            return;
          }
        } else {
          router.push('/');
          return;
        }
      } catch (error) {
        log.error('Auth status check failed', { error: error instanceof Error ? error.message : String(error) });
        router.push('/');
        return;
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, [router]);

  const loadTranslationSettings = (userId: string) => {
    try {
      const saved = localStorage.getItem(`translation_service_${userId}`);
      if (saved && translationServices.find(s => s.id === saved)) {
        setSelectedService(saved);
      }
    } catch (error) {
      log.error('Failed to load translation settings', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      // 로컬 스토리지에 저장
      localStorage.setItem(`translation_service_${user.id}`, selectedService);
      
      // UI 피드백을 위한 지연
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setSaveMessage('번역 설정이 저장되었습니다.');
      
      // 3초 후 메시지 숨기기
      setTimeout(() => setSaveMessage(''), 3000);
      
      log.info('Translation service saved', { service: selectedService });
    } catch (error) {
      log.error('Failed to save translation settings', { error: error instanceof Error ? error.message : String(error) });
      setSaveMessage('저장에 실패했습니다. 다시 시도해주세요.');
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
      {/* 번역 툴 선택 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <ClientIcon icon={Languages} fallback="🌐" className="h-6 w-6 text-slate-700" />
            <span>번역 툴</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup 
            value={selectedService} 
            onValueChange={setSelectedService}
            className="space-y-4"
          >
            {translationServices.map((service) => (
              <div
                key={service.id}
                onClick={() => service.available && setSelectedService(service.id)}
                className={`relative p-4 border rounded-lg transition-all duration-200 ${
                  selectedService === service.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                } ${
                  !service.available ? 'opacity-50' : 'cursor-pointer'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <RadioGroupItem 
                    value={service.id} 
                    id={service.id}
                    disabled={!service.available}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label 
                      htmlFor={service.id} 
                      className={`text-base font-medium flex items-center space-x-2 ${
                        service.available ? 'cursor-pointer' : 'cursor-not-allowed'
                      }`}
                    >
                      <span className="text-lg">{service.icon}</span>
                      <span>{service.name}</span>
                      {!service.available && (
                        <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded">
                          준비중
                        </span>
                      )}
                    </Label>
                    <p className="text-sm text-slate-600 mt-1">
                      {service.description}
                    </p>
                  </div>
                  {selectedService === service.id && service.available && (
                    <Check className="h-5 w-5 text-blue-600" />
                  )}
                </div>
              </div>
            ))}
          </RadioGroup>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <div className="text-sm text-slate-500">
                현재 선택: <strong>{translationServices.find(s => s.id === selectedService)?.name}</strong>
              </div>
              <Button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-6"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    설정 저장
                  </>
                )}
              </Button>
            </div>
            
            {saveMessage && (
              <div className={`mt-3 p-3 rounded-lg text-sm ${
                saveMessage.includes('실패') 
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {saveMessage}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}