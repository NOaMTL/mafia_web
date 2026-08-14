'use client';

import { useState } from 'react';
import { ROLE_GUIDE } from '@/lib/roleGuide';

const ROLE_LABELS = {
  CITIZEN: 'Citoyen', MAFIOSO: 'Mafioso', SHERIFF: 'Shérif', DETECTIVE: 'Détective',
  INVESTIGATOR: 'Enquêteur', DOCTOR: 'Médecin', VIGILANTE: 'Vigilante',
  GODFATHER: 'Parrain', ESCORT: 'Escorte', CONSIGLIERE: 'Consigliere',
  BLACKMAILER: 'Maître chanteur', JANITOR: 'Janitor', FRAMER: 'Framer',
  LOOKOUT: 'Guetteur', BODYGUARD: 'Garde du corps', CONSORT: 'Consort', MAYOR: 'Maire',
  BUS_DRIVER: 'Chauffeur de bus', VETERAN: 'Vétéran', SPY: 'Espion',
};

const SUSPICIONS = ['?', 'TOWN', 'MAFIA', ...ROLE_GUIDE.map((role) => role.key)];
const EVIDENCE_LABELS = { SUSPICION: 'Soupçon', CLAIM: 'Rôle revendiqué', OBSERVATION: 'Observation' };

/**
 * DOSSIER DE PARTIE — fullscreen drawer, 4 tabs (parity with Flutter):
 *   Joueurs   — list + personal notes + role suspicion per player
 *   Testament — death note editor
 *   Journal   — chronological game log
 *   Rôles     — role guide, own role highlighted
 */
