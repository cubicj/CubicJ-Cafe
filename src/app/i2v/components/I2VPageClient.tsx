'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoRAPresetManager } from '@/components/ui/lora-preset-manager';
import { QueueMonitor } from '@/components/ui/queue-monitor';
import { Sparkles, Bot, CheckCircle, XCircle, Film } from 'lucide-react';
import { MODEL_REGISTRY } from '@/lib/comfyui/workflows/registry';
import type { VideoModel } from '@/lib/comfyui/workflows/types';
import { ServerStatusSection } from './sections/ServerStatusSection';
import { ImageUploadSection } from './sections/ImageUploadSection';
import { ContentSettingsSection } from './sections/ContentSettingsSection';
import { I2VControlsSection } from './sections/I2VControlsSection';
import { useI2VForm } from './hooks/useI2VForm';
import { useSession } from '@/contexts/SessionContext';

export default function I2VPageClient() {
  const { user, isLoading: isLoadingAuth } = useSession();
  const {
    selectedFile,
    setSelectedFile,
    endImageFile,
    setEndImageFile,
    isLoopEnabled,
    setIsLoopEnabled,
    prompt,
    setPrompt,
    selectedPresetIds,
    setSelectedPresetIds,
    setCurrentPresets,
    isGenerating,
    isNSFW,
    setIsNSFW,
    submitMessage,
    serverStatus,
    isRefreshing,
    isLoadingServerStatus,
    activeModel,
    setActiveModel,
    capabilities,
    isFormValid,
    handleSubmit,
    handleReset,
    handleRefreshStatus,
  } = useI2VForm();

  const handleSignIn = () => {
    const discordClientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/auth/callback/discord`;
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${discordClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify`;
    window.location.href = discordAuthUrl;
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center py-32">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-lg text-muted-foreground">로딩 중...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-32">
              <div className="space-y-6">
                <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">로그인이 필요합니다</h3>
                  <p className="text-sm text-muted-foreground">
                    AI 비디오 생성 기능을 사용하려면 Discord 계정으로
                    로그인해주세요.
                  </p>
                </div>
                <Button onClick={handleSignIn} size="lg" className="mt-4">
                  Discord로 로그인
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 overflow-x-hidden">
      <div className="container mx-auto px-4 sm:px-6 pt-8 pb-32">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          <div className="text-center space-y-4 py-4">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              AI 이미지-비디오 변환
            </h1>
          </div>

          <ServerStatusSection
            serverStatus={serverStatus}
            isRefreshing={isRefreshing}
            isLoadingServerStatus={isLoadingServerStatus}
            onRefreshStatus={handleRefreshStatus}
          />

          <QueueMonitor />

          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 w-full max-w-full overflow-hidden">
            <ImageUploadSection
              selectedFile={selectedFile}
              onFileSelect={setSelectedFile}
              endImageFile={endImageFile}
              onEndImageSelect={setEndImageFile}
              isLoopEnabled={isLoopEnabled}
              onLoopToggle={setIsLoopEnabled}
              prompt={prompt}
              onPromptChange={setPrompt}
              showEndImage={capabilities.endImage}
            />

            <div className="space-y-6 w-full max-w-full overflow-hidden">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Film className="h-4 w-4" />
                  모델 선택
                </h2>
                <Card className="p-4">
                  <div className="flex gap-2">
                    {(Object.keys(MODEL_REGISTRY) as VideoModel[]).map(
                      model => (
                        <button
                          key={model}
                          onClick={() => setActiveModel(model)}
                          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            activeModel === model
                              ? 'bg-violet-600 text-white shadow-md'
                              : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                          }`}
                        >
                          {MODEL_REGISTRY[model].displayName}
                        </button>
                      )
                    )}
                  </div>
                </Card>
              </div>

              {capabilities.loraPresets && (
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    LoRA 프리셋
                  </h2>
                  <LoRAPresetManager
                    selectedPresetIds={selectedPresetIds}
                    onPresetChange={setSelectedPresetIds}
                    onPresetApply={setCurrentPresets}
                    activeModel={activeModel}
                  />
                </div>
              )}

              <ContentSettingsSection
                isNSFW={isNSFW}
                onNSFWToggle={setIsNSFW}
              />

              <I2VControlsSection
                isFormValid={isFormValid}
                isGenerating={isGenerating}
                isNSFW={isNSFW}
                onSubmit={handleSubmit}
              />
            </div>
          </div>

          {isGenerating && (
            <Card className="p-8 text-center">
              <div className="space-y-6">
                <div className="animate-pulse">
                  <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-primary animate-bounce" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">
                    큐에 요청을 추가하고 있습니다
                  </h3>
                  <p className="text-muted-foreground">
                    잠시만 기다려주세요. 요청을 처리 중입니다...
                  </p>
                </div>
              </div>
            </Card>
          )}

          {submitMessage && !isGenerating && (
            <Card
              className={`p-6 text-center ${submitMessage.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}
            >
              <div className="space-y-4">
                <div
                  className={`flex items-center justify-center gap-2 ${submitMessage.type === 'error' ? 'text-red-600' : 'text-green-600'}`}
                >
                  {submitMessage.type === 'error' ? (
                    <XCircle className="h-6 w-6" />
                  ) : (
                    <CheckCircle className="h-6 w-6" />
                  )}
                  <h3 className="text-lg font-semibold">
                    {submitMessage.type === 'error' ? '요청 실패' : '요청 성공'}
                  </h3>
                </div>

                <p
                  className={`${submitMessage.type === 'error' ? 'text-red-700' : 'text-green-700'}`}
                >
                  {submitMessage.message}
                </p>

                {submitMessage.requestId && (
                  <p className="text-sm text-muted-foreground">
                    요청 ID: {submitMessage.requestId}
                  </p>
                )}

                <Button onClick={handleReset} variant="outline">
                  새 요청 작성
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
