'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api, getSession } from '@/lib/api';
import { ROLE_GUIDE } from '@/lib/roleGuide';
import NavHeader from '@/components/NavHeader';
import PageHeading from '@/components/PageHeading';

const ROLE_BY_KEY = Object.fromEntries(ROLE_GUIDE.map((r) => [r.key, r]));
const roleName  = (k) => ROLE_BY_KEY[k]?.name ?? k ?? '?';
const roleEmoji = (k) => ROLE_BY_KEY[k]?.emoji ?? '❓';

const PHASE_MARKERS = {
  NIGHT:          { icon: '🌙', text: 'La nuit tombe sur la ville' },
  DAY_DISCUSSION: { icon: '☀️', text: 'Le jour se lève — débat' },
  DAY_VOTE:       { icon: '🗳️', text: 'Ouverture des votes' },
  TRIAL:          { icon: '⚖️', text: 'Un accusé monte à la barre' },
  JUDGMENT:       { icon: '⚖️', text: 'Le jugement commence' },
};

const NIGHT_ACTION_TEXT = {
  MAFIOSO: 'part en expédition punitive contre', GODFATHER: 'ordonne le meurtre de',
  SHERIFF: 'interroge', INVESTIGATOR: 'fouille le passé de', DETECTIVE: 'file',
  LOOKOUT: 'surveille la maison de', DOCTOR: 'veille sur', BODYGUARD: 'garde',
  ESCORT: 'distrait', CONSORT: 'distrait', CONSIGLIERE: 'enquête sur',
  BLACKMAILER: 'fait chanter', JANITOR: 'se prépare à nettoyer', FRAMER: 'piège',
  BUS_DRIVER: 'permute', VETERAN: 'se met en alerte chez', VIGILANTE: 'braque son arme sur',
};

