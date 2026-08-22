'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, getSession } from '@/lib/api';
import NavHeader from '@/components/NavHeader';
import PageHeading from '@/components/PageHeading';
import RoleIcon from '@/components/RoleIcon';
import { ROLE_GUIDE } from '@/lib/roleGuide';

const ROLE_LABELS = Object.fromEntries(ROLE_GUIDE.map((r) => [r.key, r.name]));

export default function ProfilePage() {
  const router = useRouter();
  const [session, setSession]     = useState(null);
  const [profile, setProfile]     = useState(null);
  const [stats, setStats]         = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [history, setHistory]     = useState([]);
  const [tab, setTab]             = useState(0);
  const [discordBusy, setDiscordBusy] = useState(false);
  const [discordMessage, setDiscordMessage] = useState('');

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace('/'); return; }
    setSession(s);
    api.getStats().then(setStats).catch(() => {});
    api.getAchievements().then(setAchievements).catch(() => {});
    api.getHistory().then(setHistory).catch(() => {});

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const discordError = params.get('error');
    if (discordError) {
      api.profile().then(setProfile).catch(() => {});
      setTab(3);
      setDiscordMessage('La liaison Discord a été annulée.');
      window.history.replaceState(null, '', '/profile');
    } else if (code && state) {
      setTab(3);
      setDiscordBusy(true);
      api.discordCompleteLink(code, state)
        .then(async (linked) => {
          const updatedProfile = await api.profile().catch(() => linked);
          setProfile(updatedProfile);
          setDiscordMessage(linked.dmDelivered
            ? 'Compte lié — un message privé de confirmation vient de vous être envoyé.'
            : 'Compte lié. Les messages privés Discord semblent fermés ou le bot n’est pas encore connecté.');
        })
        .catch((error) => setDiscordMessage(error.message || 'Impossible de lier ce compte Discord.'))
        .finally(() => {
          setDiscordBusy(false);
          window.history.replaceState(null, '', '/profile');
        });
    } else {
      api.profile().then(setProfile).catch(() => {});
    }
  }, [router]);

  const connectDiscord = async () => {
    setDiscordBusy(true);
    setDiscordMessage('');
    try {
      const { authorizationUrl } = await api.discordAuthorize();
      window.location.assign(authorizationUrl);
    } catch (error) {
      setDiscordMessage(error.message || 'Impossible de démarrer la liaison Discord.');
      setDiscordBusy(false);
    }
  };

  const disconnectDiscord = async () => {
    if (!window.confirm('Dissocier ce compte Discord ? Vous ne recevrez plus les messages privés du jeu.')) return;
    setDiscordBusy(true);
    setDiscordMessage('');
    try {
      await api.discordUnlink();
      setProfile((current) => ({
        ...current,
        discordUserId: null,
        discordUsername: null,
        discordAvatar: null,
        discordAvatarUrl: null,
        discordLinkedAt: null,
      }));
      setDiscordMessage('Compte Discord dissocié.');
    } catch (error) {
      setDiscordMessage(error.message || 'Impossible de dissocier Discord.');
    } finally {
      setDiscordBusy(false);
    }
  };

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
        {['STATISTIQUES', `SUCCÈS (${unlocked.length}/${achievements.length})`, 'HISTORIQUE', 'CONNEXIONS'].map((l, i) => (
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
                      <span className="profile-role-label"><RoleIcon roleKey={role} className="profile-role-art" /> {ROLE_LABELS[role] ?? role}</span>
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
            <div key={h.id}
                 className={`achievement-row history-row ${h.gameId ? 'clickable' : ''}`}
                 role={h.gameId ? 'button' : undefined}
                 tabIndex={h.gameId ? 0 : undefined}
                 title={h.gameId ? 'Voir le déroulé complet de cette partie' : 'Partie jouée avant l’archivage détaillé'}
                 onClick={() => h.gameId && router.push(`/history/${h.gameId}`)}
                 onKeyDown={(e) => e.key === 'Enter' && h.gameId && router.push(`/history/${h.gameId}`)}>
              <RoleIcon roleKey={h.role} className="history-role-art" />
              <div style={{ flex: 1 }}>
                <div className="cinzel" style={{ fontSize: 16 }}>
                  {ROLE_LABELS[h.role] ?? h.role}
                  <span style={{ marginLeft: 10, fontSize: 13,
                                 color: h.won ? 'var(--gold-hi)' : 'var(--text-dim)' }}>
                    {h.won ? '👑 VICTOIRE' : '💀 DÉFAITE'}
                  </span>
                </div>
                <div className="dim" style={{ fontSize: 14 }}>
                  {new Date(h.playedAt).toLocaleString('fr-FR')} · {h.rounds} tours
                  {h.survived ? ' · survivant' : ' · éliminé'}
                  {h.kills > 0 ? ` · ${h.kills} élim.` : ''}
                  {h.saves > 0 ? ` · ${h.saves} soins` : ''}
                </div>
              </div>
              {h.gameId && <span className="history-open">DÉTAIL →</span>}
            </div>
          ))}
        </div>
      )}

      {/* ── Connections ── */}
      {tab === 3 && (
        <section className="card discord-link-card">
          <div className="discord-link-mark" aria-hidden="true">◉</div>
          <div className="discord-link-copy">
            <small>COMPAGNON DE PARTIE</small>
            <h2>DISCORD</h2>
            {profile?.discordUserId ? (
              <>
                <div className="discord-linked-user">
                  {profile.discordAvatarUrl
                    ? <img src={profile.discordAvatarUrl} alt="" />
                    : <span>{(profile.discordUsername ?? 'D')[0]}</span>}
                  <div><b>{profile.discordUsername}</b><small>COMPTE LIÉ ET PRÊT</small></div>
                </div>
                <p>Le bot peut vous identifier dans le vocal et vous envoyer en privé votre rôle, les visites, blocages, résultats d’enquête, protections et éliminations.</p>
                <button type="button" className="discord-unlink-button" disabled={discordBusy} onClick={disconnectDiscord}>
                  DISSOCIER DISCORD
                </button>
              </>
            ) : (
              <>
                <p>Liez votre compte pour que le bot sache quelle personne Discord correspond à votre joueur PC. Seule votre identité publique Discord est demandée.</p>
                <button type="button" className="discord-link-button" disabled={discordBusy} onClick={connectDiscord}>
                  {discordBusy ? 'CONNEXION…' : 'LIER MON COMPTE DISCORD'}
                </button>
              </>
            )}
            {discordMessage && <div className="discord-link-message" role="status">{discordMessage}</div>}
          </div>
        </section>
      )}
    </main>
  );
}
