'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User } from '@/types';
import { restoreClientLogTransport } from '@/lib/logger';
import { apiClient } from '@/lib/api-client';

interface SessionContextValue {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  refreshSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue>({
  user: null,
  isLoading: true,
  isAdmin: false,
  refreshSession: async () => {},
});

export function useSession() {
  return useContext(SessionContext);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchSession = useCallback(async () => {
    try {
      const data = await apiClient.get<{ user: User | null }>('/api/auth/session');
      const sessionUser = data.user || null;
      setUser(sessionUser);

      if (sessionUser?.discordId) {
        const adminIds = process.env.NEXT_PUBLIC_ADMIN_DISCORD_IDS?.split(',').map(id => id.trim()) || [];
        setIsAdmin(adminIds.includes(sessionUser.discordId));
      } else {
        setIsAdmin(false);
      }
    } catch {
      setUser(null);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
    restoreClientLogTransport();
  }, [fetchSession]);

  return (
    <SessionContext.Provider value={{ user, isLoading, isAdmin, refreshSession: fetchSession }}>
      {children}
    </SessionContext.Provider>
  );
}
