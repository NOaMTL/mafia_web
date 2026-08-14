'use client';

import { useState, useRef, useEffect } from 'react';

const CHANNEL_LABELS = { day: 'Jour', mafia: 'Mafia', dead: 'Morts' };

/**
 * In-game chat with server-resolved channels.
 * The server decides where a message lands — the tabs here only filter
 * the local view. `available` controls which tabs are shown.
 */
export default function Chat({ messages, available, canWrite, onSend }) {
  const [tab, setTab]     = useState('day');
  const [text, setText]   = useState('');
  const bottomRef         = useRef(null);

  // If the active tab becomes unavailable (e.g. day → night), fall back.
  useEffect(() => {
    if (!available.includes(tab)) setTab(available[0] ?? 'day');
  }, [available, tab]);

  const visible = messages.filter((m) => m.channel === tab);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visible.length]);

  function submit(e) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText('');
  }

  return (
    <div className="chat card" style={{ padding: 14 }}>
      <div className="chat-tabs">
        {available.map((ch) => (
          <button key={ch}
                  className={`chat-tab ${ch} ${tab === ch ? 'active' : ''}`}
                  onClick={() => setTab(ch)}>
            {CHANNEL_LABELS[ch]}
          </button>
        ))}
      </div>

      <div className="chat-messages">
        {visible.length === 0 && (
          <div className="dim" style={{ fontStyle: 'italic', fontSize: 13 }}>
            Aucun message.
          </div>
        )}
        {visible.map((m, i) => (
          <div key={i} className={`chat-msg ${m.channel}`}>
            <span className="author">{m.username}</span>
            {m.isBot && <span className="bot-chip">BOT</span>}
            {m.ts && (
              <span className="time">
                {new Date(m.ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <div>{m.message}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input" onSubmit={submit}>
        <input value={text}
               maxLength={300}
               placeholder={canWrite ? 'Votre message…' : 'Chat fermé pour vous'}
               disabled={!canWrite}
               onChange={(e) => setText(e.target.value)} />
        <button type="submit" disabled={!canWrite || !text.trim()}>➤</button>
      </form>
    </div>
  );
}
