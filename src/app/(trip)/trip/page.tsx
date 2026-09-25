'use client';

import Link from 'next/link';
import { useApp } from '@/modules/profile/app-context';
import { SEED_DESTINATIONS } from '@/modules/destination/seed';

export default function TripPage() {
  const { selectedDestination, tripPlan, createTripPlan, setTripDestination, updateTripPlan, updateTripItem, addTripItem, removeTripItem, simulateTripAdaptation } = useApp();

  if (!tripPlan) {
    return (
      <main className="ys-form-page">
        <p className="ys-eyebrow">TRIP WORKSPACE</p>
        <h1>Turn your decision into a plan</h1>
        <p className="ys-form-intro">Create an editable, illustrative itinerary for the destination you selected. It will be saved in this browser. This does not reserve services or verify opening times.</p>
        <section className="ys-trip-start">
          <span>Selected demo destination</span>
          <strong>{selectedDestination.name}</strong>
          <small>{selectedDestination.region} · {selectedDestination.category}</small>
        </section>
        <button className="ys-button" type="button" onClick={createTripPlan}>Create editable demo trip</button>
        <p className="ys-form-footnote">To change destination first, go to <Link href="/discover">Discover & decide</Link>.</p>
      </main>
    );
  }

  return (
    <main className="ys-form-page ys-trip-page">
      <p className="ys-eyebrow">TRIP WORKSPACE · DEMO ITINERARY V{tripPlan.version}</p>
      <h1>{tripPlan.destinationName}</h1>
      <p className="ys-form-intro">Edit the outline below. Activities are prompts based on your inputs, not booked or verified places. Changes save in this browser as you make them.</p>

      <div className="ys-form-grid">
        <label className="ys-field"><span>Destination</span><select value={tripPlan.destinationId} onChange={(e) => setTripDestination(e.target.value)}>{SEED_DESTINATIONS.map((destination) => <option value={destination.id} key={destination.id}>{destination.name} · demo fixture</option>)}</select></label>
        <label className="ys-field"><span>Starting point</span><input value={tripPlan.origin} onChange={(e) => updateTripPlan({ origin: e.target.value })} /></label>
        <label className="ys-field"><span>Travel dates</span><input value={tripPlan.travelDates} onChange={(e) => updateTripPlan({ travelDates: e.target.value })} /></label>
        <label className="ys-field"><span>Travellers</span><input type="number" min={1} max={20} value={tripPlan.partySize} onChange={(e) => updateTripPlan({ partySize: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })} /></label>
        <label className="ys-field"><span>Trip pace</span><select value={tripPlan.pace} onChange={(e) => updateTripPlan({ pace: e.target.value as typeof tripPlan.pace })}><option value="slow">Slow and relaxed</option><option value="balanced">Balanced</option><option value="fast">See more in less time</option></select></label>
        <label className="ys-field"><span>Budget preference</span><select value={tripPlan.budget} onChange={(e) => updateTripPlan({ budget: e.target.value as typeof tripPlan.budget })}><option value="value">Value conscious</option><option value="comfortable">Comfortable</option><option value="flexible">Flexible</option></select></label>
        <label className="ys-field"><span>Transport preference</span><select value={tripPlan.transportPreference} onChange={(e) => updateTripPlan({ transportPreference: e.target.value as typeof tripPlan.transportPreference })}><option value="public">Public transport</option><option value="self-drive">Self drive</option><option value="chauffeur">Driver</option><option value="mixed">A mix of options</option></select></label>
      </div>

      <div className="ys-trip-items-heading"><div><p className="ys-eyebrow">YOUR PLAN</p><h2>Day-by-day outline</h2></div><div><button className="ys-secondary-button" type="button" onClick={simulateTripAdaptation}>Simulate reality change</button><button className="ys-secondary-button" type="button" onClick={addTripItem} style={{ marginLeft: 8 }}>Add itinerary item</button></div></div>
      {tripPlan.adaptationNote && <div className="ys-intent-preview"><strong>Draft adaptation {tripPlan.adaptationCount}</strong><p>{tripPlan.adaptationNote} The original items are still editable.</p></div>}
      <div className="ys-trip-items">
        {tripPlan.items.map((item) => (
          <article className="ys-trip-item" key={item.id}>
            <label className="ys-field"><span>Day</span><input type="number" min={1} max={30} value={item.day} onChange={(e) => updateTripItem(item.id, { day: Math.max(1, Math.min(30, Number(e.target.value) || 1)) })} /></label>
            <label className="ys-field"><span>Time</span><input type="time" value={item.time} onChange={(e) => updateTripItem(item.id, { time: e.target.value })} /></label>
            <label className="ys-field"><span>Activity</span><input value={item.title} onChange={(e) => updateTripItem(item.id, { title: e.target.value })} placeholder="Add an activity" /></label>
            <label className="ys-field ys-trip-notes"><span>Notes</span><textarea rows={2} value={item.notes} onChange={(e) => updateTripItem(item.id, { notes: e.target.value })} placeholder="What should you remember or verify?" /></label>
            <button className="ys-remove-item" type="button" onClick={() => removeTripItem(item.id)} aria-label={`Remove ${item.title || 'itinerary item'}`}>Remove</button>
          </article>
        ))}
      </div>

      <div className="ys-form-actions"><span>Saved locally · Version {tripPlan.version} · Last edited {new Date(tripPlan.updatedAt).toLocaleString()}</span><Link href="/mobility" className="ys-button">Review demo mobility options</Link></div>
      <p className="ys-form-footnote">The itinerary remains under your control. Adaptation is a local demo simulation; no live provider or destination reality signal triggered this change.</p>
    </main>
  );
}
