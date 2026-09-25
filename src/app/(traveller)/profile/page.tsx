'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useApp } from '@/modules/profile/app-context';
import { useAuth } from '@/modules/auth/AuthProvider';
import { apiClient } from '@/lib/api/client';

export default function ProfilePage() {
  const { profile, setProfile } = useApp();
  const { session } = useAuth();
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveProfile = async () => {
    if (!session?.access_token) return;
    setSaveState('saving');
    try {
      await apiClient.updateProfile({
        travelPace: profile.pace === 'slow' ? 'RELAXED' : profile.pace === 'fast' ? 'FAST' : 'BALANCED',
        crowdPreference: profile.crowdPreference === 'quiet' ? 'SEEK_QUIET' : profile.crowdPreference === 'lively' ? 'DONT_CARE' : 'MODERATE',
        accessibilityNeeds: profile.accessibilityNeeded,
        transportPreference: profile.transportPreference,
        vehicleRequired: profile.transportPreference === 'self-drive',
      }, session.access_token);
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  };
  return (
    <main className="ys-form-page">
      <p className="ys-eyebrow">YOUR JOURNEY · 1 OF 4</p>
      <h1>Tell us how you like to travel</h1>
      <p className="ys-form-intro">Set the practical details that should shape destination and trip suggestions. You can change these any time.</p>

      <div className="ys-form-grid">
        <label className="ys-field"><span>Travel dates</span><input value={profile.travelDates} onChange={(e) => setProfile({ ...profile, travelDates: e.target.value })} placeholder="e.g. 14–18 Nov 2026" /></label>
        <label className="ys-field"><span>People travelling</span><input type="number" min={1} max={20} value={profile.partySize} onChange={(e) => setProfile({ ...profile, partySize: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })} /></label>
        <label className="ys-field"><span>Budget</span><select value={profile.budget} onChange={(e) => setProfile({ ...profile, budget: e.target.value as typeof profile.budget })}><option value="value">Value conscious</option><option value="comfortable">Comfortable</option><option value="flexible">Flexible</option></select></label>
        <label className="ys-field"><span>Travel pace</span><select value={profile.pace} onChange={(e) => setProfile({ ...profile, pace: e.target.value as typeof profile.pace })}><option value="slow">Slow and relaxed</option><option value="balanced">Balanced</option><option value="fast">See more in less time</option></select></label>
        <label className="ys-field"><span>Crowd preference</span><select value={profile.crowdPreference} onChange={(e) => setProfile({ ...profile, crowdPreference: e.target.value as typeof profile.crowdPreference })}><option value="quiet">Prefer quieter places</option><option value="balanced">Some activity is fine</option><option value="lively">Lively places are fine</option></select></label>
        <label className="ys-field"><span>How do you prefer to get around?</span><select value={profile.transportPreference} onChange={(e) => setProfile({ ...profile, transportPreference: e.target.value as typeof profile.transportPreference })}><option value="public">Public transport</option><option value="self-drive">Self drive</option><option value="chauffeur">Driver</option><option value="mixed">A mix of options</option></select></label>
      </div>
      <label className="ys-check-field"><input type="checkbox" checked={profile.accessibilityNeeded} onChange={(e) => setProfile({ ...profile, accessibilityNeeded: e.target.checked })} /><span>I need accessibility information before choosing a destination or route.</span></label>
      <div className="ys-profile-contact">
        <p className="ys-eyebrow">OPTIONAL · OFFLINE PREPARATION</p>
        <h2>Emergency contact for your offline pack</h2>
        <p>Stored with your traveller profile. YatraSetu does not verify or notify this person.</p>
        <div className="ys-form-grid">
          <label className="ys-field"><span>Contact name</span><input value={profile.emergencyContactName} maxLength={80} onChange={(e) => setProfile({ ...profile, emergencyContactName: e.target.value })} /></label>
          <label className="ys-field"><span>Phone number</span><input type="tel" value={profile.emergencyContactPhone} maxLength={32} onChange={(e) => setProfile({ ...profile, emergencyContactPhone: e.target.value })} /></label>
          <label className="ys-field"><span>Relationship</span><input value={profile.emergencyContactRelationship} maxLength={40} onChange={(e) => setProfile({ ...profile, emergencyContactRelationship: e.target.value })} placeholder="Friend, family, etc." /></label>
        </div>
      </div>
      <div className="ys-form-actions">
        <span>{saveState === 'saved' ? 'Saved to your traveller account.' : saveState === 'error' ? 'Could not save to the server. Check your connection and try again.' : 'Save your profile before continuing.'}</span>
        <div>
          {session && <button className="ys-secondary-button" type="button" onClick={saveProfile} disabled={saveState === 'saving'}>{saveState === 'saving' ? 'Saving…' : 'Save profile'}</button>}
          <Link href="/intent" className="ys-button">Continue to travel intent</Link>
        </div>
      </div>
    </main>
  );
}
