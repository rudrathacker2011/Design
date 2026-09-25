'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useApp } from '@/modules/profile/app-context';
import { useAuth } from '@/modules/auth/AuthProvider';
import { apiClient } from '@/lib/api/client';

export default function FeedbackPage() {
  const { selectedDestination, tripPlan } = useApp();
  const { session } = useAuth();
  const [outcome, setOutcome] = useState<'better' | 'as-expected' | 'worse' | 'not-travelled'>('as-expected');
  const [actualCrowd, setActualCrowd] = useState<'quiet' | 'moderate' | 'busy' | 'unknown'>('unknown');
  const [actualWeather, setActualWeather] = useState<'good' | 'mixed' | 'poor' | 'unknown'>('unknown');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!session?.access_token) {
      setStatus('error');
      setError('Sign in to submit feedback.');
      return;
    }
    setStatus('saving');
    setError('');
    try {
      await apiClient.submitFeedback({
        tripId: tripPlan?.id.startsWith('demo-') ? undefined : tripPlan?.id,
        destinationId: selectedDestination.id,
        outcome,
        actualCrowd,
        actualWeather,
        note: note.trim(),
      }, session.access_token);
      setStatus('saved');
    } catch (caught) {
      setStatus('error');
      setError(caught instanceof Error ? caught.message : 'Unable to save feedback.');
    }
  };

  return (
    <div className="ys-form-page">
      <p className="ys-eyebrow">Post-trip learning</p>
      <h1>Tell YatraSetu what happened</h1>
      <p className="ys-form-intro">Your report is stored with your authenticated account and helps evaluate recommendation quality.</p>
      <div className="ys-trip-start"><span>Destination being reviewed</span><strong>{selectedDestination.name}</strong><small>{tripPlan ? `Trip itinerary v${tripPlan.version}` : 'Submit feedback after creating a trip.'}</small></div>
      {status === 'saved' ? <div className="ys-intent-preview"><strong>Outcome saved.</strong><p>Your feedback was recorded and your account received 150 Yatra Points.</p></div> : <form onSubmit={submit}>
        <div className="ys-form-grid">
          <label className="ys-field"><span>How did the trip compare?</span><select value={outcome} onChange={(e) => setOutcome(e.target.value as typeof outcome)}><option value="better">Better than expected</option><option value="as-expected">As expected</option><option value="worse">Worse than expected</option><option value="not-travelled">I did not travel</option></select></label>
          <label className="ys-field"><span>What was the crowd like?</span><select value={actualCrowd} onChange={(e) => setActualCrowd(e.target.value as typeof actualCrowd)}><option value="unknown">Unknown / did not observe</option><option value="quiet">Quiet</option><option value="moderate">Moderate</option><option value="busy">Busy</option></select></label>
          <label className="ys-field"><span>What was the weather like?</span><select value={actualWeather} onChange={(e) => setActualWeather(e.target.value as typeof actualWeather)}><option value="unknown">Unknown / did not observe</option><option value="good">Good</option><option value="mixed">Mixed</option><option value="poor">Poor</option></select></label>
        </div>
        <label className="ys-field ys-field-wide" style={{ marginTop: 18 }}><span>What should YatraSetu learn?</span><textarea rows={5} maxLength={600} value={note} onChange={(e) => setNote(e.target.value)} /></label>
        {error && <p className="ys-form-footnote ys-form-error" role="alert">{error}</p>}
        <div className="ys-form-actions"><span>Feedback is attached to your account.</span><button className="ys-button" type="submit" disabled={status === 'saving'}>{status === 'saving' ? 'Saving…' : 'Save outcome'}</button></div>
      </form>}
      <p className="ys-form-footnote"><Link href="/trip">Back to trip plan</Link></p>
    </div>
  );
}
