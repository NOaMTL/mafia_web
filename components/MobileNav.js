'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSession } from '@/lib/api';

const ITEMS = [
  { href: '/lobby',       icon: '🎭', label: 'JOUER' },
  { href: '/guide',       icon: '📖', label: 'GUIDE' },
  { href: '/leaderboard', icon: '🏆', label: 'CLASSEMENT' },
  { href: '/shop',        icon: '🛒', label: 'BOUTIQUE' },
  { href: '/profile',     icon: '👤', label: 'PROFIL' },
];

/**
 * Navigation basse mobile (≤760 px). Masquée sur l'accueil, l'auth et les
 * écrans de partie (le jeu a ses propres onglets), et sans session.
 */
export default function MobileNav() {
  const pathname = usePathname();
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => { setHasSession(Boolean(getSession())); }, [pathname]);

  if (!hasSession) return null;
  if (pathname === '/' || pathname.startsWith('/auth') || pathname.startsWith('/game')) return null;

  return (
    <nav className="mobile-nav" aria-label="Navigation mobile">
      {ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          || (item.href === '/profile' && pathname.startsWith('/history'));
        return (
          <Link key={item.href} href={item.href}
                className={`mobile-nav-item ${active ? 'active' : ''}`}>
            <span className="mobile-nav-icon" aria-hidden="true">{item.icon}</span>
            <span className="mobile-nav-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