export default function GamePanel({
  open, onClose, players, myId, myRole, round,
  notes, onUpdateNote, evidence, onAddEvidence, onRemoveEvidence, canPublishEvidence,
  will, setWill, onSaveWill, log,
}) {
  const [tab, setTab] = useState(0);

  if (!open) return null;

  const alive = players.filter((p) => p.isAlive).length;

  return (
    <div className="panel-overlay">
      <div className="panel">
        {/* ── Header ── */}
        <div className="panel-header">
          <div>
            <div className="cinzel" style={{ color: 'var(--gold)', fontSize: 13, letterSpacing: 3 }}>
              📖 DOSSIER DE PARTIE
            </div>
            <div className="dim" style={{ fontSize: 12, fontStyle: 'italic' }}>
              Tour {round} · {alive} joueurs en vie
            </div>
          </div>
          <button style={{ border: 'none', fontSize: 18, padding: '4px 10px' }} onClick={onClose}>✕</button>
        </div>

        {/* ── Content ── */}
        <div className="panel-body">
          {tab === 0 && (
            <PlayersTab players={players} myId={myId} notes={notes} onUpdateNote={onUpdateNote} />
          )}
          {tab === 1 && (
            <EvidenceTab
              players={players} myId={myId} items={evidence}
              onAdd={onAddEvidence} onRemove={onRemoveEvidence}
              canPublish={canPublishEvidence}
            />
          )}
          {tab === 2 && <WillTab will={will} setWill={setWill} onSave={onSaveWill} />}
          {tab === 3 && <LogTab log={log} />}
          {tab === 4 && <RolesTab myRole={myRole} />}
        </div>

        {/* ── Bottom nav ── */}
        <div className="panel-nav">
          {['🕵️ CARNET', '🧷 PREUVES', '📜 TESTAMENT', '🧾 JOURNAL', '📖 RÔLES'].map((label, i) => (
            <button key={i}
                    className={tab === i ? 'active' : ''}
                    onClick={() => setTab(i)}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: players + notes + suspicion ─────────────────────────────────────────

function PlayersTab({ players, myId, notes, onUpdateNote }) {
  function update(userId, patch) {
    onUpdateNote(userId, { ...(notes[userId] ?? {}), ...patch });
  }

  return (
    <div>
      {players.filter((p) => p.userId !== myId).map((p) => {
        const n = notes[p.userId] ?? {};
        return (
          <div key={p.userId} className="card"
               style={{ padding: 12, marginBottom: 10, opacity: p.isAlive ? 1 : 0.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="cinzel" style={{ fontSize: 13 }}>
                {p.isAlive ? '' : '💀 '}{p.username}{p.isBot ? ' 🤖' : ''}
              </span>
              {p.isAlive ? (
                <select value={n.suspicion ?? '?'}
                        onChange={(e) => update(p.userId, { suspicion: e.target.value })}>
                  {SUSPICIONS.map((s) => (
                    <option key={s} value={s}>
                      {s === '?' ? 'Rôle ?' : s === 'TOWN' ? 'Camp Town' : s === 'MAFIA' ? 'Camp Mafia' : ROLE_LABELS[s]}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="dim" style={{ fontSize: 12 }}>
                  {ROLE_LABELS[p.role] ?? ''}
                </span>
              )}
            </div>
            <input style={{ marginTop: 8, fontSize: 13, padding: '7px 10px' }}
                   placeholder="Note personnelle…"
                   value={n.text ?? ''}
                   onChange={(e) => update(p.userId, { text: e.target.value })} />
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab: shared evidence board ──────────────────────────────────────────────

function EvidenceTab({ players, myId, items, onAdd, onRemove, canPublish }) {
  const [subjectId, setSubjectId] = useState(players.find((p) => p.userId !== myId)?.userId ?? '');
  const [type, setType] = useState('SUSPICION');
  const [text, setText] = useState('');

  function publish() {
    if (!subjectId || !text.trim()) return;
    onAdd({ subjectId, type, text: text.trim() });
    setText('');
  }

  const byNewest = [...(items ?? [])].sort((a, b) => b.createdAt - a.createdAt);
  return (
    <div className="evidence-board">
      <div className="evidence-intro">
        <span>TABLEAU COLLECTIF</span>
        <p>Ces éléments sont publics. La Mafia peut mentir autant que le Village peut se tromper.</p>
      </div>

      {canPublish && (
        <div className="evidence-composer">
          <div className="evidence-fields">
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              {players.filter((p) => p.userId !== myId).map((p) => (
                <option key={p.userId} value={p.userId}>{p.username}</option>
              ))}
            </select>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {Object.entries(EVIDENCE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </div>
          <textarea
            value={text}
            maxLength={240}
            placeholder="Décrivez un vote étrange, une contradiction ou un rôle revendiqué…"
            onChange={(e) => setText(e.target.value)}
          />
          <button className="primary" disabled={!text.trim()} onClick={publish}>ÉPINGLER LA PREUVE</button>
        </div>
      )}

      <div className="evidence-list">
        {byNewest.length === 0 && <p className="dim">Le tableau est encore vide.</p>}
        {byNewest.map((item) => {
          const subject = players.find((p) => p.userId === item.subjectId);
          return (
            <article key={item.id} className={`evidence-note type-${item.type.toLowerCase()}`}>
              <div className="evidence-note-head">
                <span>{EVIDENCE_LABELS[item.type]}</span><small>TOUR {item.round}</small>
              </div>
              <strong>{subject?.username ?? 'Joueur inconnu'}</strong>
              <p>{item.text}</p>
              <footer>Épinglé par {item.authorUsername}
                {item.authorId === myId && <button onClick={() => onRemove(item.id)}>RETIRER</button>}
              </footer>
            </article>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab: will ────────────────────────────────────────────────────────────────

function WillTab({ will, setWill, onSave }) {
  return (
    <div className="will-editor">
      <p className="dim" style={{ fontStyle: 'italic', fontSize: 14, marginBottom: 12 }}>
        Vos derniers mots — révélés au village à votre mort. Choisissez-les bien.
      </p>
      <textarea value={will} maxLength={280} style={{ minHeight: 140 }}
                placeholder="« Si vous lisez ceci, j'avais raison depuis le début… »"
                onChange={(e) => setWill(e.target.value)} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
        <span className="dim" style={{ fontSize: 12 }}>{will.length}/280</span>
        <button className="primary" style={{ fontSize: 12 }} onClick={onSave}>ENREGISTRER</button>
      </div>
    </div>
  );
}

// ─── Tab: log ─────────────────────────────────────────────────────────────────

function LogTab({ log }) {
  if (log.length === 0) {
    return <p className="dim" style={{ fontStyle: 'italic' }}>Aucun événement pour l&apos;instant.</p>;
  }
  return (
    <div>
      {log.map((entry, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0',
                              borderBottom: '1px solid var(--line)', fontSize: 14 }}>
          <span style={{ minWidth: 20 }}>{entry.icon}</span>
          <span style={{ flex: 1 }}>{entry.text}</span>
          <span className="dim" style={{ fontSize: 11 }}>T{entry.round}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: roles guide ─────────────────────────────────────────────────────────

function RolesTab({ myRole }) {
  return (
    <div>
      {ROLE_GUIDE.map((r) => {
        const mine = myRole && r.key === myRole;
        return (
          <div key={r.key} className="card"
               style={{
                 padding: 14, marginBottom: 10,
                 borderColor: mine ? r.color : undefined,
                 background: mine ? `${r.color}14` : undefined,
               }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>{r.emoji}</span>
              <div>
                <span className="cinzel" style={{ color: r.color, fontSize: 14, fontWeight: 700 }}>
                  {r.name}
                </span>
                {mine && (
                  <span className="cinzel"
                        style={{ marginLeft: 8, fontSize: 9, color: r.color,
                                 border: `1px solid ${r.color}`, borderRadius: 5,
                                 padding: '2px 6px', letterSpacing: 1 }}>
                    VOUS
                  </span>
                )}
                <div className="dim" style={{ fontSize: 10, letterSpacing: 1.5 }}>
                  CAMP {r.team}
                </div>
              </div>
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.45 }}>
              {r.description}
            </p>
            {r.nightAction && (
              <p style={{ fontSize: 13, color: r.color, fontStyle: 'italic', marginTop: 6 }}>
                🌙 {r.nightAction}
              </p>
            )}
            <p style={{ fontSize: 12.5, color: 'var(--gold)', fontStyle: 'italic', marginTop: 6 }}>
              💡 {r.tip}
            </p>
          </div>
        );
      })}
    </div>
  );
}
