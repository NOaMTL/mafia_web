'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/api';

export default function LandingPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);

  useEffect(() => { setSession(getSession()); }, []);

  const play = () => router.push(session ? '/lobby' : '/auth');

  return (
    <div>
      <div className="ambiance ambiance-home on" />

      {/* ── Nav ── */}
      <nav className="landing-nav">
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span className="brand">
            <span className="logo-badge">🐺</span>
            <span>
              MAFIA
              <div style={{ fontSize: 9, letterSpacing: 4, color: 'var(--gold)' }}>
                LE JEU DU VILLAGE
              </div>
            </span>
          </span>
        </Link>

        <div className="links">
          <a className="active" href="/">ACCUEIL</a>
          <Link href="/guide">COMMENT JOUER</Link>
          <Link href="/guide">RÔLES</Link>
          <Link href="/leaderboard">CLASSEMENT</Link>
          <Link href="/shop">BOUTIQUE</Link>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {session ? (
            <button className="btn-gold" onClick={() => router.push('/lobby')}>
              {session.username.toUpperCase()}
            </button>
          ) : (
            <>
              <button className="btn-outline" onClick={() => router.push('/auth')}>
                SE CONNECTER
              </button>
              <button className="btn-gold" onClick={() => router.push('/auth?mode=register')}>
                S&apos;INSCRIRE
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div>
          <h1 className="cinzel">
            <span className="white">LA NUIT TOMBE.</span><br />
            <span className="gold">À QUI FERAS-TU CONFIANCE&nbsp;?</span>
          </h1>
          <p className="sub">
            Mafia est un jeu de déduction et de mensonges. Innocents ou
            Mafieux, tous ont un rôle à jouer — et une seule nuit peut tout
            faire basculer.
          </p>

          <div className="cta-row">
            <button className="btn-gold" onClick={play}>
              JOUER MAINTENANT ▸
            </button>
            <button className="btn-outline" onClick={play}>
              CRÉER UNE PARTIE +
            </button>
          </div>

          <div className="feature-chips">
            <div className="chip">
              <span className="ico">👥</span>
              <div>
                <div className="big">4 – 15</div>
                <div className="small">JOUEURS</div>
              </div>
            </div>
            <div className="chip">
              <span className="ico">🕰️</span>
              <div>
                <div className="big">15 – 30 MIN</div>
                <div className="small">PAR PARTIE</div>
              </div>
            </div>
            <div className="chip">
              <span className="ico">🎭</span>
              <div>
                <div className="big">9 RÔLES</div>
                <div className="small">UNIQUES</div>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-art" style={{ backgroundImage: "url('/bg/home.webp')" }} />
      </section>
    </div>
  );
}
