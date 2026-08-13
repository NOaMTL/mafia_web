'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, getSession } from '@/lib/api';
import NavHeader from '@/components/NavHeader';

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
    <div className="page" style={{ maxWidth: 480 }}>
      <NavHeader session={session} />

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <button className="primary" style={{ padding: 16 }} disabled={busy} onClick={createLobby}>
          CRÉER UNE PARTIE
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span className="dim" style={{ fontSize: 12 }}>ou</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <form onSubmit={joinLobby} style={{ display: 'flex', gap: 10 }}>
          <input placeholder="CODE" value={code} maxLength={6}
                 style={{ textTransform: 'uppercase', letterSpacing: 4, textAlign: 'center' }}
                 onChange={(e) => setCode(e.target.value)} />
          <button disabled={busy || !code.trim()} type="submit">REJOINDRE</button>
        </form>

        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
}
