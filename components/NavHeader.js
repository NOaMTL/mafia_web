'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, clearSession } from '@/lib/api';
import BrandMark from '@/components/BrandMark';

export default function NavHeader({ session, diamonds }) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    if (session) api.adminMe().then(() => active && setIsAdmin(true)).catch(() => active && setIsAdmin(false));
    return () => { active = false; };
  }, [session]);

  return (
    <div className="nav-header">
      <BrandMark href="/lobby" compact />
      <div className="nav-links">
        <Link href="/lobby">JOUER</Link>
        <Link href="/profile">PROFIL</Link>
        <Link href="/shop">BOUTIQUE</Link>
        <Link href="/leaderboard">CLASSEMENT</Link>
        <Link href="/guide">GUIDE</Link>
        {isAdmin && <Link className="nav-admin-link" href="/admin">ADMIN</Link>}
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
