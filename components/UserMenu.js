'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api, clearSession } from '@/lib/api';
import { getAvatarMap } from '@/lib/avatars';

export default function UserMenu({ session, diamonds, showPoints = false, className = '' }) {
  const router = useRouter();
  const pathname = usePathname();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [pointBalance, setPointBalance] = useState(diamonds ?? null);

  useEffect(() => {
    if (diamonds != null) setPointBalance(diamonds);
  }, [diamonds]);

  useEffect(() => {
    if (!session) {
      setAvatarUrl(null);
      setPointBalance(null);
      return undefined;
    }

    let active = true;
    Promise.all([api.profile(), getAvatarMap()])
      .then(([profile, avatarMap]) => {
        if (!active) return;
        setAvatarUrl(profile?.avatarId ? avatarMap[profile.avatarId] ?? null : null);
        if (diamonds == null) setPointBalance(profile?.diamonds ?? 0);
      })
      .catch(() => {
        if (active && diamonds == null) setPointBalance(0);
      });

    return () => { active = false; };
  }, [session, diamonds]);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  if (!session) return null;

  const initial = session.username?.trim()?.[0]?.toUpperCase() || '?';
  const logout = () => {
    setOpen(false);
    clearSession();
    router.replace('/');
    router.refresh();
  };

  return (
    <div ref={rootRef} className={className}>
      {showPoints && (
        <span className="nav-diamonds" title={`${pointBalance ?? 0} points`}>
          <span aria-hidden="true">◆</span>
          <b>{pointBalance ?? '…'}</b>
          <small>PTS</small>
        </span>
      )}

      <div className={`user-menu ${open ? 'open' : ''}`}>
        <button
          type="button"
          className="user-menu-trigger"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls="user-account-menu"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="user-menu-avatar" aria-hidden="true">
            {avatarUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={avatarUrl} alt="" />
              : <span>{initial}</span>}
          </span>
          <span className="user-menu-copy">
            <small>CONNECTÉ</small>
            <strong>{session.username}</strong>
          </span>
          <span className="user-menu-chevron" aria-hidden="true">⌄</span>
        </button>

        <div id="user-account-menu" className="user-menu-popover" role="menu">
          <div className="user-menu-heading">
            <span className="user-menu-avatar" aria-hidden="true">
              {avatarUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={avatarUrl} alt="" />
                : <span>{initial}</span>}
            </span>
            <span><small>VOTRE DOSSIER</small><strong>{session.username}</strong></span>
          </div>
          <Link href="/profile" className="user-menu-item" role="menuitem" onClick={() => setOpen(false)}>
            <span><strong>AFFICHER LE PROFIL</strong><small>Statistiques, succès et historique</small></span>
            <b aria-hidden="true">→</b>
          </Link>
          <button type="button" className="user-menu-item user-menu-logout" role="menuitem" onClick={logout}>
            <span><strong>SE DÉCONNECTER</strong><small>Quitter cette session</small></span>
            <b aria-hidden="true">↗</b>
          </button>
        </div>
      </div>
    </div>
  );
}
