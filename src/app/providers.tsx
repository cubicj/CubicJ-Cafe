'use client';

import type { ReactNode } from 'react';
import { SessionProvider } from '@/contexts/SessionContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
