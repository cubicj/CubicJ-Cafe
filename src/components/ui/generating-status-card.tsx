import React from 'react';
import { Card } from './card';
import { Sparkles } from 'lucide-react';

export function GeneratingStatusCard() {
  return (
    <Card className="p-8 text-center">
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary animate-bounce" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">큐에 요청을 추가하고 있습니다</h3>
          <p className="text-muted-foreground">
            잠시만 기다려주세요. 요청을 처리 중입니다...
          </p>
        </div>
      </div>
    </Card>
  );
}