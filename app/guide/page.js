'use client';

import { useState, useEffect } from 'react';
import { getSession } from '@/lib/api';
import { ROLE_GUIDE, PHASE_GUIDE, ROLE_DISTRIBUTIONS } from '@/lib/roleGuide';
import NavHeader from '@/components/NavHeader';
import PageHeading from '@/components/PageHeading';

export default function GuidePage() {
  const [session, setSession] = useState(null);
  const [tab, setTab]         = useState(0);

  useEffect(() => {
    setSession(getSession());
  }, []);

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

      {tab === 0 && <div className="role-guide-grid">{ROLE_GUIDE.map((r) => (
        <article key={r.key} className="role-guide-card" style={{ '--role-color': r.color }}>
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
        </article>
      ))}</div>}

      {tab === 1 && (
        <div className="phase-timeline">
          {PHASE_GUIDE.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, marginBottom: i < PHASE_GUIDE.length - 1 ? 22 : 0 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%',
                              border: '1px solid var(--border)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: 'rgba(184,150,62,.08)' }}>
                  {p.emoji}
                </div>
                {i < PHASE_GUIDE.length - 1 && (
                  <div style={{ width: 1, height: 26, background: 'var(--border)', margin: '4px auto 0' }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div className="cinzel" style={{ fontSize: 13, letterSpacing: 1, marginBottom: 4 }}>
                  {p.name}
                </div>
                <p className="dim" style={{ fontSize: 13.5, lineHeight: 1.45 }}>{p.description}</p>
              </div>
            </div>
          ))}
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
