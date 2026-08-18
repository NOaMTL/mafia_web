'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/api';
import BrandMark from '@/components/BrandMark';
import UserMenu from '@/components/UserMenu';

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" />
      <path d="M3.5 19c.4-4 2.1-6 5.5-6s5.1 2 5.5 6M14 14c3.7-.5 5.7 1.2 6.1 4.5" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 2" />
    </svg>
  );
}

function MaskIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 6c4 1 7 1 9-1 2 2 5 2 9 1 0 8-3 13-9 14C6 19 3 14 3 6Z" />
      <path d="M7 11c1-1 2-1 3 0M14 11c1-1 2-1 3 0M9 16c2 1 4 1 6 0" />
    </svg>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);

  useEffect(() => { setSession(getSession()); }, []);

  const play = () => router.push(session ? '/lobby' : '/auth');

  return (
    <main className="landing-page">
      <div className="landing-visual" aria-hidden="true" />

      <nav className="landing-nav" aria-label="Navigation principale">
        <BrandMark />

        <div className="links">
          <Link className="active" href="/">ACCUEIL</Link>
          <Link href="/guide">COMMENT JOUER</Link>
          <Link href="/guide#roles">RÔLES</Link>
          <Link href="/leaderboard">CLASSEMENT</Link>
          <Link href="/shop">BOUTIQUE</Link>
        </div>

        <div className="landing-account">
          <span className="locale" aria-label="Langue française">
            <span aria-hidden="true">◎</span> FR <span className="chevron">⌄</span>
          </span>
          {session ? (
            <UserMenu session={session} className="landing-user-account" />
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

      <section className="landing-hero">
        <div className="hero-copy">
          <p className="eyebrow">UN JEU DE DÉDUCTION SOCIALE</p>
          <h1>
            <span className="white">LA NUIT TOMBE.</span>
            <span className="gold">À QUI FERAS-TU CONFIANCE&nbsp;?</span>
          </h1>
          <p className="sub">
            Loup Garou : Mafia est un jeu de déduction et de mensonges.
            Innocents ou Mafieux, tous ont un rôle à jouer.
          </p>

          <div className="cta-row">
            <button className="btn-gold" onClick={play}>
              JOUER MAINTENANT <span aria-hidden="true">⌄</span>
            </button>
            <button className="btn-outline" onClick={play}>
              CRÉER UNE PARTIE <span className="plus" aria-hidden="true">＋</span>
            </button>
          </div>

          <div className="online-dot">1 248 joueurs en ligne</div>

          <div className="feature-chips" aria-label="Caractéristiques du jeu">
            <div className="chip">
              <span className="ico"><PeopleIcon /></span>
              <div><div className="big">10 – 20</div><div className="small">JOUEURS</div></div>
            </div>
            <div className="chip">
              <span className="ico"><ClockIcon /></span>
              <div><div className="big">20 – 60 MIN</div><div className="small">PAR PARTIE</div></div>
            </div>
            <div className="chip">
              <span className="ico"><MaskIcon /></span>
              <div><div className="big">9 RÔLES</div><div className="small">UNIQUES</div></div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
