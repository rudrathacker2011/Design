 'use client';

import { useApp } from '@/modules/profile/app-context';

export default function AdminPage() {
  const { supportRequests, feedbackEntries, demoReviews, yatraPoints } = useApp();
  const checks = [
    ['Demo state persistence', 'Ready', 'Browser local storage is active'],
    ['Provider integrations', 'Staged', 'No live maps, weather, transport or AI provider'],
    ['SOS dispatch', 'Simulated', 'Creates a local record only'],
    ['Production auth', 'Staged', 'Supabase/Auth integration remains pending'],
    ['Database persistence', 'Staged', 'Demo state is not written to PostgreSQL'],
  ];
  return <main className="ys-page"><p className="ys-eyebrow">Administration · demo monitor</p><h1>System readiness overview</h1><p>This is a transparent demo monitor for the current browser session. It helps explain what is functional locally and what remains a production integration task.</p><div className="ys-form-grid" style={{ marginTop: 24 }}>{checks.map(([label, status, detail]) => <div className="ys-intent-preview" key={label}><strong>{label} · {status}</strong><p>{detail}</p></div>)}</div><div className="ys-trip-start" style={{ marginTop: 24 }}><span>Current demo session counters</span><strong>{supportRequests.length} support requests · {feedbackEntries.length} feedback records · {demoReviews.length} reviews · {yatraPoints} points</strong><small>These counts are stored only in this browser and reset from the navigation panel.</small></div><p className="ys-form-footnote">Admin authorization, audit logs, secrets, rate limits and deployment monitoring must be implemented before production use.</p></main>;
}
