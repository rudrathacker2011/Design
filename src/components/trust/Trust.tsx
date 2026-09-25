'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, Star, Lock } from 'lucide-react';
import { useApp } from '@/modules/profile/app-context';
import { useAuth } from '@/modules/auth/AuthProvider';
import { apiClient, type VerifiedProvider } from '@/lib/api/client';
import './Trust.css';

export default function Trust() {
  const { selectedDestination } = useApp();
  const { session } = useAuth();
  const [providers, setProviders] = useState<VerifiedProvider[]>([]);
  const [active, setActive] = useState<VerifiedProvider | null>(null);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [proof, setProof] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'saved' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    setStatus('loading');
    void apiClient.getVerifiedProviders(undefined, selectedDestination.id).then((items) => {
      if (!mounted) return;
      setProviders(items);
      setActive(items[0] ?? null);
      setStatus('idle');
    }).catch((error: unknown) => {
      if (!mounted) return;
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unable to load verified providers.');
    });
    return () => { mounted = false; };
  }, [selectedDestination.id]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!session?.access_token || !active) {
      setStatus('error');
      setMessage('Sign in and select a verified provider before submitting a review.');
      return;
    }
    setStatus('saving');
    setMessage('');
    try {
      const result = await apiClient.submitVerifiedReview({
        providerId: active.id,
        destinationId: selectedDestination.id,
        rating,
        title: title.trim(),
        body: body.trim(),
        checkInProofCode: proof.trim(),
      }, session.access_token);
      setStatus('saved');
      setMessage(`Review verified and recorded. ${result.pointsAwarded} Yatra Points awarded.`);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unable to submit review.');
    }
  };

  return (
    <main className="trust-page ys-page">
      <header className="trust-header">
        <div>
          <div className="badge-row"><span className="pill-badge pill-green"><ShieldCheck size={14} /> Verified provider directory</span></div>
          <h1>Trusted stays and services</h1>
          <p className="subtitle">Review providers only after an authenticated trip has been recorded. Verification status and review audit records come from the server.</p>
        </div>
      </header>
      {status === 'loading' && <p className="ys-form-footnote">Loading verified providers…</p>}
      {status === 'error' && <p className="ys-form-footnote ys-form-error" role="alert">{message}</p>}
      {!providers.length && status !== 'loading' && <div className="ys-intent-preview"><strong>No verified providers are available for this destination.</strong><p>Provider onboarding must be completed by an authorized operator or tourism administrator.</p></div>}
      <div className="trust-layout-grid">
        <div className="stays-column">
          <div className="stays-list">{providers.map((provider) => <button type="button" key={provider.id} className={`stay-card glass-panel ${active?.id === provider.id ? 'active-stay-card' : ''}`} onClick={() => setActive(provider)}>
            <div className="stay-top"><div><span className="stay-type">{provider.category}</span><h4>{provider.name}</h4></div><ShieldCheck size={18} className="text-green" /></div>
            <div className="verification-pills"><span className="badge-gov-ver"><ShieldCheck size={12} /> {provider.verificationStatus}</span></div>
            {provider.reviews?.length ? <div className="audit-hash-row"><Star size={12} /> {provider.reviews.length} recent verified review(s)</div> : <div className="audit-hash-row">No reviews yet</div>}
          </button>)}</div>
          {active?.reviews?.map((review) => <article className="reviews-card glass-panel" key={review.id}><div className="rev-head"><h4><Star size={14} /> {review.rating}/5</h4><span>{new Date(review.createdAt).toLocaleDateString()}</span></div><p className="rev-comment">{review.comment}</p></article>)}
        </div>
        <div className="review-form-column"><div className="review-form-card glass-panel">
          <div className="form-card-head"><div><span className="sub-label">AUTHENTICATED REVIEW</span><h3>Submit a verified review</h3></div><Lock size={20} className="text-green" /></div>
          <p className="form-desc">A completed or active trip is required. Your review is linked to your account and recorded with an audit hash.</p>
          <form onSubmit={submit} className="review-form">
            <label className="form-group"><span>Check-in proof code</span><input value={proof} onChange={(e) => setProof(e.target.value)} required /></label>
            <label className="form-group"><span>Review title</span><input value={title} onChange={(e) => setTitle(e.target.value)} minLength={3} maxLength={100} required /></label>
            <label className="form-group"><span>Rating</span><input type="number" min={1} max={5} value={rating} onChange={(e) => setRating(Number(e.target.value))} required /></label>
            <label className="form-group"><span>Experience</span><textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} minLength={10} maxLength={1000} required /></label>
            {message && <p className={status === 'error' ? 'ys-form-error' : ''} role={status === 'error' ? 'alert' : 'status'}>{message}</p>}
            <button type="submit" className="btn-submit-review" disabled={status === 'saving' || !active}><ShieldCheck size={16} /><span>{status === 'saving' ? 'Submitting…' : 'Submit verified review'}</span></button>
          </form>
        </div></div>
      </div>
    </main>
  );
}
