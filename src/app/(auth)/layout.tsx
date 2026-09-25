import type { ReactNode } from 'react';
import { AuthProvider } from '@/modules/auth/AuthProvider';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
