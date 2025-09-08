import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ModelSettings {
  highDiffusionModel: string;
  lowDiffusionModel: string;
  textEncoder: string;
  vae: string;
  upscaleModel: string;
  clipVision: string;
  ksampler: string;
  highCfg: number;
  lowCfg: number;
  highShift: number;
  lowShift: number;
}

interface ModelList {
  diffusionModels: string[];
  textEncoders: string[];
  vaes: string[];
  upscaleModels: string[];
  clipVisions: string[];
  samplers: string[];
}

interface ModelSettingsTabProps {
  modelSettings: ModelSettings;
  setModelSettings: React.Dispatch<React.SetStateAction<ModelSettings>>;
  availableModels: ModelList;
  modelsLoading: boolean;
  updateModelSettings: () => Promise<void>;
}

export default function ModelSettingsTab({
  modelSettings,
  setModelSettings,
  availableModels,
  modelsLoading,
  updateModelSettings
}: ModelSettingsTabProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AI 모델 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {modelsLoading ? (
            <div className="text-center py-8 space-y-2">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-muted-foreground">ComfyUI 모델 목록을 불러오는 중...</p>
              <p className="text-xs text-muted-foreground">최초 로드 시 2-3초 소요될 수 있습니다</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">High Diffusion Model</Label>
                  <Select
                    value={modelSettings.highDiffusionModel}
                    onValueChange={(value) => setModelSettings(prev => ({
                      ...prev,
                      highDiffusionModel: value
                    }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="High diffusion 모델 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.diffusionModels.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Low Diffusion Model</Label>
                  <Select
                    value={modelSettings.lowDiffusionModel}
                    onValueChange={(value) => setModelSettings(prev => ({
                      ...prev,
                      lowDiffusionModel: value
                    }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Low diffusion 모델 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.diffusionModels.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Text Encoder</Label>
                  <Select
                    value={modelSettings.textEncoder}
                    onValueChange={(value) => setModelSettings(prev => ({
                      ...prev,
                      textEncoder: value
                    }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Text encoder 모델 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.textEncoders.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">VAE</Label>
                  <Select
                    value={modelSettings.vae}
                    onValueChange={(value) => setModelSettings(prev => ({
                      ...prev,
                      vae: value
                    }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="VAE 모델 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.vaes.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Upscale Model</Label>
                  <Select
                    value={modelSettings.upscaleModel}
                    onValueChange={(value) => setModelSettings(prev => ({
                      ...prev,
                      upscaleModel: value
                    }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Upscale 모델 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.upscaleModels.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">CLIP Vision</Label>
                  <Select
                    value={modelSettings.clipVision}
                    onValueChange={(value) => setModelSettings(prev => ({
                      ...prev,
                      clipVision: value
                    }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="CLIP Vision 모델 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.clipVisions.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={updateModelSettings}
                  className="px-6"
                >
                  <Save className="w-4 h-4 mr-2" />
                  모델 설정 저장
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">KSampler 설정</CardTitle>
        </CardHeader>
        <CardContent>
          {modelsLoading ? (
            <div className="text-center py-8 space-y-2">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-muted-foreground">샘플러 목록을 불러오는 중...</p>
              <p className="text-xs text-muted-foreground">ComfyUI 서버와 통신 중입니다</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">KSampler (4개 모두 동일 적용)</Label>
                  <Select
                    value={modelSettings.ksampler}
                    onValueChange={(value) => setModelSettings(prev => ({
                      ...prev,
                      ksampler: value
                    }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="KSampler 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.samplers.map((sampler) => (
                        <SelectItem key={sampler} value={sampler}>
                          {sampler}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button 
                  onClick={updateModelSettings}
                  className="px-6"
                >
                  <Save className="w-4 h-4 mr-2" />
                  샘플러 설정 저장
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">CFG 스케일 설정</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">High CFG (High 모델 - 노드 295)</Label>
                <Input
                  type="number"
                  min="0.1"
                  max="30"
                  step="0.1"
                  value={modelSettings.highCfg}
                  onChange={(e) => setModelSettings(prev => ({
                    ...prev,
                    highCfg: parseFloat(e.target.value) || 3.0
                  }))}
                  className="w-full"
                  placeholder="High CFG 값 (예: 3.0)"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Low CFG (Low 모델 - 노드 302)</Label>
                <Input
                  type="number"
                  min="0.1"
                  max="30"
                  step="0.1"
                  value={modelSettings.lowCfg}
                  onChange={(e) => setModelSettings(prev => ({
                    ...prev,
                    lowCfg: parseFloat(e.target.value) || 3.0
                  }))}
                  className="w-full"
                  placeholder="Low CFG 값 (예: 3.0)"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                onClick={updateModelSettings}
                className="px-6"
              >
                <Save className="w-4 h-4 mr-2" />
                CFG 설정 저장
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ModelSamplingSD3 Shift 설정</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">High Shift (High 모델용)</Label>
                <Input
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={modelSettings.highShift}
                  onChange={(e) => setModelSettings(prev => ({
                    ...prev,
                    highShift: parseFloat(e.target.value) || 5.0
                  }))}
                  className="w-full"
                  placeholder="High Shift 값 (예: 5.0)"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Low Shift (Low 모델용)</Label>
                <Input
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={modelSettings.lowShift}
                  onChange={(e) => setModelSettings(prev => ({
                    ...prev,
                    lowShift: parseFloat(e.target.value) || 5.0
                  }))}
                  className="w-full"
                  placeholder="Low Shift 값 (예: 5.0)"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                onClick={updateModelSettings}
                className="px-6"
              >
                <Save className="w-4 h-4 mr-2" />
                Shift 설정 저장
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}