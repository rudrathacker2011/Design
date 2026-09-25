'use client';

import { useEffect, useState } from 'react';
import { apiClient, type GovMonitorResponse } from '@/lib/api/client';
import { useAuth } from '@/modules/auth/AuthProvider';

export default function AdminPage() {
  const { session } = useAuth();
  const [monitor, setMonitor] = useState<GovMonitorResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session?.access_token) {
      setError('An authorized tourism administrator session is required.');
      return;
    }
    void apiClient.getGovMonitor(session.access_token)
      .then(setMonitor)
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Unable to load monitor data.'));
  }, [session?.access_token]);

  return <main className="ys-page">
    <p className="ys-eyebrow">Administration · live backend monitor</p>
    <h1>System readiness overview</h1>
    <p>Operational counts and provider configuration are read from the authenticated backend. Missing integrations are shown as unavailable rather than represented by demo fixtures.</p>
    {error && <p className="ys-form-footnote ys-form-error" role="alert">{error}</p>}
    {monitor && <>
      <div className="ys-form-grid" style={{ marginTop: 24 }}>
        {Object.entries(monitor.providerConfiguration).map(([name, configured]) => <div className="ys-intent-preview" key={name}><strong>{name} · {configured ? 'Configured' : 'Unavailable'}</strong><p>{configured ? 'Environment configuration is present.' : 'Provider credentials are not configured.'}</p></div>)}
      </div>
      <div className="ys-form-grid" style={{ marginTop: 24 }}>
        {Object.entries(monitor.counts).map(([name, value]) => <div className="ys-intent-preview" key={name}><strong>{value}</strong><p>{name.replace(/([A-Z])/g, ' $1')}</p></div>)}
      </div>
      <p className="ys-form-footnote">Updated {new Date(monitor.generatedAt).toLocaleString()}. Showing {monitor.observations.length} recent destination observations.</p>
      {monitor.observations.length > 0 && <div style={{ overflowX: 'auto', marginTop: 16 }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}><thead><tr><th style={{ textAlign: 'left', padding: 10 }}>Destination</th><th style={{ textAlign: 'left', padding: 10 }}>Signal</th><th style={{ textAlign: 'left', padding: 10 }}>Source</th><th style={{ textAlign: 'left', padding: 10 }}>Collected</th></tr></thead><tbody>{monitor.observations.map((observation) => <tr key={observation.id}><td style={{ padding: 10, borderTop: '1px solid #e7e3d9' }}>{observation.destinationName}</td><td style={{ padding: 10, borderTop: '1px solid #e7e3d9' }}>{observation.signalType}</td><td style={{ padding: 10, borderTop: '1px solid #e7e3d9' }}>{observation.source}</td><td style={{ padding: 10, borderTop: '1px solid #e7e3d9' }}>{new Date(observation.collectedAt).toLocaleString()}</td></tr>)}</tbody></table></div>}
    </>}
  </main>;
}
