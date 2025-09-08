"use client";

import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ShieldAlert, Eye, EyeOff } from "lucide-react";

interface ContentSettingsSectionProps {
  isNSFW: boolean;
  onNSFWToggle: (isNSFW: boolean) => void;
}

export function ContentSettingsSection({
  isNSFW,
  onNSFWToggle,
}: ContentSettingsSectionProps) {
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
                {isNSFW ? "NSFW" : "SFW"} 콘텐츠
              </Label>
              <p className="text-xs text-muted-foreground">
                {isNSFW ? "성인용 채널로 전송됩니다" : "일반 채널로 전송됩니다"}
              </p>
            </div>
          </div>
          <Switch
            id="nsfw-toggle"
            checked={isNSFW}
            onCheckedChange={onNSFWToggle}
          />
        </div>
      </Card>
    </div>
  );
}