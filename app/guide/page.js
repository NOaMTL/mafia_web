'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/api';
import { ROLE_GUIDE, PHASE_GUIDE } from '@/lib/roleGuide';
import NavHeader from '@/components/NavHeader';

export default function GuidePage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [tab, setTab]         = useState(0);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace('/'); return; }
    setSession(s);
  }, [router]);

  if (!session) return null;

  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <NavHeader session={session} />

      <h1 className="title-gold cinzel"
          style={{ fontSize: 20, textAlign: 'center', marginBottom: 18 }}>
        GUIDE DU JEU
      </h1>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
        <button className={tab === 0 ? 'primary' : ''} style={{ fontSize: 11 }}
                onClick={() => setTab(0)}>🎭 LES RÔLES</button>
        <button className={tab === 1 ? 'primary' : ''} style={{ fontSize: 11 }}
                onClick={() => setTab(1)}>🕰️ UNE PARTIE</button>
      </div>

      {tab === 0 && ROLE_GUIDE.map((r) => (
        <div key={r.key} className="card" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 26 }}>{r.emoji}</span>
            <div>
              <div className="cinzel" style={{ color: r.color, fontSize: 15, fontWeight: 700 }}>
                {r.name}
              </div>
              <div className="dim" style={{ fontSize: 10, letterSpacing: 2 }}>
                CAMP {r.team}
              </div>
            </div>
          </div>
          <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,.68)', lineHeight: 1.5 }}>
            {r.description}
          </p>
          {r.nightAction && (
            <p style={{ fontSize: 13.5, color: r.color, fontStyle: 'italic', marginTop: 8 }}>
              🌙 {r.nightAction}
            </p>
          )}
          <p style={{ fontSize: 13, color: 'var(--gold)', fontStyle: 'italic', marginTop: 8 }}>
            💡 {r.tip}
          </p>
        </div>
      ))}

      {tab === 1 && (
        <div className="card" style={{ padding: 20 }}>
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
    </div>
  );
}
