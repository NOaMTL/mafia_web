'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, saveSession, getSession } from '@/lib/api';

function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode]         = useState(params.get('mode') === 'register' ? 'register' : 'login');
  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [busy, setBusy]         = useState(false);

  useEffect(() => {
    if (getSession()) router.replace('/lobby');
  }, [router]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = mode === 'login'
        ? await api.login(email, password)
        : await api.register(username, email, password);
      saveSession(res);
      router.replace('/lobby');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page" style={{ maxWidth: 420 }}>
      <div className="ambiance ambiance-home on" />
      <div className="auth-hero" style={{ paddingTop: '8vh' }}>
        <h1 className="title-gold logo cinzel" style={{ fontSize: 40 }}>MAFIA</h1>
        <p className="tagline">La nuit tombe sur le village…</p>
      </div>

      <form className="card" onSubmit={submit}
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {mode === 'register' && (
          <input placeholder="Pseudo" value={username} required
                 onChange={(e) => setUsername(e.target.value)} />
        )}
        <input placeholder="Email" type="email" value={email} required
               onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Mot de passe" type="password" value={password} required
               onChange={(e) => setPassword(e.target.value)} />

        {error && <div className="error">{error}</div>}

        <button className="btn-gold" disabled={busy} type="submit" style={{ padding: 14 }}>
          {busy ? '…' : mode === 'login' ? 'SE CONNECTER' : 'CRÉER LE COMPTE'}
        </button>

        <button type="button" style={{ border: 'none', background: 'none', fontSize: 12 }}
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
          {mode === 'login' ? 'Pas de compte ? S\'inscrire' : 'Déjà un compte ? Se connecter'}
        </button>
      </form>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm />
    </Suspense>
  );
}
