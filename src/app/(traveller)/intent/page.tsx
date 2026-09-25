'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useApp } from '@/modules/profile/app-context';
import { useAuth } from '@/modules/auth/AuthProvider';
import { apiClient } from '@/lib/api/client';
import { runtimeConfig } from '@/lib/config/runtime';

const intentTags = ['heritage', 'architecture', 'photography', 'nature', 'peace', 'food', 'craft', 'wildlife', 'adventure', 'culture'];

export default function IntentPage() {
  const { profile, setProfile } = useApp();
  const { session } = useAuth();
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const normalized = intentTags.filter((tag) => profile.experienceIntent.toLowerCase().includes(tag));
  const saveIntent = async () => {
    if (!session?.access_token || profile.experienceIntent.trim().length < 3) return;
    setStatus('saving');
    try {
      await apiClient.extractIntent({ rawText: profile.experienceIntent.trim() }, session.access_token);
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  };
  return (
    <main className="ys-form-page">
      <p className="ys-eyebrow">YOUR JOURNEY · 2 OF 4</p>
      <h1>What do you want this trip to feel like?</h1>
      <p className="ys-form-intro">Describe the experiences that matter to you. Your words are kept as entered; the tags below are simple demo matching cues, not an AI interpretation.</p>
      <label className="ys-field ys-field-wide"><span>Describe your travel intent</span><textarea rows={5} maxLength={500} value={profile.experienceIntent} onChange={(e) => setProfile({ ...profile, experienceIntent: e.target.value })} placeholder="For example: quiet heritage places, architecture and photography, with time for local food" /></label>
      <div className="ys-intent-preview" aria-live="polite">
        <strong>Demo matching cues</strong>
        <p>{normalized.length ? normalized.join(' · ') : 'No matching cues recognized yet. Your full description is still saved.'}</p>
      </div>
      <div className="ys-form-actions">
        <span>{profile.experienceIntent.length}/500 characters · {runtimeConfig.mode === 'demo' ? 'Saved in this browser' : status === 'saved' ? 'Saved to your traveller account' : status === 'error' ? 'Could not save intent to the server' : 'Save your intent before continuing'}</span>
        <div>
          {session && <button className="ys-secondary-button" type="button" onClick={saveIntent} disabled={status === 'saving'}>{status === 'saving' ? 'Saving…' : 'Save intent'}</button>}
          <Link href="/discover" className="ys-button">Continue to destination check</Link>
        </div>
      </div>
    </main>
  );
}
