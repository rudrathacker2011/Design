'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useAuth } from '@/modules/auth/AuthProvider';

const links = [
  { href: '/dashboard', label: 'Overview', section: 'Your journey' },
  { href: '/profile', label: 'Traveller profile' },
  { href: '/intent', label: 'Travel intent' },
  { href: '/discover', label: 'Discover & decide' },
  { href: '/trip', label: 'Trip plan', section: 'On the way' },
  { href: '/mobility', label: 'Mobility & arrival' },
  { href: '/support', label: 'Safety & support' },
  { href: '/trust', label: 'Trusted providers', section: 'More' },
  { href: '/feedback', label: 'Trip feedback' },
  { href: '/operator', label: 'Operator tools' },
  { href: '/operator/insights', label: 'Tourism insights' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { signOut, user } = useAuth();

  return (
    <div className="ys-shell">
      <header className="ys-app-header">
        <Link className="ys-brand" href="/dashboard"><span className="ys-brand-mark" aria-hidden="true">Y</span><span className="ys-brand-name">YatraSetu</span></Link>
        <nav className="ys-nav" aria-label="Main navigation">
          {links.slice(0, 7).map(({ href, label }) => <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined}>{label}</Link>)}
        </nav>
        <div className="ys-app-actions">
          <span className="ys-user-label">{user?.email ?? 'Traveller'}</span>
          {user && <button className="ys-header-button" type="button" onClick={() => void signOut()}>Sign out</button>}
        </div>
      </header>
      <main className="ys-main">
        <div className="ys-topbar"><span>Travel planning</span><span>Provider availability and permissions apply</span></div>
        <div className="ys-stage">{children}</div>
      </main>
    </div>
  );
}
