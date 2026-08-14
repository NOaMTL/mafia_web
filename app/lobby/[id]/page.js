'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api, getSession } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { getAvatarMap } from '@/lib/avatars';
import BrandMark from '@/components/BrandMark';
import PageHeading from '@/components/PageHeading';
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

    socket.on('lobby:joined',        (d) => setLobby(d.lobby));
    socket.on('lobby:player_joined', refresh);
    socket.on('lobby:player_ready',  refresh);
    socket.on('lobby:bot_added',     refresh);
    socket.on('lobby:chat_message',  (m) => setChatMsgs((p) => [...p.slice(-99), m]));
    socket.on('game:started',        (d) => router.push(`/game/${d.gameId}`));
    socket.on('error',               (d) => setError(d.message ?? 'Erreur'));

    const join = () => socket.emit('lobby:join', { lobbyId: id });
    socket.on('connect', join); // auto re-join on reconnection
    join();
    refresh();

    return () => {
      ['lobby:joined', 'lobby:player_joined', 'lobby:player_ready',
       'lobby:bot_added', 'lobby:chat_message', 'game:started', 'error',
      ].forEach((e) => socket.off(e));
      socket.off('connect', join);
    };
  }, [id, router]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMsgs.length]);

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
  const displayedSlots = Math.max(4, players.length);

  return (
    <main className="page meta-page lobby-wait">
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
        <div><small>JOUEURS</small><strong>{players.length}<span>/15</span></strong></div>
        <div><small>PRÊTS</small><strong>{readyCount}<span>/{players.length}</span></strong></div>
        <div className={players.length >= 4 ? 'ready' : ''}><small>ÉTAT DE LA TABLE</small><strong>{players.length >= 4 ? 'COMPLÈTE' : `${4 - players.length} MANQUANT${4 - players.length > 1 ? 'S' : ''}`}</strong></div>
      </section>

      <section className="card lobby-composition-card">
        <header>
          <div><small>ROLE-LIST ADAPTATIVE</small><h2>RÔLES DE CETTE PARTIE</h2><p>La composition s’ajuste automatiquement au nombre de joueurs présents.</p></div>
          <span className="composition-count">{players.length < 4 ? 'APERÇU 4 JOUEURS' : `${previewCount} JOUEURS`}</span>
        </header>
        <div className="lobby-role-groups">
          <div className="lobby-role-team mafia">
            <div className="role-team-heading"><span>◆ MAFIA</span><b>{rolePreview.filter((key) => ROLE_GUIDE.find((role) => role.key === key)?.team === 'MAFIA').length} rôle(s)</b></div>
            <div>{mafiaRoles.map((item) => <LobbyRoleCard key={item.key} role={item} />)}</div>
          </div>
          <div className="lobby-role-team town">
            <div className="role-team-heading"><span>✦ TOWN</span><b>{rolePreview.filter((key) => ROLE_GUIDE.find((role) => role.key === key)?.team === 'TOWN').length} rôle(s)</b></div>
            <div>{townRoles.map((item) => <LobbyRoleCard key={item.key} role={item} />)}</div>
          </div>
        </div>
        {players.length < 4 && <div className="composition-warning">Il faut encore {4 - players.length} joueur{4 - players.length > 1 ? 's' : ''}. Cette composition est un aperçu du minimum jouable.</div>}
      </section>

      <div className="lobby-wait-grid">
      <section className="card lobby-player-card">
        <header className="lobby-card-heading"><div><small>TABLE DE JEU</small><h2>JOUEURS</h2></div><span>{readyCount} PRÊT{readyCount > 1 ? 'S' : ''}</span></header>

        <div className="players-grid lobby-players-grid">
          {Array.from({ length: displayedSlots }, (_, index) => players[index] ?? null).map((p, index) => {
            if (!p) return <div key={`empty-${index}`} className="player-tile lobby-player-tile empty"><div className="avatar">+</div><div className="name">PLACE LIBRE</div><div className="sub">En attente d’un joueur</div></div>;
            const url = p.avatarId ? avatarMap[p.avatarId] : null;
            return (
              <div key={p.userId} className={`player-tile lobby-player-tile ${p.isReady ? 'is-ready' : ''}`}>
                <div className="avatar">
                  {url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={url} alt="" />
                    : (p.isBot ? '🤖' : (p.username?.[0]?.toUpperCase() ?? '?'))}
                </div>
                <div className="name">
                  {p.username}
                  {p.isBot && <span className="bot-chip">BOT</span>}
                </div>
                <div className="sub">
                  {p.isReady ? '● PRÊT' : '○ EN ATTENTE'}
                </div>
              </div>
            );
          })}
        </div>

        {error && <div className="error" style={{ marginBottom: 12 }}>{error}</div>}

        <div className="lobby-ready-actions">
          <button className={ready ? 'danger' : 'primary'} onClick={toggleReady}>
            {ready ? 'ANNULER — JE NE SUIS PLUS PRÊT' : '✓ JE SUIS PRÊT'}
          </button>
          <button onClick={addBot}>+ AJOUTER UN BOT</button>
        </div>
      </section>

      {/* ── Lobby chat ── */}
      <section className="card lobby-chat-card">
        <header className="lobby-card-heading"><div><small>CANAL DE LA SALLE</small><h2>DISCUSSION</h2></div><span>💬</span></header>
        <div className="chat-messages">
          {chatMsgs.length === 0 && (
            <div className="dim" style={{ fontStyle: 'italic', fontSize: 13 }}>
              Discutez en attendant les autres joueurs…
            </div>
          )}
          {chatMsgs.map((m, i) => (
            <div key={i} className="chat-msg">
              <span className="author">{m.username}</span>
              <div>{m.message}</div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <form className="chat-input" onSubmit={sendChat}>
          <input value={chatText} maxLength={300}
                 placeholder="Votre message…"
                 onChange={(e) => setChatText(e.target.value)} />
          <button type="submit" disabled={!chatText.trim()}>➤</button>
        </form>
      </section>
      </div>
    </main>
  );
}

function LobbyRoleCard({ role }) {
  return (
    <article className="lobby-role-card" style={{ '--role-color': role.color }}>
      <span className="role-emoji">{role.emoji}</span>
      <div><strong>{role.name}</strong><small>{role.nightAction ? 'ACTION NOCTURNE' : 'POUVOIR PASSIF'}</small></div>
      {role.count > 1 && <b className="role-quantity">×{role.count}</b>}
    </article>
  );
}
