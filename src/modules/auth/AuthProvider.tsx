'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getBrowserSupabase } from '@/lib/auth/browser';
import { isProductionMode } from '@/lib/config/runtime';

type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = getBrowserSupabase();
  const [loading, setLoading] = useState(Boolean(client));
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!client) return;
    let active = true;
    void client.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [client]);

  const value = useMemo<AuthContextValue>(() => ({
    configured: Boolean(client),
    loading,
    session,
    user: session?.user ?? null,
    signOut: async () => {
      if (client) {
        const { error } = await client.auth.signOut();
        if (error) throw error;
      }
      window.localStorage.removeItem('yatrasetu-demo-session');
    },
  }), [client, loading, session]);

  useEffect(() => {
    if (isProductionMode() && !value.loading && (!value.configured || !value.session) && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
      window.location.assign('/login?reason=session-required');
    }
  }, [value.configured, value.loading, value.session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
