'use client';

import type { ReactNode } from 'react';
import { SessionProvider } from '@/contexts/SessionContext';
import { I2VFormProvider } from '@/contexts/I2VFormContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <I2VFormProvider>
        {children}
      </I2VFormProvider>
    </SessionProvider>
  );
}
