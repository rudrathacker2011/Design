'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useApp } from '@/modules/profile/app-context';
import { useAuth } from '@/modules/auth/AuthProvider';
import { apiClient, type ProductionTrip, type ProductionTripInput } from '@/lib/api/client';
import { SEED_DESTINATIONS } from '@/modules/destination/seed';

function defaultDates() {
  const start = new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + 3);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

function toProductionInput(trip: ProductionTrip): ProductionTripInput {
  return {
    destinationId: trip.destinationId,
    origin: trip.origin,
    travelDates: trip.travelDates,
    partySize: trip.partySize,
    pace: trip.pace,
    budget: trip.budget,
    transportPreference: trip.transportPreference,
    items: trip.items,
  };
}

export default function TripPage() {
  const { selectedDestination, profile } = useApp();
  const { session } = useAuth();
  const [trip, setTrip] = useState<ProductionTrip | null>(null);
  const [status, setStatus] = useState<'loading' | 'idle' | 'saving' | 'saved' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session?.access_token) {
      setStatus('error');
      setError('Sign in to create and manage a trip.');
      return;
    }
    let active = true;
    void apiClient.getTrip(session.access_token).then((saved) => {
      if (!active) return;
      setTrip(saved);
      setStatus('idle');
    }).catch((caught: unknown) => {
      if (!active) return;
      setStatus('error');
      setError(caught instanceof Error ? caught.message : 'Unable to load your trip.');
    });
    return () => { active = false; };
  }, [session?.access_token]);

  const createTrip = async () => {
    if (!session?.access_token) return;
    setStatus('saving');
    setError('');
    try {
      const dates = defaultDates();
      const created = await apiClient.createTrip({
        destinationId: selectedDestination.id,
        origin: 'Ahmedabad Junction',
        travelDates: dates,
        partySize: profile.partySize,
        pace: profile.pace === 'slow' ? 'RELAXED' : profile.pace === 'fast' ? 'FAST' : 'BALANCED',
        budget: profile.budget === 'value' ? 'VALUE' : profile.budget === 'flexible' ? 'FLEXIBLE' : 'COMFORTABLE',
        transportPreference: profile.transportPreference,
        items: [
          { id: '', day: 1, time: '09:00', title: 'Plan an activity for your travel intent', notes: profile.experienceIntent },
          { id: '', day: 1, time: '13:00', title: 'Add a meal or rest break', notes: 'Confirm opening times and prices before travel.' },
          { id: '', day: 2, time: '10:00', title: 'Add another activity', notes: 'Keep the plan flexible until destination signals are verified.' },
        ],
      }, session.access_token);
      setTrip(created);
      setStatus('saved');
    } catch (caught) {
      setStatus('error');
      setError(caught instanceof Error ? caught.message : 'Unable to create your trip.');
    }
  };

  const update = <K extends keyof ProductionTrip>(key: K, value: ProductionTrip[K]) => {
    setTrip((current) => current ? { ...current, [key]: value } : current);
    setStatus('idle');
  };

  const saveTrip = async () => {
    if (!session?.access_token || !trip) return;
    setStatus('saving');
    setError('');
    try {
      setTrip(await apiClient.updateTrip(trip.id, toProductionInput(trip), session.access_token));
      setStatus('saved');
    } catch (caught) {
      setStatus('error');
      setError(caught instanceof Error ? caught.message : 'Unable to save your trip.');
    }
  };

  const addItem = () => {
    if (!trip) return;
    update('items', [...trip.items, { id: '', day: 1, time: '15:00', title: 'New activity', notes: '' }]);
  };

  const updateItem = (id: string, patch: Partial<ProductionTrip['items'][number]>) => {
    if (!trip) return;
    update('items', trip.items.map((item) => item.id === id ? { ...item, ...patch } : item));
  };

  if (status === 'loading') return <main className="ys-form-page"><p className="ys-eyebrow">TRIP WORKSPACE</p><h1>Loading your trip</h1><p className="ys-form-intro">Retrieving your itinerary from your account.</p></main>;

  if (!trip) {
    return (
      <main className="ys-form-page">
        <p className="ys-eyebrow">TRIP WORKSPACE</p>
        <h1>Turn your decision into a plan</h1>
        <p className="ys-form-intro">Create an editable itinerary that is saved to your authenticated traveller account.</p>
        <section className="ys-trip-start">
          <span>Selected destination</span>
          <strong>{selectedDestination.name}</strong>
          <small>{selectedDestination.region} · {selectedDestination.category}</small>
        </section>
        {error && <p className="ys-form-footnote ys-form-error" role="alert">{error}</p>}
        <button className="ys-button" type="button" onClick={() => void createTrip()} disabled={status === 'saving'}>{status === 'saving' ? 'Creating…' : 'Create trip'}</button>
        <p className="ys-form-footnote">To change destination first, go to <Link href="/discover">Discover & decide</Link>.</p>
      </main>
    );
  }

  return (
    <main className="ys-form-page ys-trip-page">
      <p className="ys-eyebrow">TRIP WORKSPACE · ITINERARY V{trip.version}</p>
      <h1>{trip.destinationName}</h1>
      <p className="ys-form-intro">Edit your itinerary. Changes are versioned and persisted to your traveller account.</p>
      <div className="ys-form-grid">
        <label className="ys-field"><span>Destination</span><select value={trip.destinationId} onChange={(event) => update('destinationId', event.target.value)}>{SEED_DESTINATIONS.map((destination) => <option value={destination.id} key={destination.id}>{destination.name}</option>)}</select></label>
        <label className="ys-field"><span>Starting point</span><input value={trip.origin} onChange={(event) => update('origin', event.target.value)} /></label>
        <label className="ys-field"><span>Start date</span><input type="date" value={trip.travelDates.start} onChange={(event) => update('travelDates', { ...trip.travelDates, start: event.target.value })} /></label>
        <label className="ys-field"><span>End date</span><input type="date" value={trip.travelDates.end} onChange={(event) => update('travelDates', { ...trip.travelDates, end: event.target.value })} /></label>
        <label className="ys-field"><span>Travellers</span><input type="number" min={1} max={20} value={trip.partySize} onChange={(event) => update('partySize', Math.max(1, Math.min(20, Number(event.target.value) || 1)))} /></label>
        <label className="ys-field"><span>Trip pace</span><select value={trip.pace} onChange={(event) => update('pace', event.target.value as ProductionTrip['pace'])}><option value="RELAXED">Slow and relaxed</option><option value="BALANCED">Balanced</option><option value="FAST">See more in less time</option></select></label>
        <label className="ys-field"><span>Budget preference</span><select value={trip.budget} onChange={(event) => update('budget', event.target.value as ProductionTrip['budget'])}><option value="VALUE">Value conscious</option><option value="COMFORTABLE">Comfortable</option><option value="FLEXIBLE">Flexible</option></select></label>
        <label className="ys-field"><span>Transport preference</span><input value={trip.transportPreference} onChange={(event) => update('transportPreference', event.target.value)} /></label>
      </div>
      <div className="ys-trip-items-heading"><div><p className="ys-eyebrow">YOUR PLAN</p><h2>Day-by-day outline</h2></div><button className="ys-secondary-button" type="button" onClick={addItem}>Add itinerary item</button></div>
      <div className="ys-trip-items">
        {trip.items.map((item) => <article className="ys-trip-item" key={item.id}>
          <label className="ys-field"><span>Day</span><input type="number" min={1} max={30} value={item.day} onChange={(event) => updateItem(item.id, { day: Number(event.target.value) })} /></label>
          <label className="ys-field"><span>Time</span><input type="time" value={item.time} onChange={(event) => updateItem(item.id, { time: event.target.value })} /></label>
          <label className="ys-field"><span>Activity</span><input value={item.title} onChange={(event) => updateItem(item.id, { title: event.target.value })} /></label>
          <label className="ys-field ys-trip-notes"><span>Notes</span><textarea rows={2} value={item.notes} onChange={(event) => updateItem(item.id, { notes: event.target.value })} /></label>
        </article>)}
      </div>
      {error && <p className="ys-form-footnote ys-form-error" role="alert">{error}</p>}
      <div className="ys-form-actions"><span>{status === 'saved' ? 'Saved to your traveller account.' : status === 'saving' ? 'Saving…' : 'Unsaved changes'}</span><div><button className="ys-secondary-button" type="button" onClick={() => void saveTrip()} disabled={status === 'saving'}>Save itinerary</button><Link href="/mobility" className="ys-button">Review mobility options</Link></div></div>
    </main>
  );
}
