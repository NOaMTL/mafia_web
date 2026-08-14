'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, getSession } from '@/lib/api';
import NavHeader from '@/components/NavHeader';

export default function ShopPage() {
  const router = useRouter();
  const [session, setSession]   = useState(null);
  const [avatars, setAvatars]   = useState([]);
  const [diamonds, setDiamonds] = useState(null);
  const [equipped, setEquipped] = useState(null);
  const [busy, setBusy]         = useState(false);
  const [message, setMessage]   = useState('');

  const load = useCallback(() => {
    api.getAvatars().then(setAvatars).catch(() => {});
    api.profile().then((p) => {
      setDiamonds(p.diamonds ?? 0);
      setEquipped(p.avatarId ?? null);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace('/'); return; }
    setSession(s);
    load();
  }, [router, load]);

  async function onClickAvatar(a) {
    if (busy) return;
    setMessage('');
    try {
      if (a.owned) {
        // Equip
        setBusy(true);
        await api.setAvatar(a.id);
        setEquipped(a.id);
        setMessage(`✓ ${a.name} équipé.`);
      } else if (!a.isPremium && a.price > 0) {
        if (diamonds != null && diamonds < a.price) {
          setMessage(`💎 Il vous manque ${a.price - diamonds} diamants.`);
          return;
        }
        if (!confirm(`Acheter ${a.name} pour ${a.price} 💎 ?`)) return;
        setBusy(true);
        const res = await api.buyAvatar(a.id);
        setDiamonds(res.diamondsRemaining ?? diamonds - a.price);
        setMessage(`✓ ${a.name} débloqué !`);
        load();
      }
    } catch (e) {
      setMessage(`⚠ ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  if (!session) return null;

  const owned    = avatars.filter((a) => a.owned);
  const buyable  = avatars.filter((a) => !a.owned && !a.isPremium && a.price > 0);

  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <div className="ambiance ambiance-home on" />
      <NavHeader session={session} diamonds={diamonds} />

      <h1 className="title-gold cinzel"
          style={{ fontSize: 20, textAlign: 'center', marginBottom: 6 }}>
        BOUTIQUE
      </h1>
      <p className="dim" style={{ textAlign: 'center', fontStyle: 'italic', marginBottom: 20 }}>
        Personnalisez votre identité.
      </p>

      {message && (
        <p style={{ textAlign: 'center', marginBottom: 16, color: 'var(--gold-hi)' }}>{message}</p>
      )}

      <div className="cinzel" style={{ fontSize: 12, letterSpacing: 2,
                                       color: 'var(--gold)', margin: '10px 0' }}>
        MES AVATARS ({owned.length})
      </div>
      <div className="avatar-grid" style={{ marginBottom: 28 }}>
        {owned.map((a) => (
          <div key={a.id}
               className={`avatar-card ${equipped === a.id ? 'equipped' : ''}`}
               onClick={() => onClickAvatar(a)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.url} alt={a.name} />
            <div className="avatar-name">{a.name}</div>
            <div className="price" style={{ color: equipped === a.id ? 'var(--gold-hi)' : 'var(--text-dim)' }}>
              {equipped === a.id ? 'Équipé' : 'Cliquer pour équiper'}
            </div>
          </div>
        ))}
      </div>

      <div className="cinzel" style={{ fontSize: 12, letterSpacing: 2,
                                       color: 'var(--blue)', margin: '10px 0' }}>
        💎 À DÉBLOQUER ({buyable.length})
      </div>
      <div className="avatar-grid">
        {buyable.map((a) => {
          const affordable = diamonds != null && diamonds >= a.price;
          return (
            <div key={a.id} className="avatar-card"
                 style={{ opacity: affordable ? 1 : 0.55 }}
                 onClick={() => onClickAvatar(a)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.url} alt={a.name} style={{ filter: 'grayscale(60%)' }} />
              <div className="avatar-name">{a.name}</div>
              <div className="price">💎 {a.price}</div>
            </div>
          );
        })}
      </div>

      {avatars.length === 0 && <p className="dim" style={{ textAlign: 'center' }}>Chargement…</p>}
    </div>
  );
}
