'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api, getSession } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { getAvatarMap } from '@/lib/avatars';

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
    return <div className="page dim" style={{ textAlign: 'center', paddingTop: 100 }}>Chargement…</div>;
  }

  const players = lobby.players ?? [];

  return (
    <div className="page" style={{ maxWidth: 560 }}>
      <div className="ambiance ambiance-home on" />
      <h1 className="title-gold" style={{ fontSize: 22, textAlign: 'center', marginBottom: 8 }}>
        SALLE D&apos;ATTENTE
      </h1>
      <p style={{ textAlign: 'center', marginBottom: 24 }}>
        <span className="dim">Code : </span>
        <span className="cinzel"
              title="Cliquer pour copier"
              style={{ color: 'var(--gold-hi)', fontSize: 22, letterSpacing: 6, cursor: 'pointer' }}
              onClick={() => {
                navigator.clipboard?.writeText(lobby.code);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}>
          {lobby.code}
        </span>
        {copied && <span style={{ color: 'var(--green)', fontSize: 13, marginLeft: 10 }}>✓ copié</span>}
      </p>

      <div className="card">
        <p className="dim" style={{ fontSize: 13, marginBottom: 14 }}>
          {players.length} joueur{players.length > 1 ? 's' : ''} — minimum 4, tous prêts pour lancer
        </p>

        <div className="players-grid" style={{ marginBottom: 20 }}>
          {players.map((p) => {
            const url = p.avatarId ? avatarMap[p.avatarId] : null;
            return (
              <div key={p.userId} className="player-tile">
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
                <div className="sub" style={{ color: p.isReady ? 'var(--green)' : undefined }}>
                  {p.isReady ? '✓ Prêt' : 'En attente'}
                </div>
              </div>
            );
          })}
        </div>

        {error && <div className="error" style={{ marginBottom: 12 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button className={ready ? 'danger' : 'primary'} style={{ flex: 1 }} onClick={toggleReady}>
            {ready ? 'PAS PRÊT' : 'PRÊT'}
          </button>
          <button onClick={addBot}>+ BOT</button>
        </div>
      </div>

      {/* ── Lobby chat ── */}
      <div className="card" style={{ marginTop: 16, padding: 14 }}>
        <div className="cinzel" style={{ fontSize: 11, letterSpacing: 2,
                                         color: 'var(--gold)', marginBottom: 8 }}>
          💬 DISCUSSION
        </div>
        <div className="chat-messages" style={{ height: 160 }}>
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
      </div>
    </div>
  );
}
