'use client';

import { LucideIcon } from 'lucide-react';

interface ClientIconProps {
  icon: LucideIcon;
  className?: string;
  fallback?: React.ReactNode;
}

export function ClientIcon({ icon: Icon, className = "h-4 w-4", fallback }: ClientIconProps) {
  // 클라이언트 전용 컴포넌트에서는 바로 아이콘 렌더링
  // 이미 'use client'이므로 hydration 체크 불필요
  
  try {
    return <Icon className={className} />;
  } catch (error) {
    console.warn('ClientIcon 렌더링 에러:', error);
    return (
      <span className={`${className} inline-flex items-center justify-center`} style={{ minWidth: '1rem', minHeight: '1rem' }}>
        {fallback || ''}
      </span>
    );
  }
}