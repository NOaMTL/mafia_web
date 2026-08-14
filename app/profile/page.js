'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, getSession } from '@/lib/api';
import NavHeader from '@/components/NavHeader';
import PageHeading from '@/components/PageHeading';

const ROLE_LABELS = {
  CITIZEN: 'Citoyen', MAFIOSO: 'Mafioso', SHERIFF: 'Shérif', DETECTIVE: 'Détective',
  INVESTIGATOR: 'Enquêteur', DOCTOR: 'Médecin', VIGILANTE: 'Vigilante',
};
const ROLE_EMOJI = {
  CITIZEN: '🏘️', MAFIOSO: '🔪', SHERIFF: '⭐', DETECTIVE: '👣',
  INVESTIGATOR: '🔎', DOCTOR: '⚕️', VIGILANTE: '🔫',
};

export default function ProfilePage() {
  const router = useRouter();
  const [session, setSession]     = useState(null);
  const [profile, setProfile]     = useState(null);
  const [stats, setStats]         = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [history, setHistory]     = useState([]);
  const [tab, setTab]             = useState(0);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace('/'); return; }
    setSession(s);
    api.profile().then(setProfile).catch(() => {});
    api.getStats().then(setStats).catch(() => {});
    api.getAchievements().then(setAchievements).catch(() => {});
    api.getHistory().then(setHistory).catch(() => {});
  }, [router]);

  if (!session) return null;

  const winRate = stats?.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0;
  const unlocked = achievements.filter((a) => a.unlocked);
  const locked   = achievements.filter((a) => !a.unlocked);

  return (
    <main className="page meta-page profile-page">
      <div className="ambiance ambiance-home on" />
      <NavHeader session={session} diamonds={profile?.diamonds} />

      <PageHeading eyebrow="DOSSIER DU JOUEUR" title={session.username}
                   subtitle={profile?.diamonds != null ? `${profile.diamonds} diamants disponibles` : 'Chargement du dossier…'} />

      {/* Tabs */}
      <div className="meta-tabs">
        {['STATISTIQUES', `SUCCÈS (${unlocked.length}/${achievements.length})`, 'HISTORIQUE'].map((l, i) => (
          <button key={i} className={tab === i ? 'active' : ''}
                  onClick={() => setTab(i)}>{l}</button>
        ))}
      </div>

      {/* ── Stats ── */}
      {tab === 0 && (
        <div className="card">
          {!stats ? <p className="dim">Chargement…</p> : (
            <>
              <div className="stats-grid" style={{ marginBottom: 18 }}>
                <div className="stat-box"><div className="value">{stats.total}</div><div className="label">PARTIES</div></div>
                <div className="stat-box"><div className="value">{stats.wins}</div><div className="label">VICTOIRES</div></div>
                <div className="stat-box"><div className="value">{winRate}%</div><div className="label">WIN RATE</div></div>
                <div className="stat-box"><div className="value">{stats.survived}</div><div className="label">SURVIES</div></div>
                <div className="stat-box"><div className="value">{stats.totalKills}</div><div className="label">ÉLIMINATIONS</div></div>
                <div className="stat-box"><div className="value">{stats.totalSaves}</div><div className="label">SOINS</div></div>
              </div>
              {stats.byRole && Object.keys(stats.byRole).length > 0 && (
                <>
                  <div className="cinzel" style={{ fontSize: 11, letterSpacing: 2,
                                                   color: 'var(--gold)', marginBottom: 10 }}>
                    PAR RÔLE
                  </div>
                  {Object.entries(stats.byRole).map(([role, r]) => (
                    <div key={role} style={{ display: 'flex', justifyContent: 'space-between',
                                             padding: '6px 4px', fontSize: 14 }}>
                      <span>{ROLE_EMOJI[role]} {ROLE_LABELS[role] ?? role}</span>
                      <span className="dim">{r.wins}/{r.played} victoires</span>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Achievements ── */}
      {tab === 1 && (
        <div>
          {[...unlocked, ...locked].map((a) => (
            <div key={a.id} className={`achievement-row ${a.unlocked ? '' : 'locked'}`}>
              <span className="emoji">{a.icon}</span>
              <div style={{ flex: 1 }}>
                <div className="cinzel" style={{ fontSize: 13,
                     color: a.unlocked ? 'var(--gold-hi)' : undefined }}>{a.name}</div>
                <div className="dim" style={{ fontSize: 12.5 }}>{a.description}</div>
              </div>
              <span style={{ color: 'var(--blue)', fontSize: 12 }}>+{a.diamondReward} 💎</span>
            </div>
          ))}
          {achievements.length === 0 && <div className="meta-loading"><span /> Chargement des succès…</div>}
        </div>
      )}

      {/* ── History ── */}
      {tab === 2 && (
        <div>
          {history.length === 0 && <div className="meta-empty"><strong>AUCUNE PARTIE ARCHIVÉE</strong><p>Votre historique apparaîtra après votre première nuit.</p></div>}
          {history.map((h) => (
            <div key={h.id} className="achievement-row">
              <span className="emoji">{ROLE_EMOJI[h.role] ?? '❓'}</span>
              <div style={{ flex: 1 }}>
                <div className="cinzel" style={{ fontSize: 13 }}>
                  {ROLE_LABELS[h.role] ?? h.role}
                  <span style={{ marginLeft: 10, fontSize: 11,
                                 color: h.won ? 'var(--gold-hi)' : 'var(--text-dim)' }}>
                    {h.won ? '👑 VICTOIRE' : '💀 DÉFAITE'}
                  </span>
                </div>
                <div className="dim" style={{ fontSize: 12 }}>
                  {new Date(h.playedAt).toLocaleString('fr-FR')} · {h.rounds} tours
                  {h.survived ? ' · survivant' : ' · éliminé'}
                  {h.kills > 0 ? ` · ${h.kills} élim.` : ''}
                  {h.saves > 0 ? ` · ${h.saves} soins` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
