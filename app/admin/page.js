'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, clearSession, getSession } from '@/lib/api';
import BrandMark from '@/components/BrandMark';
import NavHeader from '@/components/NavHeader';
import PageHeading from '@/components/PageHeading';

function initials(username) {
  return String(username ?? '?').slice(0, 2).toUpperCase();
}

function formatDate(value) {
  if (!value) return 'Jamais';
  return new Date(value).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}

function generatePassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const bytes = new Uint32Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join('');
}

export default function AdminPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [access, setAccess] = useState('loading');
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [games, setGames] = useState(null);
  const [openGame, setOpenGame] = useState(null); // détail de partie (roster)
  const pageSize = 30;

  const loadUsers = useCallback(async (targetPage, query) => {
    setLoading(true);
    setError('');
    try {
      const result = await api.adminUsers({ search: query, page: targetPage, pageSize });
      setUsers(Array.isArray(result?.items) ? result.items : []);
      setTotal(Number(result?.total) || 0);
      setAccess('granted');
    } catch (requestError) {
      if (requestError.status === 401) {
        clearSession();
        router.replace('/auth?mode=login');
        return;
      }
      if (requestError.status === 403) setAccess('denied');
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const current = getSession();
    if (!current) {
      router.replace('/auth?mode=login');
      return;
    }
    setSession(current);
    api.adminMe()
      .then(() => {
        loadUsers(1, '');
        api.adminListGames(60).then(setGames).catch(() => setGames([]));
      })
      .catch((requestError) => {
        setAccess(requestError.status === 403 ? 'denied' : 'error');
        setError(requestError.message);
        setLoading(false);
      });
  }, [loadUsers, router]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageStats = useMemo(() => ({
    games: users.reduce((sum, user) => sum + (user.gamesPlayed ?? 0), 0),
    wins: users.reduce((sum, user) => sum + (user.gamesWon ?? 0), 0),
    diamonds: users.reduce((sum, user) => sum + (user.diamonds ?? 0), 0),
  }), [users]);

  function submitSearch(event) {
    event.preventDefault();
    const query = search.trim();
    setAppliedSearch(query);
    setPage(1);
    loadUsers(1, query);
  }

  function changePage(nextPage) {
    const safePage = Math.min(totalPages, Math.max(1, nextPage));
    setPage(safePage);
    loadUsers(safePage, appliedSearch);
  }

  function openPasswordModal(user) {
    setSelected(user);
    setAdminPassword('');
    setNewPassword('');
    setConfirmation('');
    setShowPasswords(false);
    setError('');
  }

  async function resetPassword(event) {
    event.preventDefault();
    setError('');
    if (newPassword.length < 8) { setError('Le nouveau mot de passe doit contenir au moins 8 caractères.'); return; }
    if (newPassword !== confirmation) { setError('La confirmation ne correspond pas au nouveau mot de passe.'); return; }
    setSubmitting(true);
    try {
      const result = await api.adminResetPassword(selected.id, adminPassword, newPassword);
      setUsers((current) => current.map((user) => user.id === selected.id
        ? { ...user, passwordChangedAt: result.passwordChangedAt }
        : user));
      setNotice(`Mot de passe de ${selected.username} modifié. Ses anciens jetons ne seront plus acceptés.`);
      const changedOwnPassword = selected.id === session?.userId;
      setSelected(null);
      if (changedOwnPassword) {
        clearSession();
        router.replace('/auth?mode=login');
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!session) return null;

  if (access === 'denied' || access === 'error') {
    return (
      <main className="page meta-page admin-page admin-access-page">
        <div className="ambiance ambiance-home on" />
        <BrandMark href="/lobby" compact />
        <section className="admin-access-card">
          <span>{access === 'denied' ? '⛔' : '⚠'}</span>
          <small>ZONE RESTREINTE</small>
          <h1>{access === 'denied' ? 'ACCÈS REFUSÉ' : 'CONTRÔLE INDISPONIBLE'}</h1>
          <p>{access === 'denied'
            ? 'Ce compte ne figure pas dans la liste des administrateurs autorisés.'
            : error || 'Le backend ne répond pas pour le moment.'}</p>
          <button onClick={() => router.replace('/lobby')}>RETOUR AU LOBBY</button>
        </section>
      </main>
    );
  }

  return (
    <main className="page meta-page admin-page">
      <div className="ambiance ambiance-home on" />
      <NavHeader session={session} />
      <PageHeading eyebrow="CONSOLE PRIVÉE" title="Administration"
                   subtitle="Gérez les comptes inscrits sans exposer leurs données d’authentification." />

      <section className="admin-security-strip">
        <span>🔐</span><div><strong>ACCÈS PROTÉGÉ PAR LE BACKEND</strong><p>Chaque changement exige votre mot de passe actuel et invalide les anciens jetons du joueur.</p></div><b>ADMIN</b>
      </section>

      <section className="admin-overview">
        <div><small>COMPTES INSCRITS</small><strong>{total}</strong></div>
        <div><small>PARTIES · PAGE ACTUELLE</small><strong>{pageStats.games}</strong></div>
        <div><small>VICTOIRES · PAGE ACTUELLE</small><strong>{pageStats.wins}</strong></div>
        <div><small>DIAMANTS · PAGE ACTUELLE</small><strong>{pageStats.diamonds}</strong></div>
      </section>

      {notice && <div className="admin-notice" role="status"><span>✓</span>{notice}<button onClick={() => setNotice('')}>✕</button></div>}
      {error && !selected && <div className="meta-alert">{error}</div>}

      <section className="card admin-users-card">
        <header className="admin-users-heading">
          <div><small>REGISTRE DES HABITANTS</small><h2>JOUEURS INSCRITS</h2><p>Les comptes bots sont volontairement exclus.</p></div>
          <form onSubmit={submitSearch} className="admin-search">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pseudo ou adresse e-mail" aria-label="Rechercher un utilisateur" />
            <button type="submit">RECHERCHER</button>
          </form>
        </header>

        <div className="admin-user-list">
          {loading ? <div className="meta-loading"><span /> Chargement du registre…</div> : users.map((user) => {
            const winRate = user.gamesPlayed > 0 ? Math.round((user.gamesWon / user.gamesPlayed) * 100) : 0;
            return (
              <article key={user.id} className="admin-user-row">
                <span className="admin-user-avatar">{initials(user.username)}</span>
                <div className="admin-user-identity"><strong>{user.username}</strong><small>{user.email}</small><em>INSCRIT LE {formatDate(user.createdAt).toUpperCase()}</em></div>
                <div className="admin-user-stat"><small>PARTIES</small><b>{user.gamesPlayed}</b></div>
                <div className="admin-user-stat"><small>VICTOIRES</small><b>{user.gamesWon}<i>{winRate}%</i></b></div>
                <div className="admin-user-stat"><small>ELO</small><b>{user.elo ?? 1000}</b></div>
                <div className="admin-user-stat"><small>DIAMANTS</small><b>{user.diamonds} 💎</b></div>
                <div className="admin-password-state"><small>DERNIER CHANGEMENT</small><span>{formatDate(user.passwordChangedAt)}</span></div>
                <button className="admin-password-button" onClick={() => openPasswordModal(user)}><span>🔑</span> MOT DE PASSE</button>
              </article>
            );
          })}
          {!loading && users.length === 0 && <div className="meta-empty"><strong>AUCUN COMPTE TROUVÉ</strong><p>Modifiez les termes de votre recherche.</p></div>}
        </div>

        <footer className="admin-pagination">
          <span>{total ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} sur ${total}` : '0 compte'}</span>
          <div><button disabled={page <= 1 || loading} onClick={() => changePage(page - 1)}>← PRÉCÉDENT</button><b>PAGE {page} / {totalPages}</b><button disabled={page >= totalPages || loading} onClick={() => changePage(page + 1)}>SUIVANT →</button></div>
        </footer>
      </section>

      {/* ── Historique des parties jouées ── */}
      <section className="card admin-games-card">
        <header className="admin-users-heading">
          <div><small>ARCHIVES DE LA VILLE</small><h2>PARTIES JOUÉES</h2><p>Les {games?.length ?? 0} dernières parties archivées, créateur du lobby inclus.</p></div>
        </header>
        {games === null && <div className="meta-loading"><span /> Chargement des archives…</div>}
        {games?.length === 0 && <div className="meta-empty"><strong>AUCUNE PARTIE ARCHIVÉE</strong><p>Les archives sont créées à la fin de chaque partie.</p></div>}
        {(games ?? []).map((g) => (
          <article key={g.gameId} className="admin-game-row"
                   role="button" tabIndex={0}
                   onClick={() => api.adminGetGame(g.gameId).then(setOpenGame).catch(() => {})}
                   onKeyDown={(e) => e.key === 'Enter' && api.adminGetGame(g.gameId).then(setOpenGame).catch(() => {})}>
            <span className={`admin-game-winner ${g.winner === 'MAFIA' ? 'mafia' : 'town'}`}>
              {g.winner === 'MAFIA' ? '◆ MAFIA' : '✦ VILLE'}
            </span>
            <div className="admin-game-main">
              <strong>{formatDate(g.playedAt)}</strong>
              <small>
                Hôte : <b>{g.hostUsername ?? 'inconnu'}</b> · {g.rounds} tour{g.rounds > 1 ? 's' : ''} ·{' '}
                {g.playerCount} joueurs ({g.humanCount} humain{g.humanCount > 1 ? 's' : ''})
              </small>
            </div>
            <span className="admin-game-open">DÉTAIL →</span>
          </article>
        ))}
      </section>

      {/* ── Modale : roster d'une partie ── */}
      {openGame && (
        <div className="admin-password-modal" role="dialog" aria-modal="true"
             onMouseDown={(event) => event.target === event.currentTarget && setOpenGame(null)}>
          <div className="admin-game-detail">
            <header>
              <div>
                <small>{formatDate(openGame.playedAt)} · {openGame.rounds} TOURS</small>
                <h2>{openGame.winner === 'MAFIA' ? 'VICTOIRE DE LA MAFIA' : 'VICTOIRE DE LA VILLE'}</h2>
              </div>
              <button type="button" onClick={() => setOpenGame(null)}>✕</button>
            </header>
            {openGame.hostUsername && <p className="admin-game-host">👑 Créateur du lobby : <b>{openGame.hostUsername}</b></p>}
            <div className="admin-game-roster">
              {(openGame.players ?? []).map((p) => (
                <div key={p.userId} className={`admin-game-player ${p.team === 'MAFIA' ? 'mafia' : ''} ${p.isAlive ? '' : 'dead'}`}>
                  <span className="agp-name">
                    {p.username}
                    {p.isBot && <em>BOT</em>}
                    {p.userId === openGame.hostId && <em className="host">HÔTE</em>}
                  </span>
                  <span className="agp-role">{p.role}</span>
                  <span className="agp-status">
                    {p.isAlive ? 'Survivant' : `✝ ${p.deathRecord?.cause ?? 'Mort'}`}
                    {typeof p.eloDelta === 'number' && (
                      <b className={p.eloDelta >= 0 ? 'elo-up' : 'elo-down'}>
                        {p.eloDelta >= 0 ? '+' : ''}{p.eloDelta} ELO
                      </b>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="admin-password-modal" role="dialog" aria-modal="true" aria-labelledby="admin-password-title" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
          <form onSubmit={resetPassword}>
            <header><div><small>OPÉRATION SENSIBLE</small><h2 id="admin-password-title">NOUVEAU MOT DE PASSE</h2></div><button type="button" onClick={() => setSelected(null)}>✕</button></header>
            <div className="admin-password-target"><span>{initials(selected.username)}</span><div><strong>{selected.username}</strong><small>{selected.email}</small></div></div>
            <p>Le mot de passe actuel n’est jamais visible. Cette opération le remplace et invalide les anciens jetons d’accès.</p>
            <label><span>VOTRE MOT DE PASSE ADMINISTRATEUR</span><input autoFocus required type={showPasswords ? 'text' : 'password'} autoComplete="current-password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} /></label>
            <label><span>NOUVEAU MOT DE PASSE DU JOUEUR</span><div className="admin-password-input"><input required minLength={8} type={showPasswords ? 'text' : 'password'} autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /><button type="button" onClick={() => { const generated = generatePassword(); setNewPassword(generated); setConfirmation(generated); setShowPasswords(true); }}>GÉNÉRER</button></div></label>
            <label><span>CONFIRMER LE NOUVEAU MOT DE PASSE</span><input required minLength={8} type={showPasswords ? 'text' : 'password'} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>
            <label className="admin-show-password"><input type="checkbox" checked={showPasswords} onChange={(event) => setShowPasswords(event.target.checked)} /><span>AFFICHER LES MOTS DE PASSE</span></label>
            {error && <div className="auth-error">{error}</div>}
            <footer><button type="button" onClick={() => setSelected(null)}>ANNULER</button><button className="danger" disabled={submitting}>{submitting ? 'MODIFICATION…' : 'CONFIRMER LE CHANGEMENT'}</button></footer>
          </form>
        </div>
      )}
    </main>
  );
}
