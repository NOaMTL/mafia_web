'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, clearSession, getSession } from '@/lib/api';
import BrandMark from '@/components/BrandMark';
import NavHeader from '@/components/NavHeader';

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

const discordStateLabels = {
  unconfigured: 'Non configuré',
  stopped: 'Hors ligne',
  connecting: 'Connexion…',
  connected: 'En ligne',
  stopping: 'Arrêt…',
  error: 'Erreur',
};

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
  const [rolesConfig, setRolesConfig] = useState(null); // { roles, disabled }
  const [openGame, setOpenGame] = useState(null); // détail de partie (roster)
  const [discordStatus, setDiscordStatus] = useState(null);
  const [discordBusy, setDiscordBusy] = useState(false);
  const [discordError, setDiscordError] = useState('');
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
        api.adminGetRoles().then(setRolesConfig).catch(() => {});
        api.adminGetDiscord().then(setDiscordStatus).catch((requestError) => setDiscordError(requestError.message));
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

  async function toggleRole(key) {
    if (!rolesConfig) return;
    const disabled = rolesConfig.disabled.includes(key)
      ? rolesConfig.disabled.filter((r) => r !== key)
      : [...rolesConfig.disabled, key];
    setRolesConfig((current) => ({ ...current, disabled })); // optimiste
    try {
      const result = await api.adminSetRoles(disabled);
      setRolesConfig((current) => ({ ...current, disabled: result.disabled }));
      setNotice('Rôles mis à jour — appliqué aux prochaines parties.');
    } catch (requestError) {
      setError(requestError.message);
      api.adminGetRoles().then(setRolesConfig).catch(() => {});
    }
  }

  async function toggleDiscordGateway() {
    if (!discordStatus?.configured || discordBusy) return;
    setDiscordBusy(true);
    setDiscordError('');
    try {
      const result = discordStatus.connected
        ? await api.adminStopDiscord()
        : await api.adminStartDiscord();
      setDiscordStatus(result);
      setNotice(result.connected
        ? `Compagnon Discord connecté${result.bot?.tag ? ` sous ${result.bot.tag}` : ''}.`
        : `${result.restoredMics ?? 0} micro(s) rétabli(s). La Gateway Discord est arrêtée.`);
    } catch (requestError) {
      setDiscordError(requestError.message);
      api.adminGetDiscord().then(setDiscordStatus).catch(() => {});
    } finally {
      setDiscordBusy(false);
    }
  }

  async function refreshDiscordStatus() {
    setDiscordError('');
    try {
      setDiscordStatus(await api.adminGetDiscord());
    } catch (requestError) {
      setDiscordError(requestError.message);
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
    <main className="page meta-page admin-page admin-console-page">
      <div className="ambiance ambiance-home on" />
      <NavHeader session={session} />
      <header className="admin-console-header">
        <div>
          <span className="admin-console-kicker">Mafia / Administration</span>
          <h1>Console d’administration</h1>
          <p>Pilotez les services, les utilisateurs et les règles du jeu depuis un espace réservé.</p>
        </div>
        <div className="admin-console-session">
          <span><i /> Session sécurisée</span>
          <strong>{session.username}</strong>
          <small>Accès vérifié côté serveur</small>
        </div>
      </header>

      {notice && <div className="admin-notice" role="status"><span>✓</span>{notice}<button onClick={() => setNotice('')}>✕</button></div>}
      {error && !selected && <div className="meta-alert">{error}</div>}

      <div className="admin-dashboard-grid">
        <section className={`admin-discord-control ${discordStatus?.state ?? 'loading'}`}>
          <header>
            <div className="admin-discord-title">
              <span className="admin-discord-mark">D</span>
              <div>
                <small>Service temps réel</small>
                <h2>Compagnon Discord</h2>
              </div>
            </div>
            <span className={`admin-service-status ${discordStatus?.state ?? 'loading'}`}>
              <i /> {discordStateLabels[discordStatus?.state] ?? 'Chargement…'}
            </span>
          </header>

          <p className="admin-discord-summary">
            {discordStatus?.connected
              ? 'La Gateway est active. Les commandes, messages privés et actions vocales sont disponibles.'
              : 'Activez la Gateway uniquement pendant vos sessions de jeu afin de laisser Railway dormir le reste du temps.'}
          </p>

          <div className="admin-discord-metrics">
            <div><small>Bot</small><strong>{discordStatus?.bot?.tag ?? '—'}</strong></div>
            <div><small>Sessions</small><strong>{discordStatus?.activeSessions ?? 0}</strong></div>
            <div><small>Parties liées</small><strong>{discordStatus?.synchronizedGames ?? 0}</strong></div>
            <div><small>MP en attente</small><strong>{discordStatus?.queuedDms ?? 0}</strong></div>
          </div>

          <div className="admin-discord-config" aria-label="Configuration Discord">
            {[
              ['guild', 'Serveur'],
              ['voiceChannel', 'Vocal joueurs'],
              ['announcementChannel', 'Annonces'],
              ['spectatorChannel', 'Vocal morts'],
            ].map(([key, label]) => (
              <span className={discordStatus?.configuration?.[key] ? 'ready' : 'missing'} key={key}>
                {discordStatus?.configuration?.[key] ? '✓' : '!'} {label}
              </span>
            ))}
          </div>

          {discordStatus?.connectedAt && (
            <small className="admin-discord-connected-at">Connecté depuis le {formatDate(discordStatus.connectedAt)}</small>
          )}
          {discordError && <div className="admin-discord-error">{discordError}</div>}
          {!discordStatus?.configured && discordStatus && (
            <div className="admin-discord-error">Ajoutez DISCORD_BOT_TOKEN aux variables privées du backend.</div>
          )}

          <footer>
            <button type="button" className="admin-discord-refresh" onClick={refreshDiscordStatus} disabled={discordBusy}>
              Actualiser l’état
            </button>
            <button
              type="button"
              className={`admin-discord-toggle ${discordStatus?.connected ? 'stop' : 'start'}`}
              onClick={toggleDiscordGateway}
              disabled={!discordStatus?.configured || discordBusy || ['connecting', 'stopping'].includes(discordStatus?.state)}
            >
              {discordBusy
                ? 'Opération en cours…'
                : discordStatus?.connected
                  ? 'Désactiver Discord'
                  : 'Activer Discord'}
            </button>
          </footer>
        </section>

        <aside className="admin-metric-grid" aria-label="Indicateurs">
          <div><small>Comptes inscrits</small><strong>{total}</strong><span>Utilisateurs humains</span></div>
          <div><small>Parties affichées</small><strong>{pageStats.games}</strong><span>Page actuelle</span></div>
          <div><small>Victoires affichées</small><strong>{pageStats.wins}</strong><span>Page actuelle</span></div>
          <div><small>Diamants affichés</small><strong>{pageStats.diamonds}</strong><span>Économie visible</span></div>
        </aside>
      </div>

      <section className="admin-security-strip">
        <span>🔐</span><div><strong>Actions administratives protégées</strong><p>Les contrôles sensibles sont vérifiés par le backend et consignés dans les journaux du service.</p></div><b>ADMIN</b>
      </section>

      <section className="card admin-panel-card admin-users-card">
        <header className="admin-users-heading">
          <div><small>Utilisateurs</small><h2>Joueurs inscrits</h2><p>Recherchez un compte, consultez son activité ou réinitialisez son accès.</p></div>
          <form onSubmit={submitSearch} className="admin-search">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pseudo ou adresse e-mail" aria-label="Rechercher un utilisateur" />
            <button type="submit">Rechercher</button>
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
                <button className="admin-password-button" onClick={() => openPasswordModal(user)}><span>🔑</span> Mot de passe</button>
              </article>
            );
          })}
          {!loading && users.length === 0 && <div className="meta-empty"><strong>AUCUN COMPTE TROUVÉ</strong><p>Modifiez les termes de votre recherche.</p></div>}
        </div>

        <footer className="admin-pagination">
          <span>{total ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} sur ${total}` : '0 compte'}</span>
          <div><button disabled={page <= 1 || loading} onClick={() => changePage(page - 1)}>← Précédent</button><b>Page {page} / {totalPages}</b><button disabled={page >= totalPages || loading} onClick={() => changePage(page + 1)}>Suivant →</button></div>
        </footer>
      </section>

      {/* ── Rôles activables ── */}
      {rolesConfig && (
        <section className="card admin-panel-card admin-roles-card">
          <header className="admin-users-heading">
            <div>
              <small>Configuration du jeu</small>
              <h2>Rôles disponibles</h2>
              <p>Un rôle désactivé est remplacé par Citoyen (Ville) ou Mafioso (Mafia) dans les prochaines parties. Les rôles verrouillés garantissent l&apos;équilibre.</p>
            </div>
          </header>
          {['TOWN', 'MAFIA'].map((team) => (
            <div key={team} className="admin-roles-group">
              <label>{team === 'TOWN' ? '✦ VILLE' : '◆ MAFIA'}</label>
              <div className="admin-roles-chips">
                {rolesConfig.roles.filter((r) => r.team === team).map((r) => {
                  const off = rolesConfig.disabled.includes(r.key);
                  return (
                    <button key={r.key}
                            className={`admin-role-chip ${off ? 'off' : 'on'} ${r.locked ? 'locked' : ''}`}
                            disabled={r.locked}
                            title={r.locked ? 'Rôle essentiel — non désactivable' : off ? 'Cliquer pour réactiver' : 'Cliquer pour désactiver'}
                            onClick={() => toggleRole(r.key)}>
                      {off ? '✕ ' : '✓ '}{r.key}
                      {r.locked && ' 🔒'}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ── Historique des parties jouées ── */}
      <section className="card admin-panel-card admin-games-card">
        <header className="admin-users-heading">
          <div><small>Journal d’activité</small><h2>Parties jouées</h2><p>Les {games?.length ?? 0} dernières parties archivées, créateur du lobby inclus.</p></div>
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
            <span className="admin-game-open">Détail →</span>
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
