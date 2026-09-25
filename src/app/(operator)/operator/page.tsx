'use client';

import { useEffect, useState } from 'react';
import { apiClient, type OperatorRequest } from '@/lib/api/client';
import { useAuth } from '@/modules/auth/AuthProvider';

const assistanceStatuses = ['INITIATED', 'DISPATCHED', 'EN_ROUTE', 'RESOLVED', 'CANCELLED'] as const;
const serviceStatuses = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;

export default function OperatorPage() {
  const { session } = useAuth();
  const [requests, setRequests] = useState<OperatorRequest[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!session?.access_token) {
      setError('An authorized operator session is required.');
      setLoading(false);
      return;
    }
    try {
      setRequests(await apiClient.getOperatorRequests(session.access_token));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load operator requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [session?.access_token]);

  const update = async (request: OperatorRequest, status: OperatorRequest['status']) => {
    if (!session?.access_token) return;
    try {
      const result = await apiClient.updateOperatorRequest(request.id, status, session.access_token);
      setRequests((current) => current.map((item) => item.id === request.id ? { ...item, status: result.status } : item));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update request.');
    }
  };

  return <main className="ys-page">
    <p className="ys-eyebrow">Operations · provider response</p>
    <h1>Assistance request queue</h1>
    <p>Review authenticated assistance and service requests. Status changes are persisted and restricted to authorized operator or administration roles.</p>
    {loading && <p className="ys-form-footnote">Loading requests…</p>}
    {error && <p className="ys-form-footnote ys-form-error" role="alert">{error}</p>}
    {!loading && !requests.length && <div className="ys-intent-preview"><strong>No requests found.</strong><p>New assistance events will appear here after they are created for an authenticated trip.</p></div>}
    {!!requests.length && <div style={{ overflowX: 'auto', marginTop: 24 }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}><thead><tr><th style={{ textAlign: 'left', padding: 10 }}>Reference</th><th style={{ textAlign: 'left', padding: 10 }}>Type</th><th style={{ textAlign: 'left', padding: 10 }}>Destination</th><th style={{ textAlign: 'left', padding: 10 }}>Detail</th><th style={{ textAlign: 'left', padding: 10 }}>Status</th></tr></thead><tbody>{requests.map((request) => { const options = request.source === 'assistance' ? assistanceStatuses : serviceStatuses; return <tr key={`${request.source}-${request.id}`}><td style={{ padding: 10, borderTop: '1px solid #e7e3d9' }}><strong>{request.reference}</strong><br /><small>{new Date(request.createdAt).toLocaleString()}</small></td><td style={{ padding: 10, borderTop: '1px solid #e7e3d9' }}>{request.kind}</td><td style={{ padding: 10, borderTop: '1px solid #e7e3d9' }}>{request.destination ?? 'Provider service'}</td><td style={{ padding: 10, borderTop: '1px solid #e7e3d9' }}>{request.detail}</td><td style={{ padding: 10, borderTop: '1px solid #e7e3d9' }}><select value={request.status} onChange={(event) => void update(request, event.target.value)}>{options.map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}</select></td></tr>; })}</tbody></table></div>}
  </main>;
}
