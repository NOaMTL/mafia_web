'use client';

import { useState, useRef, useEffect } from 'react';

const CHANNEL_LABELS = {
  day:   '# VILLE',
  mafia: '# MAFIA',
  dead:  '# MORTS',
  sys:   '# SYSTÈME',
};

/**
 * In-game chat with server-resolved channels + a local #SYSTÈME feed
 * (the chronological game log). `available` controls the visible tabs.
 */
export default function Chat({ messages, available, canWrite, onSend, log = [], writableTabs = null }) {
  const [tab, setTab]   = useState('day');
  const [text, setText] = useState('');
  const bottomRef       = useRef(null);
  const mafiaWasAvailable = useRef(false);
  const deadWasAvailable = useRef(false);

  const tabs = [...available, 'sys'];

  useEffect(() => {
    if (!tabs.includes(tab)) setTab(available[0] ?? 'day');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [available.join(','), tab]);

  useEffect(() => {
    const mafiaAvailable = available.includes('mafia');
    if (mafiaAvailable && !mafiaWasAvailable.current) setTab('mafia');
    mafiaWasAvailable.current = mafiaAvailable;
  }, [available]);

  useEffect(() => {
    const deadAvailable = available.includes('dead');
    if (deadAvailable && !deadWasAvailable.current) setTab('dead');
    deadWasAvailable.current = deadAvailable;
  }, [available]);

  const visible = tab === 'sys' ? [] : messages.filter((m) => m.channel === tab);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visible.length, tab, log.length]);

  function submit(e) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    onSend(t, tab);
    setText('');
  }

  const tabWritable = writableTabs ? writableTabs.includes(tab) : canWrite;

  return (
    <div className="chat panel-card" style={{ flex: 1, minHeight: 0 }}>
      <div className="chat-header">
        <span>CHAT</span>
        <small className={tab === 'mafia' ? 'private-channel' : ''}>
          {tab === 'mafia'
            ? 'CANAL MAFIA · PRIVÉ'
            : tab === 'dead'
              ? 'MONDE DES MORTS · SÉANCE'
              : tabWritable ? 'CANAL OUVERT' : 'LECTURE SEULE'}
        </small>
      </div>
      <div className="chat-tabs">
        {tabs.map((ch) => (
          <button key={ch}
                  className={`chat-tab ${ch} ${tab === ch ? 'active' : ''}`}
                  onClick={() => setTab(ch)}>
            {CHANNEL_LABELS[ch]}
          </button>
        ))}
      </div>

      <div className="chat-messages">
        {tab === 'sys' ? (
          log.length === 0
            ? <div className="dim" style={{ fontStyle: 'italic', fontSize: 13 }}>Aucun événement.</div>
            : log.map((e, i) => (
                <div key={i} className="chat-msg" style={{ color: 'var(--text-dim)' }}>
                  {e.icon} {e.text}
                  <span className="time">T{e.round}</span>
                </div>
              ))
        ) : (
          <>
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
          </>
        )}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input" onSubmit={submit}>
        <input value={text}
               maxLength={300}
               placeholder={tabWritable ? 'Écrire un message…' : 'Lecture seule sur ce canal'}
               disabled={!tabWritable || tab === 'sys'}
               onChange={(e) => setText(e.target.value)} />
        <button type="submit" disabled={!tabWritable || tab === 'sys' || !text.trim()}>➤</button>
      </form>
    </div>
  );
}