/** Transforme un événement replay en ligne lisible. Renvoie null pour ignorer. */
function describeEvent(ev, nameOf) {
  const actor  = nameOf(ev.actorId);
  const target = nameOf(ev.targetId);
  const d = ev.data ?? {};

  switch (ev.type) {
    case 'PHASE_STARTED': {
      const m = PHASE_MARKERS[d.phase];
      return m ? { kind: 'phase', icon: m.icon, text: m.text } : null;
    }
    case 'NIGHT_ACTION': {
      const verb = NIGHT_ACTION_TEXT[d.role] ?? 'agit sur';
      const suffix = d.secondaryTargetId ? ` et ${nameOf(d.secondaryTargetId)}` : '';
      return { kind: 'night', icon: roleEmoji(d.role),
               text: `${actor} (${roleName(d.role)}) ${verb} ${target}${suffix}.` };
    }
    case 'PLAYERS_REDIRECTED':
      return { kind: 'night', icon: '🚌',
               text: `${actor} a interverti les destinations de ${target} et ${nameOf(d.secondaryTargetId)} — les actions ont changé de cible.` };
    case 'NIGHT_DEATH':
      return { kind: 'death', icon: '💀',
               text: `${target} est retrouvé mort${ev.actorId ? ` — œuvre de ${actor}${d.killerRole ? ` (${roleName(d.killerRole)})` : ''}` : ''}.${d.cleaned ? ' Le corps a été nettoyé : rôle et testament illisibles.' : ''}` };
    case 'PLAYER_SAVED':
      return { kind: 'save', icon: '⚕️', text: `${target} a été attaqué… mais sauvé par ${actor}.` };
    case 'BODYGUARD_SACRIFICE':
      return { kind: 'death', icon: '🛡️',
               text: `${actor} s'est interposé pour protéger ${target} et l'a payé de sa vie.` };
    case 'BLACKMAILED':
      return { kind: 'night', icon: '🤐', text: `${target} a été réduit au silence pour la journée.` };
    case 'INVESTIGATION': {
      if (d.kind === 'sheriff' || d.team)
        return { kind: 'intel', icon: '⭐', text: `${actor} a interrogé ${target} : ${d.team === 'MAFIA' ? 'SUSPECT' : 'non suspect'}.` };
      if (d.role)
        return { kind: 'intel', icon: '🕵️', text: `${actor} a découvert le rôle de ${target} : ${roleName(d.role)}.` };
      if (d.crimes?.length)
        return { kind: 'intel', icon: '🔎', text: `${actor} a relevé les crimes de ${target} : ${d.crimes.join(', ')}.` };
      if (d.visitedTargetId)
        return { kind: 'intel', icon: '👣', text: `${actor} a suivi ${target} : visite chez ${nameOf(d.visitedTargetId)}.` };
      if (d.visitorIds)
        return { kind: 'intel', icon: '👁️',
                 text: `${actor} a surveillé ${target} : ${d.visitorIds.length ? `visité par ${d.visitorIds.map(nameOf).join(', ')}` : 'aucun visiteur'}.` };
      return { kind: 'intel', icon: '🔎', text: `${actor} a enquêté sur ${target}.` };
    }
    case 'DAY_VOTE':
      return { kind: 'vote', icon: '🗳️', text: `${actor} vote contre ${target}.` };
    case 'JUDGMENT_VOTE': {
      const v = d.verdict === 'GUILTY' ? 'COUPABLE' : d.verdict === 'INNOCENT' ? 'INNOCENT' : 'ABSTENTION';
      return { kind: 'vote', icon: '⚖️', text: `${actor} vote ${v} au procès de ${target}.` };
    }
    case 'JUDGMENT_RESULT':
      return d.verdict === 'GUILTY'
        ? { kind: 'death', icon: '☠️', text: `Verdict : COUPABLE — ${target} est exécuté en place publique.` }
        : { kind: 'save', icon: '🕊️', text: `Verdict : ${target} est épargné par la ville.` };
    case 'MAFIA_PROMOTION':
      return { kind: 'night', icon: '🔪',
               text: `La famille a perdu ses tueurs : ${actor} (${roleName(d.formerRole)}) reprend le couteau et devient Mafioso.` };
    case 'MAYOR_REVEAL':
      return { kind: 'intel', icon: '🏛️', text: `${actor} se révèle publiquement : c'est le Maire ! Son vote compte double.` };
    case 'CHAT_MESSAGE': {
      const chan = d.channel === 'mafia' ? '# MAFIA' : d.channel === 'dead' ? '# MORTS' : '# VILLE';
      return { kind: 'chat', icon: '💬', text: `${chan} · ${actor} : ${d.message}`, channel: d.channel };
    }
    case 'GAME_OVER':
      return { kind: 'phase', icon: '🏆',
               text: d.winner === 'MAFIA' ? 'La Mafia contrôle désormais la ville.' : 'La ville est purgée — victoire des habitants.' };
    default:
      return null; // ROLE_ASSIGNED, EVIDENCE_*, etc.
  }
}

