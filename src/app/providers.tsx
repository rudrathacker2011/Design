'use client';

import type { ReactNode } from 'react';
import { AppProvider } from '@/modules/profile/app-context';
import { AuthProvider } from '@/modules/auth/AuthProvider';

export function Providers({ children }: { children: ReactNode }) {
  return <AuthProvider><AppProvider>{children}</AppProvider></AuthProvider>;
}
