'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useApp } from '@/modules/profile/app-context';
import { runtimeConfig } from '@/lib/config/runtime';

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
  const { resetDemo } = useApp();
  const handleReset = () => {
    if (window.confirm('Reset the saved YatraSetu demo journey in this browser?')) resetDemo();
  };

  return (
    <div className="ys-shell">
      <aside className="ys-sidebar">
        <Link className="ys-brand" href="/dashboard">
          <span className="ys-brand-mark" aria-hidden="true">Y</span>
          <span className="ys-brand-name">YatraSetu</span>
        </Link>
        <nav className="ys-nav" aria-label="Main navigation">
          {links.map(({ href, label, section }) => (
            <div key={href} className="ys-nav-entry">
              {section && <p className="ys-nav-label">{section}</p>}
              <Link href={href} aria-current={pathname === href ? 'page' : undefined}>{label}</Link>
            </div>
          ))}
        </nav>
        <div className={`ys-sidebar-note ys-mode-note ys-mode-${runtimeConfig.mode}`}>
          <strong>{runtimeConfig.mode === 'demo' ? 'Demo mode · illustrative data' : 'Production workspace'}</strong>
          {runtimeConfig.mode === 'demo'
            ? 'No live conditions, bookings, or emergency dispatch are represented.'
            : 'Live data and actions are subject to provider availability and your permissions.'}
          {runtimeConfig.mode === 'demo' && (
            <button className="ys-reset-demo" type="button" onClick={handleReset}>Reset demo journey</button>
          )}
        </div>
      </aside>
      <main className="ys-main">
        <div className="ys-topbar">
          <span>Travel planning</span>
          <span className={`ys-mode-badge ys-mode-badge-${runtimeConfig.mode}`}>
            {runtimeConfig.mode === 'demo' ? 'Demo workspace · data is illustrative, not live' : 'Production workspace'}
          </span>
        </div>
        <div className="ys-stage">{children}</div>
      </main>
    </div>
  );
}
