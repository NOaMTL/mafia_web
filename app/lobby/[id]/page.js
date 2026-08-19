'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api, getSession } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { getAvatarMap } from '@/lib/avatars';
import ConnectionBanner from '@/components/ConnectionBanner';
import BrandMark from '@/components/BrandMark';
import PageHeading from '@/components/PageHeading';
import RoleIcon from '@/components/RoleIcon';
import { ROLE_GUIDE, ROLE_DISTRIBUTIONS } from '@/lib/roleGuide';

export default function LobbyWait() {
  const router  = useRouter();
  const { id }  = useParams();
  const [session, setSession] = useState(null);
  const [lobby, setLobby]     = useState(null);
  const [ready, setReady]     = useState(false);
  const [error, setError]     = useState('');
  const [avatarMap, setAvatarMap] = useState({});
  const [copied, setCopied]   = useState(false);
  const [chatMsgs, setChatMsgs] = useState([]);
  const [chatText, setChatText] = useState('');
  const [sideTab, setSideTab]   = useState('roles');
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace('/'); return; }
    setSession(s);

    const socket = getSocket();
    socketRef.current = socket;

    getAvatarMap().then(setAvatarMap);

    const refresh = () => api.getLobby(id).then(setLobby).catch(() => {});

    // La jonction a réussi : on efface toute bannière d'erreur transitoire
    // (ex. un lobby:join parti avant la fin de l'authentification du socket).
    socket.on('lobby:joined',        (d) => { setLobby(d.lobby); setError(''); });
    socket.on('lobby:player_joined', refresh);
    socket.on('lobby:player_ready',  refresh);
    socket.on('lobby:bot_added',     refresh);
    socket.on('lobby:player_kicked', refresh);
    // Le joueur exclu est renvoyé à la liste des parties.
    socket.on('lobby:kicked', (d) => {
      alert(d?.message ?? 'Vous avez été exclu du salon.');
      router.replace('/lobby');
    });
    socket.on('lobby:chat_message',  (m) => setChatMsgs((p) => [...p.slice(-99), m]));
    socket.on('game:started',        (d) => router.push(`/game/${d.gameId}`));
    socket.on('error',               (d) => setError(d.message ?? 'Erreur'));

    // Un seul lobby:join par connexion : si le socket est déjà connecté on
    // émet tout de suite, sinon on attend 'connect' (émettre avant mettait le
    // message en file et il partait pendant l'authentification → erreur).
    const join = () => socket.emit('lobby:join', { lobbyId: id });
    socket.on('connect', join); // aussi les reconnexions
    if (socket.connected) join();
    refresh();

    return () => {
      ['lobby:joined', 'lobby:player_joined', 'lobby:player_ready',
       'lobby:bot_added', 'lobby:player_kicked', 'lobby:kicked',
       'lobby:chat_message', 'game:started', 'error',
      ].forEach((e) => socket.off(e));
      socket.off('connect', join);
    };
  }, [id, router]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMsgs.length, sideTab]);

  useEffect(() => {
    if (!lobby || !session) return;
    const me = (lobby.players ?? []).find((player) => player.userId === session.userId);
    if (me) setReady(Boolean(me.isReady));
  }, [lobby, session]);

  function sendChat(e) {
    e.preventDefault();
    const t = chatText.trim();
    if (!t) return;
    socketRef.current?.emit('lobby:chat', { lobbyId: id, message: t });
    setChatText('');
  }

  function toggleReady() {
    const next = !ready;
    setReady(next);
    socketRef.current?.emit('lobby:ready', { lobbyId: id, isReady: next });
  }

  function addBot() {
    socketRef.current?.emit('lobby:add_bot', { lobbyId: id });
  }

  function startNow() {
    socketRef.current?.emit('lobby:start', { lobbyId: id });
  }

  function kickPlayer(player) {
    const label = player.isBot ? `Retirer ${player.username} (bot) ?` : `Exclure ${player.username} du salon ?`;
    if (!window.confirm(label)) return;
    socketRef.current?.emit('lobby:kick', { lobbyId: id, userId: player.userId });
  }

  if (!session || !lobby) {
    return (
      <main className="screen-loading">
        <div className="ambiance ambiance-home on" />
        <BrandMark compact />
        <div className="loading-sigil"><span>LG</span></div>
        <div className="page-eyebrow">PRÉPARATION DE LA TABLE</div>
        <p>Ouverture de la salle d&apos;attente…</p>
      </main>
    );
  }

  const players = lobby.players ?? [];
  const previewCount = Math.max(4, Math.min(15, players.length));
  const rolePreview = ROLE_DISTRIBUTIONS[previewCount] ?? [];
  const readyCount = players.filter((player) => player.isReady).length;
  const groupedRoles = Object.values(rolePreview.reduce((groups, key) => {
    const data = ROLE_GUIDE.find((item) => item.key === key);
    if (!groups[key]) groups[key] = { ...data, key, count: 0 };
    groups[key].count += 1;
    return groups;
  }, {}));
  const mafiaRoles = groupedRoles.filter((item) => item.team === 'MAFIA');
  const townRoles = groupedRoles.filter((item) => item.team === 'TOWN');
  const maxPlayers = lobby.maxPlayers ?? 15;
  const freeSlots = Math.max(0, maxPlayers - players.length);
  const orderedPlayers = [...players].sort((a, b) => {
    if (a.userId === lobby.hostId) return -1;
    if (b.userId === lobby.hostId) return 1;
    if (a.isReady !== b.isReady) return Number(b.isReady) - Number(a.isReady);
    return a.username.localeCompare(b.username, 'fr');
  });

  return (
    <main className="page meta-page lobby-wait">
      <ConnectionBanner />
      <div className="ambiance ambiance-home on" />
      <div className="lobby-wait-nav">
        <BrandMark href="/lobby" compact />
        <button onClick={() => router.push('/lobby')}>QUITTER LA SALLE</button>
      </div>
      <PageHeading eyebrow="LA TABLE SE PRÉPARE" title="SALLE D’ATTENTE"
                   subtitle="Invitez les derniers joueurs et signalez-vous prêt." />
      <div className="lobby-code-block">
        <span>CODE D&apos;INVITATION</span>
        <strong
              title="Cliquer pour copier"
              onClick={() => {
                navigator.clipboard?.writeText(lobby.code);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}>
          {lobby.code}
        </strong>
        <small>{copied ? '✓ CODE COPIÉ' : 'CLIQUER POUR COPIER'}</small>
      </div>

      <section className="lobby-status-overview">
        <div><small>JOUEURS</small><strong>{players.length}<span>/{maxPlayers}</span></strong></div>
        <div><small>PRÊTS</small><strong>{readyCount}<span>/{players.length}</span></strong></div>
        <div className={players.length >= 4 ? 'ready' : ''}><small>ÉTAT DE LA TABLE</small><strong>{players.length >= 4 ? 'JOUABLE' : `${4 - players.length} MANQUANT${4 - players.length > 1 ? 'S' : ''}`}</strong></div>
      </section>

      <div className="lobby-wait-grid lobby-room-layout">
        <section className="card lobby-player-card lobby-player-list-card">
          <header className="lobby-card-heading">
            <div><small>TABLE DE JEU · PARTICIPANTS</small><h2>JOUEURS DE LA PARTIE</h2></div>
            <div className="lobby-heading-tools">
              <span>{readyCount}/{players.length} PRÊTS</span>
              {session.userId === lobby.hostId && players.length < maxPlayers && (
                <button className="lobby-addbot-top" onClick={addBot}>+ BOT</button>
              )}
            </div>
          </header>

          <div className="lobby-player-list">
            {orderedPlayers.map((player, index) => {
              const url = player.avatarId ? avatarMap[player.avatarId] : null;
              const isHost = player.userId === lobby.hostId;
              const isMe = player.userId === session.userId;
              return (
                <article key={player.userId} className={`lobby-player-row ${player.isReady ? 'is-ready' : ''} ${isHost ? 'is-host' : ''}`}>
                  <span className="lobby-player-index">{String(index + 1).padStart(2, '0')}</span>
                  <span className="lobby-player-avatar">
                    {url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={url} alt="" />
                      : (player.isBot ? '🤖' : (player.username?.[0]?.toUpperCase() ?? '?'))}
                  </span>
                  <span className="lobby-player-identity">
                    <strong>{player.username}</strong>
                    <small>{isHost ? 'ORGANISATEUR' : player.isBot ? 'JOUEUR AUTOMATIQUE' : 'INVITÉ'}</small>
                  </span>
                  <span className="lobby-player-badges">
                    {isMe && <b className="you">VOUS</b>}
                    {isHost && <b className="host">♛ HÔTE</b>}
                    {player.isBot && <b>BOT</b>}
                  </span>
                  <span className={`lobby-ready-state ${player.isReady ? 'ready' : ''}`}><i />{player.isReady ? 'PRÊT' : 'EN ATTENTE'}</span>
                  {session.userId === lobby.hostId && !isMe && (
                    <button className="lobby-kick-btn"
                            title={`Exclure ${player.username}`}
                            onClick={() => kickPlayer(player)}>✕</button>
                  )}
                </article>
              );
            })}
            {freeSlots > 0 && (
              <article className="lobby-player-row lobby-invite-row">
                <span className="lobby-player-index">＋</span>
                <span className="lobby-player-avatar">⌁</span>
                <span className="lobby-player-identity"><strong>INVITER DES JOUEURS</strong><small>{freeSlots} PLACE{freeSlots > 1 ? 'S' : ''} DISPONIBLE{freeSlots > 1 ? 'S' : ''}</small></span>
                <button onClick={() => { navigator.clipboard?.writeText(lobby.code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>{copied ? '✓ COPIÉ' : `COPIER ${lobby.code}`}</button>
              </article>
            )}
          </div>

          {error && <div className="error lobby-inline-error">{error}</div>}
          <div className="lobby-ready-actions">
            <button className={ready ? 'danger' : 'primary'} onClick={toggleReady}>
              {ready ? 'ANNULER — JE NE SUIS PLUS PRÊT' : '✓ JE SUIS PRÊT'}
            </button>
            {session.userId === lobby.hostId && (() => {
              const allReady = players.length >= 4 && readyCount === players.length;
              const hint = players.length < 4
                ? `Encore ${4 - players.length} joueur${4 - players.length > 1 ? 's' : ''} pour lancer`
                : allReady ? 'Tout le monde est prêt !'
                : `En attente de ${players.length - readyCount} joueur${players.length - readyCount > 1 ? 's' : ''}…`;
              return (
                <button className="lobby-launch-btn" disabled={!allReady}
                        onClick={startNow} title={hint}>
                  <strong>▶ LANCER LA PARTIE</strong>
                  <small>{hint}</small>
                </button>
              );
            })()}
          </div>
        </section>

        <aside className="card lobby-side-card">
          <div className="lobby-side-tabs" role="tablist" aria-label="Informations de la salle">
            <button role="tab" aria-selected={sideTab === 'roles'} className={sideTab === 'roles' ? 'active' : ''} onClick={() => setSideTab('roles')}><span>♟</span><b>RÔLES</b><small>{rolePreview.length}</small></button>
            <button role="tab" aria-selected={sideTab === 'discussion'} className={sideTab === 'discussion' ? 'active' : ''} onClick={() => setSideTab('discussion')}><span>💬</span><b>DISCUSSION</b><small>{chatMsgs.length}</small></button>
          </div>

          {sideTab === 'roles' ? (
            <div className="lobby-side-panel lobby-roles-tab" role="tabpanel">
              <header className="lobby-tab-heading"><div><small>ROLE-LIST ADAPTATIVE</small><h2>COMPOSITION PRÉVUE</h2><p>La liste évolue automatiquement avec les arrivées.</p></div><span>{players.length < 4 ? 'APERÇU 4' : previewCount}</span></header>
              <div className="lobby-role-groups">
                <div className="lobby-role-team mafia">
                  <div className="role-team-heading"><span>◆ MAFIA</span><b>{rolePreview.filter((key) => ROLE_GUIDE.find((role) => role.key === key)?.team === 'MAFIA').length}</b></div>
                  <div>{mafiaRoles.map((item) => <LobbyRoleCard key={item.key} role={item} />)}</div>
                </div>
                <div className="lobby-role-team town">
                  <div className="role-team-heading"><span>✦ VILLAGE</span><b>{rolePreview.filter((key) => ROLE_GUIDE.find((role) => role.key === key)?.team === 'TOWN').length}</b></div>
                  <div>{townRoles.map((item) => <LobbyRoleCard key={item.key} role={item} />)}</div>
                </div>
              </div>
              {players.length < 4 && <div className="composition-warning">Encore {4 - players.length} joueur{4 - players.length > 1 ? 's' : ''} requis. La composition affichée est un aperçu.</div>}
            </div>
          ) : (
            <div className="lobby-side-panel lobby-chat-card lobby-chat-tab" role="tabpanel">
              <header className="lobby-tab-heading"><div><small>CANAL DE LA SALLE</small><h2>DISCUSSION</h2><p>Organisez la partie avant le début de la nuit.</p></div><span>EN LIGNE</span></header>
              <div className="chat-messages">
                {chatMsgs.length === 0 && <div className="lobby-chat-empty"><span>💬</span><strong>LE CANAL EST OUVERT</strong><p>Écrivez le premier message.</p></div>}
                {chatMsgs.map((message, index) => (
                  <div key={index} className="chat-msg"><span className="author">{message.username}</span><div>{message.message}</div></div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <form className="chat-input" onSubmit={sendChat}>
                <input value={chatText} maxLength={300} placeholder="Votre message…" onChange={(event) => setChatText(event.target.value)} />
                <button type="submit" disabled={!chatText.trim()}>➤</button>
              </form>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

function LobbyRoleCard({ role }) {
  return (
    <article className="lobby-role-card" style={{ '--role-color': role.color }}>
      <RoleIcon roleKey={role.key} className="role-emoji" />
      <div><strong>{role.name}</strong><small>{role.nightAction ? 'ACTION NOCTURNE' : 'POUVOIR PASSIF'}</small></div>
      {role.count > 1 && <b className="role-quantity">×{role.count}</b>}
    </article>
  );
}
