'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, saveSession, getSession } from '@/lib/api';
import BrandMark from '@/components/BrandMark';

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
    <main className="auth-page">
      <div className="auth-art" aria-hidden="true" />
      <header className="auth-nav">
        <BrandMark />
        <Link href="/" className="auth-back">← RETOUR À L&apos;ACCUEIL</Link>
      </header>

      <section className="auth-layout">
        <div className="auth-story">
          <div className="page-eyebrow">BIENVENUE DANS LA VILLE</div>
          <h1>CHAQUE VISAGE<br />CACHE UN <span>SECRET.</span></h1>
          <p>Entrez dans la partie. Observez, accusez, mentez — et survivez jusqu&apos;au lever du jour.</p>
          <div className="auth-rule"><span>01</span> Faites confiance avec prudence</div>
          <div className="auth-rule"><span>02</span> Votre rôle reste votre meilleur atout</div>
        </div>

        <form className="auth-card" onSubmit={submit}>
          <div className="auth-card-head">
            <span>{mode === 'login' ? 'IDENTIFICATION' : 'NOUVEAU JOUEUR'}</span>
            <h2>{mode === 'login' ? 'SE CONNECTER' : 'S’INSCRIRE'}</h2>
            <p>{mode === 'login' ? 'Reprenez votre place autour de la table.' : 'Créez votre identité dans le village.'}</p>
          </div>

          {mode === 'register' && (
            <label>
              <span>PSEUDO</span>
              <input placeholder="Votre nom dans la ville" value={username} required
                     autoComplete="username" onChange={(e) => setUsername(e.target.value)} />
            </label>
          )}
          <label>
            <span>ADRESSE EMAIL</span>
            <input placeholder="vous@exemple.fr" type="email" value={email} required
                   autoComplete="email" onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            <span>MOT DE PASSE</span>
            <input placeholder="••••••••" type="password" value={password} required
                   autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                   onChange={(e) => setPassword(e.target.value)} />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button className="btn-gold auth-submit" disabled={busy} type="submit">
            {busy ? '…' : mode === 'login' ? 'ENTRER DANS LA VILLE' : 'CRÉER MON COMPTE'}
            <span aria-hidden="true">→</span>
          </button>

          <button type="button" className="auth-switch"
                  onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
            {mode === 'login' ? 'Pas encore de compte ? S’inscrire' : 'Déjà inscrit ? Se connecter'}
          </button>
        </form>
      </section>
    </main>
  );
}

export default function AuthPage() {
  return <Suspense fallback={null}><AuthForm /></Suspense>;
}
