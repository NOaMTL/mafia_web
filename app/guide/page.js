'use client';

import { useState, useEffect } from 'react';
import { getSession } from '@/lib/api';
import { ROLE_GUIDE, PHASE_GUIDE, ROLE_DISTRIBUTIONS, ROLE_MECHANICS, WIN_CONDITIONS } from '@/lib/roleGuide';
import NavHeader from '@/components/NavHeader';
import PageHeading from '@/components/PageHeading';

export default function GuidePage() {
  const [session, setSession] = useState(null);
  const [tab, setTab]         = useState(0);
  const [openRole, setOpenRole] = useState(null); // rôle détaillé (modale)

  useEffect(() => {
    setSession(getSession());
  }, []);

  // Fermeture au clavier (Échap).
  useEffect(() => {
    if (!openRole) return;
    const onKey = (e) => e.key === 'Escape' && setOpenRole(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openRole]);

  return (
    <main className="page meta-page guide-page">
      <div className="ambiance ambiance-home on" />
      <NavHeader session={session} />

      <PageHeading eyebrow="APPRENEZ LES RÈGLES DE LA NUIT" title="GUIDE DU JEU"
                   subtitle="Connaître chaque rôle ne garantit pas la victoire. Mais cela aide à reconnaître un mensonge." />

      <div className="meta-tabs">
        <button className={tab === 0 ? 'active' : ''} onClick={() => setTab(0)}>LES RÔLES</button>
        <button className={tab === 1 ? 'active' : ''} onClick={() => setTab(1)}>DÉROULEMENT D&apos;UNE PARTIE</button>
        <button className={tab === 2 ? 'active' : ''} onClick={() => setTab(2)}>RÉPARTITION</button>
      </div>

      {tab === 0 && (
        <>
          {[
            { team: 'TOWN',  label: '✦ LA VILLE',  sub: 'Trouver et éliminer la Mafia avant qu’elle ne prenne la ville.' },
            { team: 'MAFIA', label: '◆ LA MAFIA',  sub: 'Éliminer les innocents dans l’ombre et semer le doute le jour.' },
          ].map((group) => (
            <section key={group.team} className={`guide-team-section ${group.team.toLowerCase()}`}>
              <header className="guide-team-header">
                <h2>{group.label}</h2>
                <span>{ROLE_GUIDE.filter((r) => r.team === group.team).length} RÔLES</span>
                <p>{group.sub}</p>
              </header>
              <div className="role-guide-grid">
                {ROLE_GUIDE.filter((r) => r.team === group.team).map((r) => (
                  <article key={r.key} className="role-guide-card clickable" style={{ '--role-color': r.color }}
                           role="button" tabIndex={0}
                           title="Voir les mécaniques détaillées"
                           onClick={() => setOpenRole(r)}
                           onKeyDown={(e) => e.key === 'Enter' && setOpenRole(r)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <span className="role-guide-icon">{r.emoji}</span>
                      <div>
                        <h2>{r.name}</h2>
                        <div className="role-team-label">CAMP {r.team}</div>
                      </div>
                    </div>
                    <p>{r.description}</p>
                    {r.nightAction && <div className="role-detail">NUIT · {r.nightAction}</div>}
                    <div className="role-tip">CONSEIL · {r.tip}</div>
                    <div className="role-more">MÉCANIQUES DÉTAILLÉES →</div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </>
      )}

      {/* ── Modale : mécaniques détaillées du rôle ── */}
      {openRole && (
        <div className="role-modal-backdrop" onClick={() => setOpenRole(null)}>
          <div className="role-modal" style={{ '--role-color': openRole.color }}
               onClick={(e) => e.stopPropagation()}>
            <header>
              <span className="role-guide-icon big">{openRole.emoji}</span>
              <div>
                <h2>{openRole.name}</h2>
                <div className="role-team-label">CAMP {openRole.team}</div>
              </div>
              <button className="role-modal-close" aria-label="Fermer"
                      onClick={() => setOpenRole(null)}>✕</button>
            </header>
            <p className="role-modal-desc">{openRole.description}</p>
            {openRole.nightAction && <div className="role-detail">NUIT · {openRole.nightAction}</div>}
            <div className="role-facts">
              {(ROLE_MECHANICS[openRole.key] ?? []).map((f, i) => (
                <div key={i} className="role-fact">
                  <span className="role-fact-icon">{f.icon}</span>
                  <div>
                    <div className="role-fact-title">{f.title}</div>
                    <div className="role-fact-text">{f.text}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="role-tip">CONSEIL · {openRole.tip}</div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div className="phase-timeline">
          {PHASE_GUIDE.map((p, i) => (
            <div key={i} className={`phase-step ${p.tone}`}>
              <div className="phase-step-rail">
                <div className="phase-step-badge">{p.emoji}</div>
                {i < PHASE_GUIDE.length - 1 && <div className="phase-step-line" />}
              </div>
              <div className="phase-step-body">
                <div className="phase-step-head">
                  <span className="phase-step-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="phase-step-name cinzel">{p.name}</span>
                  <span className={`phase-step-tone ${p.tone}`}>{p.tone === 'night' ? '🌙 NUIT' : '☀️ JOUR'}</span>
                </div>
                <p className="phase-step-desc">{p.description}</p>
                {p.tip && <div className="phase-step-tip">💡 {p.tip}</div>}
              </div>
            </div>
          ))}

          <div className="phase-loop-note">
            ↻ Le cycle <strong>Nuit → Jour</strong> se répète jusqu&apos;à ce qu&apos;un camp l&apos;emporte.
          </div>

          <div className="win-conditions">
            {WIN_CONDITIONS.map((w) => (
              <div key={w.team} className={`win-card ${w.team.toLowerCase()}`}>
                <div className="win-card-title">{w.emoji} {w.title}</div>
                <p>{w.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 2 && (
        <div className="distribution-table">
          <div className="distribution-intro">
            <span>COMPOSITIONS ÉQUILIBRÉES</span>
            <p>Chaque taille possède sa propre composition : un tueur Mafia garanti, un duo Détective–Médecin et une montée progressive des rôles complexes.</p>
          </div>
          {Object.entries(ROLE_DISTRIBUTIONS).map(([count, roles]) => {
            const mafia = roles.filter((key) => ROLE_GUIDE.find((r) => r.key === key)?.team === 'MAFIA');
            const town = roles.filter((key) => !mafia.includes(key));
            const renderRole = (key, index) => {
              const role = ROLE_GUIDE.find((r) => r.key === key);
              return <span key={`${key}-${index}`} className={`distribution-role ${role?.team?.toLowerCase()}`}>{role?.emoji} {role?.name ?? key}</span>;
            };
            return (
              <div key={count} className="distribution-row">
                <strong>{count}<small>JOUEURS</small></strong>
                <div><label>MAFIA · {mafia.length}</label><section>{mafia.map(renderRole)}</section></div>
                <div><label>TOWN · {town.length}</label><section>{town.map(renderRole)}</section></div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