export default function GameDetailPage() {
  const router = useRouter();
  const { gameId } = useParams();
  const [session, setSession] = useState(null);
  const [detail, setDetail]   = useState(null);
  const [error, setError]     = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showVotes, setShowVotes] = useState(true);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace('/'); return; }
    setSession(s);
    api.getGameDetail(gameId)
      .then(setDetail)
      .catch((e) => setError(e?.message ?? 'Archive introuvable.'));
  }, [router, gameId]);

  if (!session) return null;

  const players = detail?.players ?? [];
  const nameOf = (id) => players.find((p) => p.userId === id)?.username ?? '???';
  const me = players.find((p) => p.userId === session.userId || p.username === session.username);
  const won = me && detail && me.team === detail.winner;

  // Chronologie groupée par tour.
  const rounds = [];
  if (detail?.replay) {
    for (const ev of detail.replay) {
      const line = describeEvent(ev, nameOf);
      if (!line) continue;
      if (line.kind === 'chat' && !showChat) continue;
      if (line.kind === 'vote' && !showVotes) continue;
      let bucket = rounds.find((r) => r.round === ev.round);
      if (!bucket) { bucket = { round: ev.round, lines: [] }; rounds.push(bucket); }
      bucket.lines.push({ ...line, id: ev.id });
    }
  }

  const town  = players.filter((p) => p.team !== 'MAFIA');
  const mafia = players.filter((p) => p.team === 'MAFIA');

  const rosterRow = (p) => (
    <div key={p.userId} className={`hd-player ${p.isAlive ? '' : 'hd-dead'}`}>
      <span className="hd-emoji">{roleEmoji(p.role)}</span>
      <div className="hd-player-main">
        <div className="hd-player-name">
          {p.username}{p.isBot ? <span className="hd-bot">BOT</span> : null}
          {me?.userId === p.userId ? <span className="hd-you">VOUS</span> : null}
        </div>
        <div className="hd-player-role">{roleName(p.role)}</div>
        {p.deathRecord && (
          <div className="hd-death">
            ✝ Tour {p.deathRecord.round} — {p.deathRecord.cause}
            {(p.deathRecord.details ?? []).map((line, i) => (
              <div key={i} className="hd-death-detail">↳ {line}</div>
            ))}
          </div>
        )}
        {p.isAlive && <div className="hd-alive">Survivant</div>}
      </div>
    </div>
  );

  return (
    <main className="page meta-page history-detail-page">
      <div className="ambiance ambiance-home on" />
      <NavHeader session={session} />

      <PageHeading
        eyebrow="ARCHIVES DE LA VILLE"
        title={detail ? (detail.winner === 'MAFIA' ? 'VICTOIRE DE LA MAFIA' : 'VICTOIRE DE LA VILLE') : 'DOSSIER DE PARTIE'}
        subtitle={detail
          ? `${new Date(detail.playedAt).toLocaleString('fr-FR')} · ${detail.rounds} tour${detail.rounds > 1 ? 's' : ''}`
          : 'Ouverture du dossier…'} />

      <Link href="/profile" className="hd-back">← RETOUR À L&apos;HISTORIQUE</Link>

      {error && (
        <div className="meta-empty"><strong>DOSSIER INDISPONIBLE</strong><p>{error}</p></div>
      )}
      {!error && !detail && <div className="meta-loading"><span /> Ouverture du dossier…</div>}

      {detail && (
        <>
          {me && (
            <div className={`hd-verdict ${won ? 'hd-won' : 'hd-lost'}`}>
              {won ? '👑' : '💀'} Vous étiez <strong>{roleName(me.role)}</strong> —
              {won ? ' votre camp l’a emporté.' : ' votre camp a été vaincu.'}
            </div>
          )}

          {/* ── Roster final ── */}
          <div className="hd-columns">
            <section className="card hd-col">
              <h3 className="hd-col-title town">🏘️ LA VILLE</h3>
              {town.map(rosterRow)}
            </section>
            <section className="card hd-col">
              <h3 className="hd-col-title mafia">🎩 LA MAFIA</h3>
              {mafia.map(rosterRow)}
            </section>
          </div>

          {/* ── Chronologie ── */}
          <section className="card hd-timeline-card">
            <div className="hd-timeline-head">
              <h3>CHRONOLOGIE COMPLÈTE</h3>
              <div className="hd-filters">
                <label><input type="checkbox" checked={showVotes}
                              onChange={(e) => setShowVotes(e.target.checked)} /> Votes</label>
                <label><input type="checkbox" checked={showChat}
                              onChange={(e) => setShowChat(e.target.checked)} /> Chat</label>
              </div>
            </div>
            {rounds.map((r) => (
              <div key={r.round} className="hd-round">
                <div className="hd-round-badge">TOUR {r.round}</div>
                {r.lines.map((l) => (
                  <div key={l.id} className={`hd-line hd-${l.kind}`}>
                    <span className="hd-line-icon">{l.icon}</span>
                    <span>{l.text}</span>
                  </div>
                ))}
              </div>
            ))}
            {rounds.length === 0 && <p className="dim">Aucun événement enregistré pour cette partie.</p>}
          </section>
        </>
      )}
    </main>
  );
}
