'use client';

import { Component, type ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { createLogger } from '@/lib/logger';

const log = createLogger('ui');

interface ClientIconProps {
  icon: LucideIcon;
  className?: string;
  fallback?: React.ReactNode;
}

interface ClientIconBoundaryProps {
  children: ReactNode;
  className: string;
  fallback?: ReactNode;
}

class ClientIconBoundary extends Component<ClientIconBoundaryProps, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    log.warn('ClientIcon render error', { error: error instanceof Error ? error.message : String(error) });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <span className={`${this.props.className} inline-flex items-center justify-center`} style={{ minWidth: '1rem', minHeight: '1rem' }}>
        {this.props.fallback || ''}
      </span>
    );
  }
}

export function ClientIcon({ icon: Icon, className = "h-4 w-4", fallback }: ClientIconProps) {
  return (
    <ClientIconBoundary className={className} fallback={fallback}>
      <Icon className={className} />
    </ClientIconBoundary>
  );
}
