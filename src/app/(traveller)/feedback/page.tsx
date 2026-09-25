'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useApp } from '@/modules/profile/app-context';

export default function FeedbackPage() {
  const { selectedDestination, tripPlan, feedbackEntries, recordFeedback, yatraPoints } = useApp();
  const existing = feedbackEntries.find((entry) => entry.destinationId === selectedDestination.id);
  const [outcome, setOutcome] = useState<'better' | 'as-expected' | 'worse' | 'not-travelled'>('as-expected');
  const [actualCrowd, setActualCrowd] = useState<'quiet' | 'moderate' | 'busy' | 'unknown'>('unknown');
  const [actualWeather, setActualWeather] = useState<'good' | 'mixed' | 'poor' | 'unknown'>('unknown');
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const didSave = recordFeedback({
      id: `demo-feedback-${Date.now()}`,
      destinationId: selectedDestination.id,
      destinationName: selectedDestination.name,
      outcome,
      actualCrowd,
      actualWeather,
      note: note.trim(),
      submittedAt: new Date().toISOString(),
    });
    setSaved(didSave);
  };

  return (
    <div className="ys-form-page">
      <p className="ys-eyebrow">Post-trip learning · demo</p>
      <h1>Tell YatraSetu what happened</h1>
      <p className="ys-form-intro">Your report is stored in this browser as a demo outcome. It helps show how recommendations can be compared with a traveller’s actual experience; it does not train a live model yet.</p>

      <div className="ys-trip-start">
        <span>Destination being reviewed</span>
        <strong>{selectedDestination.name}</strong>
        <small>{tripPlan ? `Trip draft v${tripPlan.version} · ${tripPlan.travelDates || 'dates not set'}` : 'Create a trip first if you want to compare against an itinerary.'}</small>
      </div>

      {existing && !saved ? (
        <div className="ys-intent-preview">
          <strong>Feedback already saved for this destination.</strong>
          <p>Recorded {new Date(existing.submittedAt).toLocaleString()} · {existing.outcome.replace('-', ' ')} · +150 Yatra Points.</p>
        </div>
      ) : (
        <form onSubmit={submit}>
          <div className="ys-form-grid">
            <label className="ys-field"><span>How did the trip compare?</span><select value={outcome} onChange={(e) => setOutcome(e.target.value as typeof outcome)}><option value="better">Better than expected</option><option value="as-expected">As expected</option><option value="worse">Worse than expected</option><option value="not-travelled">I did not travel</option></select></label>
            <label className="ys-field"><span>What was the crowd like?</span><select value={actualCrowd} onChange={(e) => setActualCrowd(e.target.value as typeof actualCrowd)}><option value="unknown">Unknown / did not observe</option><option value="quiet">Quiet</option><option value="moderate">Moderate</option><option value="busy">Busy</option></select></label>
            <label className="ys-field"><span>What was the weather like?</span><select value={actualWeather} onChange={(e) => setActualWeather(e.target.value as typeof actualWeather)}><option value="unknown">Unknown / did not observe</option><option value="good">Good</option><option value="mixed">Mixed</option><option value="poor">Poor</option></select></label>
          </div>
          <label className="ys-field ys-field-wide" style={{ marginTop: 18 }}><span>What should YatraSetu learn?</span><textarea rows={5} maxLength={600} value={note} onChange={(e) => setNote(e.target.value)} placeholder="For example: the route was calm, but the final walk was harder than expected." /></label>
          <div className="ys-form-actions"><span>One feedback record per demo destination · +150 Yatra Points</span><button className="ys-button" type="submit">Save demo outcome</button></div>
        </form>
      )}

      {saved && <div className="ys-intent-preview"><strong>Outcome saved locally.</strong><p>Thanks for closing the loop. Your demo balance is now {yatraPoints} Yatra Points.</p></div>}
      <p className="ys-form-footnote"><Link href="/trip">Back to trip plan</Link> · This is a local demo record. No real prediction model or external service has been updated.</p>
    </div>
  );
}
