'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserSupabase } from '@/lib/auth/browser';
import { runtimeConfig } from '@/lib/config/runtime';
import { useAuth } from '@/modules/auth/AuthProvider';

export default function LoginPage() {
  const router = useRouter();
  const { configured, session } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('reason') === 'session-required') {
      setMessage('Your session has expired. Sign in again to continue.');
    }
    if (session) router.replace('/dashboard');
  }, [router, session]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (configured) {
        const client = getBrowserSupabase();
        if (!client) throw new Error('Authentication is not configured.');
        const { error: signInError } = await client.auth.signInWithPassword({ email: email.trim(), password });
        if (signInError) throw signInError;
        router.push('/dashboard');
        return;
      }
      if (runtimeConfig.mode === 'production') throw new Error('Production authentication is not configured. Add the Supabase browser variables before signing in.');
      const raw = window.localStorage.getItem('yatrasetu-demo-account');
      const account = raw ? JSON.parse(raw) as { email?: string } : null;
      if (!account || account.email !== email.trim().toLowerCase()) throw new Error('No matching local demo account found. Create one first.');
      window.localStorage.setItem('yatrasetu-demo-session', JSON.stringify({ email: account.email, signedInAt: new Date().toISOString() }));
      router.push('/dashboard');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  };

  const sendMagicLink = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const client = getBrowserSupabase();
      if (!client) throw new Error('Magic links require Supabase configuration.');
      const { error: linkError } = await client.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/login` },
      });
      if (linkError) throw linkError;
      setMessage('Check your email for a secure sign-in link.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to send the magic link.');
    } finally {
      setBusy(false);
    }
  };

  return <main className="ys-form-page">
    <p className="ys-eyebrow">Account · {configured ? 'Supabase Auth' : 'local demo'}</p>
    <h1>Return to your traveller workspace</h1>
    <p className="ys-form-intro">{configured ? 'Sign in with your password or request a one-time magic link.' : runtimeConfig.mode === 'production' ? 'Production authentication is unavailable until Supabase is configured.' : 'This browser is running demo mode. Configure Supabase to enable production authentication.'}</p>
    <form onSubmit={submit}>
      <label className="ys-field ys-field-wide"><span>Email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
      {configured && <label className="ys-field ys-field-wide"><span>Password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>}
      <div className="ys-form-actions"><span>{configured ? 'Your session is securely stored by Supabase.' : 'No password is collected in demo mode.'}</span><button className="ys-button" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Continue to workspace'}</button></div>
    </form>
    {configured && <button className="ys-secondary-button ys-auth-link-button" type="button" onClick={sendMagicLink} disabled={busy}>Email me a magic link</button>}
    {message && <p className="ys-form-footnote" role="status">{message}</p>}
    {error && <p className="ys-form-footnote ys-form-error" role="alert">{error}</p>}
    <p className="ys-form-footnote">{runtimeConfig.mode === 'demo' ? <>New here? <Link href="/register">Create a demo workspace</Link></> : <>Need an account? <Link href="/register">Create one</Link></>}</p>
  </main>;
}
