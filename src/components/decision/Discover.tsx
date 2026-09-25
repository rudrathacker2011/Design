'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Clock3, CloudSun, Compass, MapPin, RefreshCw, ShieldCheck } from 'lucide-react';
import { useApp } from '@/modules/profile/app-context';
import { SEED_DESTINATIONS } from '@/modules/destination/seed';
import { rankDemoAlternatives } from '@/modules/decision/decision.service';
import './Discover.css';

function formatTimestamp(value: string | null) {
  if (!value) return 'Time unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Time unavailable' : date.toLocaleString();
}

export default function Discover() {
  const [now, setNow] = useState(0);
  const {
    profile,
    setProfile,
    selectedDestination,
    setSelectedDestinationId,
    evaluation,
    assessedDestination,
    evaluationStatus,
    evaluationError,
    evaluateSelectedDestination,
  } = useApp();

  const weather = evaluation?.weather;
  const alternatives = rankDemoAlternatives(profile, selectedDestination);
  useEffect(() => {
    const initialTimer = window.setTimeout(() => setNow(Date.now()), 0);
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, []);
  const weatherFreshness = (() => {
    if (!weather?.collectedAt || !weather.expiresAt) return 'UNKNOWN';
    return Date.parse(weather.expiresAt) > now ? weather.freshness : 'STALE';
  })();

  return (
    <main className="assessment-page">
      <header className="assessment-heading">
        <p className="assessment-eyebrow"><Compass size={15} /> DESTINATION REALITY</p>
        <h1>Check a destination for your trip</h1>
        <p>Assess a place you already have in mind. We show where information comes from and call out what we cannot verify.</p>
      </header>

      <section className="assessment-form ys-panel" aria-labelledby="assessment-form-title">
        <div className="assessment-section-heading">
          <div>
            <p className="assessment-step">YOUR CHECK</p>
            <h2 id="assessment-form-title">Choose a destination</h2>
          </div>
          <span className="assessment-catalogue-note">Destination choices are curated demo entries</span>
        </div>

        <div className="assessment-controls">
          <label className="assessment-field">
            <span>Destination</span>
            <select value={selectedDestination.id} onChange={(event) => setSelectedDestinationId(event.target.value)}>
              {SEED_DESTINATIONS.map((destination) => (
                <option key={destination.id} value={destination.id}>{destination.name} · {destination.region}</option>
              ))}
            </select>
          </label>

          <label className="assessment-field">
            <span>Crowd preference</span>
            <select
              value={profile.crowdPreference}
              onChange={(event) => setProfile({ ...profile, crowdPreference: event.target.value as typeof profile.crowdPreference })}
            >
              <option value="quiet">Prefer quieter places</option>
              <option value="balanced">Some activity is fine</option>
              <option value="lively">Lively places are fine</option>
            </select>
          </label>
        </div>

        <label className="assessment-accessibility">
          <input
            type="checkbox"
            checked={profile.accessibilityNeeded}
            onChange={(event) => setProfile({ ...profile, accessibilityNeeded: event.target.checked })}
          />
          <span>I need accessibility information before deciding</span>
        </label>

        <div className="assessment-form-footer">
          <p>Demo mode uses a fixed destination catalogue and local rules. No weather, crowd, opening, price, access or transport signal is live.</p>
          <button className="ys-button" type="button" onClick={() => void evaluateSelectedDestination()} disabled={evaluationStatus === 'loading'}>
            {evaluationStatus === 'loading' ? <RefreshCw size={16} className="assessment-spin" /> : <CloudSun size={17} />}
            {evaluationStatus === 'loading' ? 'Checking conditions…' : evaluation ? 'Check again' : 'Assess destination'}
          </button>
        </div>
      </section>

      {evaluationStatus === 'loading' && (
        <section className="assessment-state ys-panel" role="status" aria-live="polite">
          <span className="assessment-loader" />
          <div><strong>Applying the demo decision rules</strong><p>Matching your travel intent and preferences to the curated destination scenarios.</p></div>
        </section>
      )}

      {evaluationStatus === 'error' && (
        <section className="assessment-state assessment-error ys-panel" role="alert">
          <AlertCircle size={20} />
          <div><strong>We couldn’t complete this check</strong><p>{evaluationError}</p><p>No demo result has been substituted.</p></div>
          <button className="assessment-retry" type="button" onClick={() => void evaluateSelectedDestination()}>Retry</button>
        </section>
      )}

      {evaluation && evaluationStatus === 'success' && (
        <section className="assessment-result" aria-live="polite">
          <div className="assessment-result-top">
            <div className="assessment-result-title">
              <p className="assessment-eyebrow"><MapPin size={15} /> {evaluation && assessedDestination && evaluation.ruleVersion.startsWith('demo-') ? 'DEMO SCENARIO · ' : 'ASSESSMENT RESULT · '}{evaluation.ruleVersion}</p>
              <h2>{assessedDestination?.name ?? selectedDestination.name}</h2>
              <p>{assessedDestination?.region ?? selectedDestination.region} · {assessedDestination?.category ?? selectedDestination.category}</p>
            </div>
            <span className={`assessment-decision ${weatherFreshness === 'STALE' ? 'decision-stale' : `decision-${evaluation.decision.toLowerCase()}`}`}>
              {weatherFreshness === 'STALE' ? 'STALE · RECHECK' : evaluation.decision}
            </span>
          </div>

          <div className="assessment-metrics">
            <article>
              <span>{evaluation.ruleVersion.startsWith('demo-') ? 'Current suitability' : 'Weather-based suitability'}</span>
              <strong>{evaluation.suitabilityScore === null || weatherFreshness !== 'FRESH' ? 'Unknown' : `${evaluation.suitabilityScore}%`}</strong>
              <small>{evaluation.ruleVersion.startsWith('demo-') ? 'Not scored from current evidence in demo mode.' : 'This is a partial score; other material signals are unavailable.'}</small>
            </article>
            <article>
              <span>Evidence confidence</span>
              <strong>{Math.round(evaluation.confidence * 100)}%</strong>
              <small>{evaluation.ruleVersion.startsWith('demo-') ? 'Low by design: the inputs are illustrative fixtures.' : 'Confidence is separate from suitability and reflects limited coverage.'}</small>
            </article>
            <article>
              <span>Next step</span>
              <strong className="assessment-next-step">{evaluation.recommendedAction}</strong>
            </article>
          </div>

          <section className="assessment-evidence ys-panel" aria-labelledby="assessment-evidence-title">
            <div className="assessment-section-heading">
              <div><p className="assessment-step">EVIDENCE</p><h3 id="assessment-evidence-title">What we know right now</h3></div>
              <span className={`assessment-freshness freshness-${weatherFreshness.toLowerCase()}`}><Clock3 size={14} /> {weatherFreshness}</span>
            </div>

            <div className="assessment-weather">
              <div className="assessment-weather-icon"><CloudSun size={23} /></div>
              <div className="assessment-weather-main">
                <strong>{weather?.temperature === null || weather?.temperature === undefined ? 'Weather unavailable' : `${weather.temperature}°C · ${weather.weatherCondition}`}</strong>
                <span>Source: {weather?.source ?? 'Unknown'} · Collected: {formatTimestamp(weather?.collectedAt ?? null)}</span>
              </div>
              {weather?.precipitationProbability !== null && weather?.precipitationProbability !== undefined && (
                <span className="assessment-rain">{weather.precipitationProbability}% precipitation probability</span>
              )}
            </div>

            <div className="assessment-factors">
              {evaluation.factors.map((factor) => (
                <article className="assessment-factor" key={factor.name}>
                  {factor.status === 'KNOWN' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <div><strong>{factor.name} · {factor.status === 'KNOWN' ? (factor.name === 'Weather' ? weatherFreshness.toLowerCase() : factor.freshness.toLowerCase()) : 'unknown'}</strong><p>{factor.detail}</p></div>
                </article>
              ))}
            </div>

            <div className="assessment-reasons">
              <h3><ShieldCheck size={17} /> Why this result</h3>
              <ul>{evaluation.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
            </div>
            {evaluation.persistence.observation !== 'saved' && (
              <p className="assessment-persistence-note">This assessment’s observation was not saved to the destination record.</p>
            )}
          </section>
          {evaluation.decision === 'ALTERNATIVE' && (
            <section className="assessment-alternatives ys-panel" aria-labelledby="assessment-alternatives-title">
              <div className="assessment-section-heading"><div><p className="assessment-step">EXPERIENCE MATCH</p><h3 id="assessment-alternatives-title">Other demo destinations to compare</h3></div><span className="assessment-catalogue-note">Ranked by tag overlap · fixtures only</span></div>
              <p>These options share experience tags with your intent and are screened against the curated accessibility and operating fields. They are not checked against current conditions.</p>
              {alternatives.length ? alternatives.map(({ destination, matchedExperiences, reason }) => (
                <article className="assessment-alternative" key={destination.id}>
                  <div><strong>{destination.name}</strong><span>{destination.region} · {matchedExperiences.join(', ')}</span><p>{reason}</p></div>
                  <button type="button" onClick={() => setSelectedDestinationId(destination.id)}>Assess this option</button>
                </article>
              )) : <p>No alternative in the small demo catalogue passed the selected constraints.</p>}
            </section>
          )}
          <div className="assessment-next-actions">
            <Link href="/trip" className="ys-button">Create or edit a demo trip plan</Link>
            <span>The plan is a local draft; no services are booked.</span>
          </div>
        </section>
      )}
    </main>
  );
}
