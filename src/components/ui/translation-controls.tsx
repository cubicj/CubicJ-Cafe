"use client";

import { useState, useEffect } from 'react';
import { Button } from './button';
import { Loader2, RotateCcw, Languages } from 'lucide-react';

interface TranslationControlsProps {
  text: string;
  onTextChange: (text: string) => void;
  className?: string;
}

interface TranslationState {
  isTranslating: boolean;
  originalText: string;
  currentText: string;
  isTranslated: boolean;
  targetLang: string | null;
}

export function TranslationControls({
  text,
  onTextChange,
  className = "",
}: TranslationControlsProps) {
  const [state, setState] = useState<TranslationState>({
    isTranslating: false,
    originalText: text,
    currentText: text,
    isTranslated: false,
    targetLang: null,
  });

  const [translationService, setTranslationService] = useState<'google' | 'gemini'>('google');

  // 사용자 설정에서 번역 서비스 로드
  useEffect(() => {
    const loadTranslationSettings = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          if (data.user?.id) {
            const saved = localStorage.getItem(`translation_service_${data.user.id}`);
            if (saved && (saved === 'google' || saved === 'gemini')) {
              setTranslationService(saved);
            }
          }
        }
      } catch (error) {
        console.error('번역 설정 로드 실패:', error);
      }
    };

    loadTranslationSettings();
  }, []);

  // 외부에서 텍스트가 변경되면 상태 업데이트
  useEffect(() => {
    if (!state.isTranslated && text !== state.currentText) {
      setState(prev => ({
        ...prev,
        originalText: text,
        currentText: text,
      }));
    }
  }, [text, state.isTranslated, state.currentText]);

  const handleTranslate = async (targetLang: 'en' | 'zh') => {
    if (!text.trim() || state.isTranslating) return;

    setState(prev => ({
      ...prev,
      isTranslating: true,
    }));

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          service: translationService,
          sourceLang: 'ko',
          targetLang,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '번역 실패');
      }

      const data = await response.json();
      const translatedText = data.translatedText;

      setState(prev => ({
        ...prev,
        originalText: text,
        currentText: translatedText,
        isTranslated: true,
        targetLang,
      }));

      onTextChange(translatedText);

    } catch (error) {
      console.error('번역 오류:', error);
      alert(error instanceof Error ? error.message : '번역 중 오류가 발생했습니다.');
    } finally {
      setState(prev => ({
        ...prev,
        isTranslating: false,
      }));
    }
  };

  const handleRestore = () => {
    setState(prev => ({
      ...prev,
      currentText: prev.originalText,
      isTranslated: false,
      targetLang: null,
    }));
    onTextChange(state.originalText);
  };

  const getTargetLangLabel = (lang: string) => {
    switch (lang) {
      case 'en': return '영어';
      case 'zh': return '중국어';
      default: return lang;
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {!state.isTranslated ? (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleTranslate('en')}
            disabled={!text.trim() || state.isTranslating}
            className="text-xs"
          >
            {state.isTranslating ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Languages className="h-3 w-3 mr-1" />
            )}
            한→영
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleTranslate('zh')}
            disabled={!text.trim() || state.isTranslating}
            className="text-xs"
          >
            {state.isTranslating ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Languages className="h-3 w-3 mr-1" />
            )}
            한→중
          </Button>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-xs text-green-600 font-medium">
            {getTargetLangLabel(state.targetLang!)}로 번역됨
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRestore}
            className="text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            원문으로
          </Button>
        </div>
      )}
      
      <span className="text-xs text-gray-500 ml-auto">
        {translationService === 'google' ? '구글 번역' : 'Gemini AI'}
      </span>
    </div>
  );
}