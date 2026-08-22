'use client';

import { useEffect, useRef } from 'react';
import { ROLE_MECHANICS } from '@/lib/roleGuide';
import RoleIcon from '@/components/RoleIcon';

export default function RoleDetailsModal({ role, onClose }) {
  const closeButtonRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!role) return undefined;

    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [role]);

  if (!role) return null;

  const facts = ROLE_MECHANICS[role.key] ?? [];
  const titleId = `role-details-${role.key.toLowerCase()}`;

  return (
    <div className="role-modal-backdrop" onClick={onClose}>
      <section
        className="role-modal"
        style={{ '--role-color': role.color }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          className="role-modal-close"
          type="button"
          aria-label="Fermer le dossier"
          onClick={onClose}
        >
          ✕
        </button>

        <div className="role-modal-visual">
          <img src={role.image} alt="" />
          <div className="role-modal-visual-shade" />
          <div className="role-modal-visual-top">
            <span className="role-modal-team"><i />{role.team === 'MAFIA' ? 'MAFIA' : 'VILLE'}</span>
            <span>ARCHIVES · {role.key}</span>
          </div>
          <div className="role-modal-visual-signature">
            <RoleIcon roleKey={role.key} className="role-modal-emblem" />
            <div>
              <small>DOSSIER CONFIDENTIEL</small>
              <strong>{role.name}</strong>
            </div>
          </div>
        </div>

        <div className="role-modal-content">
          <header className="role-modal-header">
            <span className="role-modal-eyebrow">PROFIL DU RÔLE</span>
            <h2 id={titleId}>{role.name}</h2>
            <p className="role-modal-desc">{role.description}</p>
          </header>

          <div className={`role-modal-mission ${role.nightAction ? 'night' : 'passive'}`}>
            <span className="role-modal-mission-icon">{role.nightAction ? '☾' : '◇'}</span>
            <div>
              <small>{role.nightAction ? 'MISSION NOCTURNE' : 'RÔLE PASSIF'}</small>
              <strong>{role.nightAction ?? 'Aucune action à effectuer pendant la nuit.'}</strong>
            </div>
          </div>

          <div className="role-modal-section-title">
            <span>MÉCANIQUES &amp; INTERACTIONS</span>
            <b>{String(facts.length).padStart(2, '0')}</b>
          </div>
          <div className="role-facts">
            {facts.map((fact, index) => (
              <div key={`${fact.title}-${index}`} className="role-fact">
                <span className="role-fact-number">{String(index + 1).padStart(2, '0')}</span>
                <span className="role-fact-icon">{fact.icon}</span>
                <div>
                  <div className="role-fact-title">{fact.title}</div>
                  <div className="role-fact-text">{fact.text}</div>
                </div>
              </div>
            ))}
          </div>

          <aside className="role-modal-tip">
            <span>♟</span>
            <div>
              <small>CONSEIL STRATÉGIQUE</small>
              <p>{role.tip}</p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
