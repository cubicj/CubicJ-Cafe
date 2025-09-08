import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Save } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface SystemSettings {
  [category: string]: {
    [key: string]: {
      value: string;
      type: string;
    };
  };
}

interface SystemSettingsTabProps {
  systemSettings: SystemSettings;
  setSystemSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
  settingsLoading: boolean;
  updateSystemSetting: (key: string, value: string, type?: string, category?: string) => Promise<void>;
}

export default function SystemSettingsTab({ 
  systemSettings, 
  setSystemSettings, 
  settingsLoading, 
  updateSystemSetting 
}: SystemSettingsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">고급 시스템 설정</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {settingsLoading ? (
          <div className="text-center py-4">설정 로딩 중...</div>
        ) : (
          Object.entries(systemSettings)
            .filter(([category]) => category !== 'models' && category !== 'generation')
            .map(([category, settings]) => (
            <div key={category} className="space-y-4">
              <h3 className="text-lg font-semibold capitalize">
                {category === 'video' ? '영상 설정' : 
                 category === 'video_generation' ? '비디오 생성 설정' : category}
              </h3>
              <div className="grid gap-4">
                {Object.entries(settings).filter(([key]) => key !== 'cfg_scale').map(([key, setting]) => (
                  <div key={key} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-mono text-sm">
                        {key === 'video_resolution' ? '영상 해상도' : 
                         key === 'negative_prompt' ? '네거티브 프롬프트' :
                         key === 'quality_prompt' ? '퀄리티 프롬프트' : key}
                      </Label>
                      <Button
                        size="sm"
                        onClick={() => updateSystemSetting(key, setting.value, setting.type, category)}
                        className="h-8 px-3"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        저장
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {(key === 'negative_prompt' || key === 'quality_prompt') ? (
                        <Textarea
                          value={setting.value}
                          onChange={(e) => {
                            setSystemSettings(prev => ({
                              ...prev,
                              [category]: {
                                ...prev[category],
                                [key]: {
                                  ...setting,
                                  value: e.target.value
                                }
                              }
                            }));
                          }}
                          className="font-mono text-sm min-h-[120px]"
                          placeholder={key === 'negative_prompt' ? '네거티브 프롬프트 입력' : '퀄리티 프롬프트 입력'}
                        />
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Input
                            value={setting.value}
                            onChange={(e) => {
                              setSystemSettings(prev => ({
                                ...prev,
                                [category]: {
                                  ...prev[category],
                                  [key]: {
                                    ...setting,
                                    value: e.target.value
                                  }
                                }
                              }));
                            }}
                            type={setting.type === 'number' ? 'number' : 'text'}
                            className="font-mono text-sm"
                            placeholder={setting.type === 'number' ? '숫자 입력' : '값 입력'}
                            min={setting.type === 'number' ? 256 : undefined}
                            max={setting.type === 'number' ? 1024 : undefined}
                            step={setting.type === 'number' ? 8 : undefined}
                          />
                          <Badge variant="outline" className="text-xs">
                            {setting.type}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
        
        {!settingsLoading && Object.keys(systemSettings).length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>등록된 시스템 설정이 없습니다.</p>
            <p className="text-sm mt-1">기본 설정이 자동으로 초기화됩니다.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}