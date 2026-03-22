'use client';

import { LucideIcon } from 'lucide-react';
import { createLogger } from '@/lib/logger';

const log = createLogger('ui');

interface ClientIconProps {
  icon: LucideIcon;
  className?: string;
  fallback?: React.ReactNode;
}

export function ClientIcon({ icon: Icon, className = "h-4 w-4", fallback }: ClientIconProps) {
  try {
    return <Icon className={className} />;
  } catch (error) {
    log.warn('ClientIcon render error', { error: error instanceof Error ? error.message : String(error) });
    return (
      <span className={`${className} inline-flex items-center justify-center`} style={{ minWidth: '1rem', minHeight: '1rem' }}>
        {fallback || ''}
      </span>
    );
  }
}