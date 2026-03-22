'use client';

import type { ReactNode } from 'react';
import { SessionProvider } from '@/contexts/SessionContext';
import { GenerateFormProvider } from '@/contexts/GenerateFormContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <GenerateFormProvider>
        {children}
      </GenerateFormProvider>
    </SessionProvider>
  );
}
