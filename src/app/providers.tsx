'use client';

import { type ReactNode, useEffect } from 'react';
import { SessionProvider } from '@/contexts/SessionContext';
import { I2VFormProvider } from '@/contexts/I2VFormContext';

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['s', 'u', 'p'].includes(e.key)) {
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <SessionProvider>
      <I2VFormProvider>
        {children}
      </I2VFormProvider>
    </SessionProvider>
  );
}
