'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, API_URL, getToken } from '@/lib/api';
import { getAvatarMap } from '@/lib/avatars';
import NavHeader from '@/components/NavHeader';
import PageHeading from '@/components/PageHeading';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [rows, setRows]       = useState(null);
  const [avatarMap, setAvatarMap] = useState({});

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace('/'); return; }
    setSession(s);
    getAvatarMap().then(setAvatarMap);
    fetch(`${API_URL}/stats/leaderboard`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then(setRows)
      .catch(() => setRows([]));
  }, [router]);

  if (!session) return null;

  return (
    <main className="page meta-page leaderboard-page">
      <div className="ambiance ambiance-home on" />
      <NavHeader session={session} />

      <PageHeading eyebrow="LES NOMS QUE LA VILLE N’OUBLIE PAS" title="CLASSEMENT"
                   subtitle="Les familles les plus redoutées de la ville." />

      {rows === null && <div className="meta-loading"><span /> Chargement du classement…</div>}
      {rows?.length === 0 && (
        <div className="meta-empty"><strong>AUCUN DOSSIER CLASSÉ</strong><p>Les premières victoires apparaîtront ici.</p></div>
      )}

      {(rows ?? []).map((r) => {
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
                : <span className="cinzel" style={{ fontSize: 14 }}>{r.username[0]}</span>}
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
            <span className="cinzel" style={{ color: 'var(--gold-hi)', fontSize: 16 }}>
              {r.wins} <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>victoires</span>
            </span>
          </div>
        );
      })}
    </main>
  );
}
