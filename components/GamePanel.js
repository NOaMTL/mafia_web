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
  MEDIUM: 'Médium',
};

const SUSPICIONS = ['?', 'TOWN', 'MAFIA', ...ROLE_GUIDE.map((role) => role.key)];

/**
 * DOSSIER D’ENQUÊTE — source unique pour les notes privées et les archives :
 *   Joueurs   — list + personal notes + role suspicion per player
 *   Testament — death note editor
 *   Journal   — chronological game log
 *   Rôles     — role guide, own role highlighted
 */
export default function GamePanel({
  open, onClose, players, myId, myRole, round,
  notes, onUpdateNote,
  will, setWill, onSaveWill, log,
}) {
  const [tab, setTab] = useState(0);
  const activeTab = Math.min(tab, 3);

  if (!open) return null;

  const alive = players.filter((p) => p.isAlive).length;

  return (
    <div className="panel-overlay dossier-overlay" onMouseDown={onClose}>
      <div className="panel investigation-dossier" onMouseDown={(event) => event.stopPropagation()}>
        {/* ── Header ── */}
        <div className="panel-header">
          <div>
            <div className="dossier-kicker">BUREAU DES INVESTIGATIONS · DOSSIER UNIQUE</div>
            <div className="dossier-title">📖 DOSSIER D’ENQUÊTE</div>
            <div className="dossier-meta">
              Tour {round} · {alive} joueurs en vie
            </div>
          </div>
          <button className="dossier-close" onClick={onClose}>FERMER <b>✕</b></button>
        </div>

        {/* ── Content ── */}
        <div className="panel-body">
          {activeTab === 0 && (
            <PlayersTab players={players} myId={myId} notes={notes} onUpdateNote={onUpdateNote} />
          )}
          {activeTab === 1 && <WillTab will={will} setWill={setWill} onSave={onSaveWill} />}
          {activeTab === 2 && <LogTab log={log} />}
          {activeTab === 3 && <RolesTab myRole={myRole} />}
        </div>

        {/* ── Bottom nav ── */}
        <div className="panel-nav">
          {['🕵️ JOUEURS', '📜 TESTAMENT', '🧾 CHRONOLOGIE', '📖 RÔLES'].map((label, i) => (
            <button key={i}
                    className={activeTab === i ? 'active' : ''}
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
      <div className="dossier-player-grid">
      {players.filter((p) => p.userId !== myId).map((p, index) => {
        const n = notes[p.userId] ?? {};
        const noteLines = String(n.text ?? '').split('\n').filter(Boolean);
        const automaticLines = noteLines.filter((line) => /^(Nuit|Jour) \d+ ·/.test(line));
        const manualText = noteLines.filter((line) => !/^(Nuit|Jour) \d+ ·/.test(line)).join('\n');
        return (
          <article key={p.userId} className={`dossier-player ${p.isAlive ? '' : 'dead'} suspicion-${String(n.suspicion ?? 'unknown').toLowerCase()}`}>
            <div className="dossier-player-head">
              <span className="dossier-player-number">{String(index + 1).padStart(2, '0')}</span>
              <div><strong>{p.isAlive ? '' : '💀 '}{p.username}{p.isBot ? ' 🤖' : ''}</strong><small>{p.isAlive ? 'DOSSIER ACTIF' : ROLE_LABELS[p.role] ?? 'ÉLIMINÉ'}</small></div>
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
                <span className="dossier-dead-role">{ROLE_LABELS[p.role] ?? ''}</span>
              )}
            </div>
            {p.isAlive && <div className="quick-suspicion">
              <button className={n.suspicion === '?' ? 'active' : ''} onClick={() => update(p.userId, { suspicion: '?' })}>INCONNU</button>
              <button className={n.suspicion === 'TOWN' ? 'active town' : 'town'} onClick={() => update(p.userId, { suspicion: 'TOWN' })}>TOWN</button>
              <button className={n.suspicion === 'MAFIA' ? 'active mafia' : 'mafia'} onClick={() => update(p.userId, { suspicion: 'MAFIA' })}>MAFIA</button>
            </div>}
            {automaticLines.length > 0 && (
              <div className="dossier-auto-log">
                <header><span>CHRONOLOGIE AUTOMATIQUE</span><b>{automaticLines.length}</b></header>
                {automaticLines.slice(-6).reverse().map((line, lineIndex) => {
                  const [when, detail] = line.split(' · ');
                  return <div key={`${line}-${lineIndex}`}><small>{when}</small><p>{detail ?? line}</p></div>;
                })}
              </div>
            )}
            <textarea className="dossier-note"
                   maxLength={2000}
                   placeholder="Ajoute tes déductions, contradictions et revendications…"
                   value={manualText}
                   onChange={(e) => update(p.userId, { text: [...automaticLines, e.target.value].filter(Boolean).join('\n') })} />
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
  const ownTeam = ROLE_GUIDE.find((role) => role.key === myRole)?.team ?? 'TOWN';
  const [team, setTeam] = useState(ownTeam);
  const visibleRoles = ROLE_GUIDE.filter((role) => role.team === team);

  return (
    <div className={`dossier-roles team-${team.toLowerCase()}`}>
      <header className="dossier-roles-header">
        <div><small>ARCHIVES DES RÔLES</small><h2>QUI PEUT SE CACHER DANS LA VILLE ?</h2></div>
        <span>{visibleRoles.length} RÔLES</span>
      </header>
      <div className="dossier-role-tabs" role="tablist" aria-label="Rôles par camp">
        <button role="tab" aria-selected={team === 'TOWN'} className={team === 'TOWN' ? 'active town' : 'town'} onClick={() => setTeam('TOWN')}>🏘️ TOWN <b>{ROLE_GUIDE.filter((role) => role.team === 'TOWN').length}</b></button>
        <button role="tab" aria-selected={team === 'MAFIA'} className={team === 'MAFIA' ? 'active mafia' : 'mafia'} onClick={() => setTeam('MAFIA')}>🔪 MAFIA <b>{ROLE_GUIDE.filter((role) => role.team === 'MAFIA').length}</b></button>
      </div>
      <div className="dossier-role-grid">
      {visibleRoles.map((r) => {
        const mine = myRole && r.key === myRole;
        return (
          <article key={r.key} className={`dossier-role-card ${mine ? 'mine' : ''}`} style={{ '--guide-color': r.color }}>
            <div className="dossier-role-card-head">
              <span>{r.emoji}</span>
              <div>
                <small>CAMP {r.team}</small>
                <h3>{r.name}</h3>
              </div>
              {mine && <b>VOTRE RÔLE</b>}
            </div>
            <p>{r.description}</p>
            {r.nightAction && <div className="dossier-role-power"><span>🌙 POUVOIR</span><strong>{r.nightAction}</strong></div>}
            <footer><span>💡</span>{r.tip}</footer>
          </article>
        );
      })}
      </div>
    </div>
  );
}
