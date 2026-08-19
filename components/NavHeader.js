'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import BrandMark from '@/components/BrandMark';
import UserMenu from '@/components/UserMenu';

const MAIN_LINKS = [
  { href: '/shop', label: 'BOUTIQUE' },
  { href: '/leaderboard', label: 'CLASSEMENT' },
  { href: '/guide', label: 'GUIDE' },
];

export default function NavHeader({ session, diamonds }) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    if (session) api.adminMe().then(() => active && setIsAdmin(true)).catch(() => active && setIsAdmin(false));
    return () => { active = false; };
  }, [session]);

  useEffect(() => setMenuOpen(false), [pathname]);

  const isActive = (href) => pathname === href
    || pathname.startsWith(`${href}/`);

  return (
    <header className={`nav-header ${session ? 'has-session' : 'is-guest'}`}>
      <BrandMark href="/lobby" compact />
      <button type="button" className={`nav-menu-toggle ${menuOpen ? 'open' : ''}`}
              aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={menuOpen}
              onClick={() => setMenuOpen((value) => !value)}>
        <i><span /><span /><span /></i>
      </button>
      <nav className={`nav-links ${menuOpen ? 'open' : ''}`} aria-label="Navigation principale">
        {MAIN_LINKS.map((item) => (
          <Link key={item.href} href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                onClick={() => setMenuOpen(false)}
                className={`nav-link ${item.className ?? ''} ${isActive(item.href) ? 'active' : ''}`}>
            {item.label}
          </Link>
        ))}
        {isAdmin && (
          <>
            <Link className={`nav-link nav-admin-link ${isActive('/ui-lab') ? 'active' : ''}`}
                  aria-current={isActive('/ui-lab') ? 'page' : undefined} href="/ui-lab"
                  onClick={() => setMenuOpen(false)}>UI LAB</Link>
            <Link className={`nav-link nav-admin-link ${isActive('/admin') ? 'active' : ''}`}
                  aria-current={isActive('/admin') ? 'page' : undefined} href="/admin"
                  onClick={() => setMenuOpen(false)}>ADMIN</Link>
          </>
        )}
      </nav>

      <div className="nav-actions">
        {session && <UserMenu session={session} diamonds={diamonds} showPoints className="nav-account" />}
        <Link href="/lobby" aria-current={isActive('/lobby') ? 'page' : undefined}
              className={`nav-header-play ${isActive('/lobby') ? 'active' : ''}`}>
          <span>JOUER</span><b aria-hidden="true">→</b>
        </Link>
      </div>
    </header>
  );
}
