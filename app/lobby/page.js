'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, getSession } from '@/lib/api';
import NavHeader from '@/components/NavHeader';
import PageHeading from '@/components/PageHeading';

export default function LobbyHome() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [code, setCode]       = useState('');
  const [error, setError]     = useState('');
  const [busy, setBusy]       = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace('/'); return; }
    setSession(s);
  }, [router]);

  async function createLobby() {
    setBusy(true); setError('');
    try {
      const lobby = await api.createLobby();
      router.push(`/lobby/${lobby.id}`);
    } catch (e) { setError(e.message); setBusy(false); }
  }

  async function joinLobby(e) {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true); setError('');
    try {
      const lobby = await api.joinLobby(code.trim().toUpperCase());
      router.push(`/lobby/${lobby.id}`);
    } catch (e) { setError(e.message); setBusy(false); }
  }

  if (!session) return null;

  return (
    <main className="page meta-page lobby-home">
      <div className="ambiance ambiance-home on" />
      <NavHeader session={session} />

      <PageHeading eyebrow="QUEL SERA VOTRE PROCHAIN RÔLE ?" title="ENTREZ DANS LA VILLE"
                   subtitle="Créez votre propre table ou rejoignez une partie grâce à son code secret." />

      <div className="lobby-choice-grid">
        <section className="choice-card choice-create">
          <div className="choice-number">01</div>
          <div className="choice-icon">＋</div>
          <h2>CRÉER UNE PARTIE</h2>
          <p>Invitez vos proches et préparez une nouvelle nuit de soupçons.</p>
          <button className="btn-gold" disabled={busy} onClick={createLobby}>
            CRÉER MA TABLE <span>→</span>
          </button>
        </section>

        <section className="choice-card">
          <div className="choice-number">02</div>
          <div className="choice-icon">⌁</div>
          <h2>REJOINDRE UNE PARTIE</h2>
          <p>Saisissez le code communiqué par l&apos;organisateur de la partie.</p>
          <form onSubmit={joinLobby} className="join-form">
            <input aria-label="Code de la partie" placeholder="ABC123" value={code} minLength={6} maxLength={6}
                   pattern="[A-Z0-9]{6}" autoCapitalize="characters" autoComplete="off" spellCheck={false}
                   onChange={(e) => setCode(e.target.value.replace(/[^a-z0-9]/gi, '').toUpperCase())} />
            <button disabled={busy || code.length !== 6} type="submit">REJOINDRE</button>
          </form>
        </section>
      </div>
      {error && <div className="meta-alert">{error}</div>}
      <div className="lobby-footnote"><span /> 4 à 15 joueurs · parties de 15 à 30 minutes <span /></div>
    </main>
  );
}
