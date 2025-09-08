import React from 'react';
import { Card } from './card';
import { Button } from './button';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface SubmitMessage {
  type: 'success' | 'error';
  message: string;
  requestId?: string;
}

interface SubmitMessageCardProps {
  message: SubmitMessage;
  onDismiss?: () => void;
  onNewGeneration?: () => void;
}

export function SubmitMessageCard({ 
  message, 
  onDismiss, 
  onNewGeneration 
}: SubmitMessageCardProps) {
  const isError = message.type === 'error';
  
  return (
    <Card className={`p-6 text-center ${
      isError 
        ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20' 
        : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20'
    }`}>
      <div className="space-y-4">
        <div className="flex items-center justify-center">
          {isError ? (
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          ) : (
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className={`text-lg font-semibold ${
            isError 
              ? 'text-red-800 dark:text-red-200' 
              : 'text-green-800 dark:text-green-200'
          }`}>
            {isError ? '요청 실패' : '요청 성공'}
          </h3>
          <p className={`${
            isError 
              ? 'text-red-700 dark:text-red-300' 
              : 'text-green-700 dark:text-green-300'
          }`}>
            {message.message}
          </p>
          {message.requestId && (
            <p className="text-xs text-muted-foreground">
              요청 ID: {message.requestId}
            </p>
          )}
        </div>
        
        <div className="flex justify-center gap-2">
          {onDismiss && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onDismiss}
              className="flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              닫기
            </Button>
          )}
          {onNewGeneration && !isError && (
            <Button 
              size="sm" 
              onClick={onNewGeneration}
            >
              새 생성하기
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}