'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getSession } from '@/lib/api';
import { getAvatarMap } from '@/lib/avatars';
import NavHeader from '@/components/NavHeader';
import PageHeading from '@/components/PageHeading';

function lobbyAge(createdAt) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000));
  if (minutes < 1) return 'OUVERT À L’INSTANT';
  if (minutes === 1) return 'OUVERT IL Y A 1 MIN';
  return `OUVERT IL Y A ${minutes} MIN`;
}

export default function LobbyHome() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');
  const [directoryError, setDirectoryError] = useState('');
  const [busy, setBusy] = useState('');
  const [createName, setCreateName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [publicLobbies, setPublicLobbies] = useState([]);
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [directoryUpdatedAt, setDirectoryUpdatedAt] = useState(null);
  const [avatarMap, setAvatarMap] = useState({});

  useEffect(() => {
    const current = getSession();
    if (!current) { router.replace('/'); return; }
    setSession(current);
    getAvatarMap().then(setAvatarMap);
  }, [router]);

  const refreshPublicLobbies = useCallback(async ({ silent = false } = {}) => {
    if (!session) return;
    if (!silent) setDirectoryLoading(true);
    try {
      const lobbies = await api.listPublicLobbies();
      setPublicLobbies(Array.isArray(lobbies) ? lobbies : []);
      setDirectoryError('');
      setDirectoryUpdatedAt(new Date());
    } catch (requestError) {
      if (!silent) setDirectoryError(requestError.message);
    } finally {
      if (!silent) setDirectoryLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!session) return undefined;
    refreshPublicLobbies();
    const timer = setInterval(() => refreshPublicLobbies({ silent: true }), 5_000);
    return () => clearInterval(timer);
  }, [session, refreshPublicLobbies]);

  async function createLobby(event) {
    event.preventDefault();
    setBusy('create');
    setError('');
    try {
      const lobby = await api.createLobby({
        name: createName.trim() || undefined,
        isPublic,
        maxPlayers,
      });
      router.push(`/lobby/${lobby.id}`);
    } catch (requestError) {
      setError(requestError.message);
      setBusy('');
    }
  }

  async function joinPublicLobby(lobbyId) {
    setBusy(`public:${lobbyId}`);
    setError('');
    try {
      const lobby = await api.joinPublicLobby(lobbyId);
      router.push(`/lobby/${lobby.id}`);
    } catch (requestError) {
      setError(requestError.message);
      setBusy('');
      refreshPublicLobbies({ silent: true });
    }
  }

  if (!session) return null;

  return (
    <main className="page meta-page lobby-home lobby-browser-page">
      <div className="ambiance ambiance-home on" />
      <NavHeader session={session} />

      <PageHeading
        eyebrow="TROUVEZ VOTRE PROCHAINE TABLE"
        title="ENTREZ DANS LA VILLE"
        subtitle="Parcourez les tables ouvertes ou créez votre propre salon."
      />

      {error && <div className="meta-alert lobby-global-alert">{error}</div>}

      <div className="lobby-directory-layout">
        <section className="public-lobby-browser" aria-labelledby="public-lobbies-title">
          <header className="public-lobby-browser-heading">
            <div>
              <small>TABLES OUVERTES · CONNEXION DIRECTE</small>
              <h2 id="public-lobbies-title">SALONS PUBLICS</h2>
              <p>Choisissez une table : votre place est réservée dès que vous la rejoignez.</p>
            </div>
            <div className="public-browser-status">
              <span><i /> ACTUALISATION AUTO · 5S</span>
              <button type="button" disabled={directoryLoading} onClick={() => refreshPublicLobbies()}>
                ↻ ACTUALISER
              </button>
            </div>
          </header>

          {directoryError && <div className="public-lobby-error">⚠ {directoryError}</div>}

          {directoryLoading ? (
            <div className="public-lobby-loading"><i /><span>RECHERCHE DES TABLES OUVERTES…</span></div>
          ) : publicLobbies.length === 0 ? (
            <div className="public-lobby-empty">
              <span>◎</span><h3>AUCUNE TABLE PUBLIQUE POUR LE MOMENT</h3>
              <p>Ouvrez la première table ou revenez dans quelques instants.</p>
              <button type="button" onClick={() => refreshPublicLobbies()}>RECHERCHER À NOUVEAU</button>
            </div>
          ) : (
            <div className="public-lobby-grid">
              {publicLobbies.map((lobby, index) => {
                const avatarUrl = lobby.hostAvatarId ? avatarMap[lobby.hostAvatarId] : null;
                const occupancy = Math.round((lobby.playerCount / lobby.maxPlayers) * 100);
                const joining = busy === `public:${lobby.id}`;
                return (
                  <article className="public-lobby-card" key={lobby.id}>
                    <div className="public-lobby-index">{String(index + 1).padStart(2, '0')}</div>
                    <div className="public-lobby-card-topline"><span><i /> SALON PUBLIC</span><time>{lobbyAge(lobby.createdAt)}</time></div>
                    <h3>{lobby.name}</h3>
                    <div className="public-lobby-host">
                      <span>{avatarUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={avatarUrl} alt="" />
                        : lobby.hostUsername?.[0]?.toUpperCase() ?? '?'}
                      </span>
                      <div><small>HÔTE DE LA TABLE</small><strong>{lobby.hostUsername}</strong></div>
                    </div>
                    <div className="public-lobby-occupancy">
                      <div><span>JOUEURS</span><strong>{lobby.playerCount}<small>/{lobby.maxPlayers}</small></strong></div>
                      <div><span>HUMAINS</span><strong>{lobby.humanCount}</strong></div>
                      <div><span>BOTS</span><strong>{lobby.botCount}</strong></div>
                    </div>
                    <div className="public-lobby-meter" aria-label={`${lobby.playerCount} joueurs sur ${lobby.maxPlayers}`}><span style={{ width: `${occupancy}%` }} /></div>
                    <button type="button" disabled={Boolean(busy)} onClick={() => joinPublicLobby(lobby.id)}>
                      <span>{joining ? 'CONNEXION…' : 'REJOINDRE LA TABLE'}</span><b>→</b>
                    </button>
                  </article>
                );
              })}
            </div>
          )}
          <footer>
            <span>{publicLobbies.length} SALON{publicLobbies.length > 1 ? 'S' : ''} DISPONIBLE{publicLobbies.length > 1 ? 'S' : ''}</span>
            <small>{directoryUpdatedAt ? `DERNIÈRE MISE À JOUR · ${directoryUpdatedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'CONNEXION AU REGISTRE…'}</small>
          </footer>
        </section>

        <aside className="lobby-create-sidebar" aria-label="Créer une table">
          <section className="choice-card choice-create lobby-create-card">
            <div className="choice-number">01</div>
            <div className="choice-icon">＋</div>
            <h2>CRÉER UNE TABLE</h2>
            <p>Choisissez qui peut découvrir votre salon avant d’ouvrir les portes.</p>
            <form className="lobby-create-form" onSubmit={createLobby}>
              <label>
                <span>NOM DE LA TABLE <small>OPTIONNEL</small></span>
                <input
                  value={createName}
                  maxLength={40}
                  placeholder={`Table de ${session.username}`}
                  onChange={(event) => setCreateName(event.target.value)}
                />
              </label>
              <div className="lobby-visibility-picker" role="group" aria-label="Visibilité du salon">
                <button type="button" className={isPublic ? 'active' : ''} onClick={() => setIsPublic(true)}>
                  <span>◎</span><b>PUBLIC</b><small>Visible et rejoignable</small>
                </button>
                <button type="button" className={!isPublic ? 'active private' : ''} onClick={() => setIsPublic(false)}>
                  <span>⌁</span><b>PRIVÉ</b><small>Réservé aux invités</small>
                </button>
              </div>
              <label className="lobby-capacity-field">
                <span>CAPACITÉ</span>
                <select value={maxPlayers} onChange={(event) => setMaxPlayers(Number(event.target.value))}>
                  {Array.from({ length: 12 }, (_, index) => index + 4).map((count) => (
                    <option key={count} value={count}>{count} joueurs</option>
                  ))}
                </select>
              </label>
              <button className="btn-gold lobby-create-submit" disabled={Boolean(busy)} type="submit">
                <span>{isPublic ? 'OUVRIR UN SALON PUBLIC' : 'CRÉER UN SALON PRIVÉ'}</span><b>→</b>
              </button>
            </form>
          </section>
        </aside>
      </div>

      <div className="lobby-footnote"><span /> 4 à 15 joueurs · salons publics ou privés · modération par l’hôte <span /></div>
    </main>
  );
}
