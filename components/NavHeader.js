'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clearSession } from '@/lib/api';

export default function NavHeader({ session, diamonds }) {
  const router = useRouter();
  return (
    <div className="nav-header">
      <Link href="/lobby" style={{ textDecoration: 'none' }}>
        <span className="title-gold cinzel" style={{ fontSize: 20 }}>MAFIA</span>
      </Link>
      <div className="nav-links">
        <Link href="/lobby">JOUER</Link>
        <Link href="/profile">PROFIL</Link>
        <Link href="/shop">BOUTIQUE</Link>
        <Link href="/guide">GUIDE</Link>
        {diamonds != null && (
          <span style={{ padding: '8px 12px', color: 'var(--blue)', fontSize: 13 }}>
            💎 {diamonds}
          </span>
        )}
        {session && (
          <a style={{ cursor: 'pointer' }}
             onClick={() => { clearSession(); router.replace('/'); }}>
            SORTIR
          </a>
        )}
      </div>
    </div>
  );
}
