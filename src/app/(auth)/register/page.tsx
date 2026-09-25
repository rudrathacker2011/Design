'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserSupabase } from '@/lib/auth/browser';
import { useAuth } from '@/modules/auth/AuthProvider';

export default function RegisterPage() {
  const router = useRouter();
  const { configured } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    setError('');
    try {
      if (configured) {
        const client = getBrowserSupabase();
        if (!client) throw new Error('Authentication is not configured.');
        const { data, error: signUpError } = await client.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { name: name.trim() }, emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (signUpError) throw signUpError;
        if (data.session) router.push('/profile');
        else setMessage('Account created. Check your email to verify the account before signing in.');
        return;
      }
      throw new Error('Production authentication is not configured. Add the Supabase browser variables before creating an account.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to create the account.');
    } finally {
      setBusy(false);
    }
  };

  return <main className="ys-form-page">
    <p className="ys-eyebrow">Account · Supabase Auth</p>
    <h1>Create a traveller workspace</h1>
    <p className="ys-form-intro">{configured ? 'Create a secure account with email verification. Your traveller profile is stored separately from authentication.' : 'Production authentication is unavailable until Supabase is configured.'}</p>
    <form onSubmit={submit}>
      <div className="ys-form-grid">
        <label className="ys-field"><span>Your name</span><input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required /></label>
        <label className="ys-field"><span>Email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
      </div>
      {configured && <label className="ys-field ys-field-wide"><span>Password</span><input type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required /></label>}
      <div className="ys-form-actions"><span>{configured ? 'Email verification may be required.' : 'Supabase configuration is required.'}</span><button className="ys-button" type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create workspace'}</button></div>
      {message && <p className="ys-form-footnote" role="status">{message}</p>}
      {error && <p className="ys-form-footnote ys-form-error" role="alert">{error}</p>}
    </form>
    <p className="ys-form-footnote">Already registered? <Link href="/login">Sign in</Link></p>
  </main>;
}
