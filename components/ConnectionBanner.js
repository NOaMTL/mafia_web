'use client';

import { useState, useEffect } from 'react';
import { peekSocket } from '@/lib/socket';
import { API_URL } from '@/lib/api';

/**
 * Bandeau d'état de la connexion temps réel. Invisible quand tout va bien ;
 * affiche la cause et la cible quand le socket décroche, pour ne plus jamais
 * avoir un jeu figé sans explication.
 */
export default function ConnectionBanner() {
  const [state, setState] = useState('ok'); // 'ok' | 'reconnecting' | 'error'
  const [detail, setDetail] = useState('');

  useEffect(() => {
    const socket = peekSocket();
    if (!socket) return;

    const onConnect = () => { setState('ok'); setDetail(''); };
    const onDisconnect = (reason) => {
      setState('reconnecting');
      setDetail(reason === 'io server disconnect'
        ? 'Le serveur a fermé la connexion.'
        : 'Connexion interrompue — reconnexion automatique…');
    };
    const onError = (err) => {
      setState('error');
      setDetail(
        API_URL.includes('localhost')
          ? `Backend local injoignable (${API_URL}) — est-il démarré ?`
          : `Serveur injoignable (${API_URL}) — ${err?.message ?? 'erreur réseau'}`,
      );
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onError);
    if (!socket.connected) onDisconnect('init');

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onError);
    };
  }, []);

  if (state === 'ok') return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: state === 'error' ? 'rgba(70, 12, 12, .97)' : 'rgba(60, 45, 8, .97)',
      borderBottom: `1px solid ${state === 'error' ? 'rgba(192,57,43,.6)' : 'rgba(184,150,62,.5)'}`,
      padding: '8px 16px', textAlign: 'center', fontSize: 13,
      backdropFilter: 'blur(6px)',
    }}>
      {state === 'error' ? '⛔' : '📡'}{' '}
      <b>{state === 'error' ? 'Connexion impossible' : 'Reconnexion en cours'}</b>
      {' — '}{detail}
    </div>
  );
}
