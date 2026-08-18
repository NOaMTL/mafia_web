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
          <div key={r.rank} className={`achievement-row leaderboard-row rank-${r.rank}${isMe ? ' is-me' : ''}`}>
            <span className={`leaderboard-rank${r.rank <= 3 ? ' is-medal' : ''}`}>
              {MEDALS[r.rank - 1] ?? r.rank}
            </span>
            <div className="leaderboard-avatar">
              {url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={url} alt="" />
                : <span>{r.username?.[0] ?? '?'}</span>}
            </div>
            <div className="leaderboard-identity">
              <strong>
                {r.username}{isMe ? ' (vous)' : ''}
              </strong>
              <span>
                {r.games} partie{r.games > 1 ? 's' : ''} · {r.winRate}% victoires
                {r.kills > 0 ? ` · ${r.kills} élim.` : ''}
                {r.saves > 0 ? ` · ${r.saves} soins` : ''}
              </span>
            </div>
            <div className="leaderboard-scores">
              <div className="leaderboard-score elo">
                <strong>{r.elo ?? 1000}</strong>
                <span>ELO</span>
              </div>
              <div className="leaderboard-score wins">
                <strong>{r.wins}</strong>
                <span>VICTOIRES</span>
              </div>
            </div>
          </div>
        );
      })}
    </main>
  );
}
