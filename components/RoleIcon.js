'use client';

import { ROLE_GUIDE } from '@/lib/roleGuide';

const ROLE_BY_KEY = Object.fromEntries(ROLE_GUIDE.map((role) => [role.key, role]));

/** Generated role artwork shared by every role-facing screen. */
export default function RoleIcon({ roleKey, className = '', size, decorative = true }) {
  const role = ROLE_BY_KEY[roleKey];
  const style = {
    '--role-art-color': role?.color ?? '#8d8d8d',
    ...(size ? { '--role-art-size': `${size}px` } : {}),
  };

  if (!role) {
    return (
      <span className={`role-art role-art-unknown ${className}`} style={style}
            aria-label={decorative ? undefined : 'Rôle inconnu'} aria-hidden={decorative || undefined}>
        ?
      </span>
    );
  }

  return (
    <span className={`role-art ${className}`} style={style}
          title={decorative ? undefined : role.name} aria-hidden={decorative || undefined}>
      <img src={role.image} alt={decorative ? '' : `Illustration du rôle ${role.name}`}
           loading="lazy" decoding="async" />
    </span>
  );
}
