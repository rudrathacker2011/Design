import type { ReactNode } from 'react';
import { Providers } from '../providers';
import { AppShell } from '../../components/layout/AppShell';

export default function SupportLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <AppShell>{children}</AppShell>
    </Providers>
  );
}
