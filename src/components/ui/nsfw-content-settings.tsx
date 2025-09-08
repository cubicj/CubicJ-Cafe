import React from 'react';
import { Card } from './card';
import { Label } from './label';
import { Switch } from './switch';
import { Eye, EyeOff, ShieldAlert } from 'lucide-react';

interface NSFWContentSettingsProps {
  isNSFW: boolean;
  onToggle: (checked: boolean) => void;
}

export function NSFWContentSettings({ isNSFW, onToggle }: NSFWContentSettingsProps) {
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <ShieldAlert className="h-4 w-4" />
        콘텐츠 설정
      </h2>
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isNSFW ? (
              <EyeOff className="h-5 w-5 text-red-500" />
            ) : (
              <Eye className="h-5 w-5 text-green-500" />
            )}
            <div>
              <Label htmlFor="nsfw-toggle" className="text-sm font-medium">
                NSFW 콘텐츠
              </Label>
              <p className="text-xs text-muted-foreground">
                {isNSFW ? "성인용 채널로 전송됩니다" : "일반 채널로 전송됩니다"}
              </p>
            </div>
          </div>
          <Switch
            id="nsfw-toggle"
            checked={isNSFW}
            onCheckedChange={onToggle}
          />
        </div>
      </Card>
    </div>
  );
}