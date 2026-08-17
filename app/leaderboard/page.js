'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, clearSession, getSession } from '@/lib/api';
import { getAvatarMap } from '@/lib/avatars';
import NavHeader from '@/components/NavHeader';
import PageHeading from '@/components/PageHeading';

const MEDALS = ['🥇', '🥈', '🥉'];

function extractRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.data)) return payload.data;
  throw new Error('Le serveur a renvoyé un classement invalide.');
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [rows, setRows]       = useState(null);
  const [avatarMap, setAvatarMap] = useState({});
  const [error, setError]     = useState('');
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const s = getSession();
    if (!s) { router.replace('/'); return; }
    setSession(s);
    getAvatarMap().then(setAvatarMap);
    setRows(null);
    setError('');
    api.getLeaderboard()
      .then((payload) => {
        if (!cancelled) setRows(extractRows(payload));
      })
      .catch((requestError) => {
        if (cancelled) return;
        if (requestError?.status === 401) {
          clearSession();
          router.replace('/auth');
          return;
        }
        setRows([]);
        setError(requestError?.message ?? 'Impossible de charger le classement.');
      });
    return () => { cancelled = true; };
  }, [router, requestKey]);

  if (!session) return null;

  return (
    <main className="page meta-page leaderboard-page">
      <div className="ambiance ambiance-home on" />
      <NavHeader session={session} />

      <PageHeading eyebrow="LES NOMS QUE LA VILLE N’OUBLIE PAS" title="CLASSEMENT"
                   subtitle="Les familles les plus redoutées de la ville." />

      {rows === null && <div className="meta-loading"><span /> Chargement du classement…</div>}
      {error && (
        <div className="meta-empty leaderboard-error">
          <strong>CLASSEMENT INDISPONIBLE</strong>
          <p>{error}</p>
          <button onClick={() => setRequestKey((key) => key + 1)}>RÉESSAYER</button>
        </div>
      )}
      {!error && rows?.length === 0 && (
        <div className="meta-empty"><strong>AUCUN DOSSIER CLASSÉ</strong><p>Les premières victoires apparaîtront ici.</p></div>
      )}

      {Array.isArray(rows) && rows.map((r) => {
        const url  = r.avatarId ? avatarMap[r.avatarId] : null;
        const isMe = r.username === session.username;
        return (
          <div key={r.rank} className={`achievement-row leaderboard-row rank-${r.rank}`}
               style={isMe ? { borderColor: 'var(--gold)', background: 'rgba(184,150,62,.08)' } : undefined}>
            <span className="cinzel" style={{ width: 34, textAlign: 'center',
                                              fontSize: r.rank <= 3 ? 20 : 13,
                                              color: 'var(--text-dim)' }}>
              {MEDALS[r.rank - 1] ?? r.rank}
            </span>
            <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden',
                          background: 'var(--well)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          border: '1px solid var(--line-strong)' }}>
              {url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={url} alt="" style={{ width: '100%', height: '100%' }} />
                : <span className="cinzel" style={{ fontSize: 14 }}>{r.username?.[0] ?? '?'}</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div className="cinzel" style={{ fontSize: 13,
                   color: isMe ? 'var(--gold-hi)' : undefined }}>
                {r.username}{isMe ? ' (vous)' : ''}
              </div>
              <div className="dim" style={{ fontSize: 12 }}>
                {r.games} partie{r.games > 1 ? 's' : ''} · {r.winRate}% victoires
                {r.kills > 0 ? ` · ${r.kills} élim.` : ''}
                {r.saves > 0 ? ` · ${r.saves} soins` : ''}
              </div>
            </div>
            <span className="cinzel" style={{ color: 'var(--blue, #6aa5d8)', fontSize: 16, marginRight: 14 }}>
              {r.elo ?? 1000} <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>ELO</span>
            </span>
            <span className="cinzel" style={{ color: 'var(--gold-hi)', fontSize: 16 }}>
              {r.wins} <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>victoires</span>
            </span>
          </div>
        );
      })}
    </main>
  );
}
