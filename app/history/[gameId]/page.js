'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api, getSession } from '@/lib/api';
import { ROLE_GUIDE } from '@/lib/roleGuide';
import NavHeader from '@/components/NavHeader';
import PageHeading from '@/components/PageHeading';
import RoleIcon from '@/components/RoleIcon';

const ROLE_BY_KEY = Object.fromEntries(ROLE_GUIDE.map((role) => [role.key, role]));
const roleName = (key) => ROLE_BY_KEY[key]?.name ?? key ?? 'Rôle inconnu';

const PHASE_INFO = {
  ROLE_REVEAL: {
    icon: '🎭', label: 'RÔLES', title: 'Révélation des rôles', tone: 'night',
    description: 'Les identités secrètes sont distribuées. Dans cette archive, tous les rôles sont désormais révélés.',
  },
  NIGHT: {
    icon: '🌙', label: 'NUIT', title: 'La nuit tombe', tone: 'night',
    description: 'Les joueurs préparent leurs actions nocturnes dans le secret.',
  },
  NIGHT_RESOLVE: {
    icon: '✦', label: 'RÉSOLUTION', title: 'Résolution nocturne', tone: 'night',
    description: 'Les blocages, permutations, protections, attaques et enquêtes sont résolus dans leur ordre de priorité.',
  },
  MORNING_GAZETTE: {
    icon: '📰', label: 'GAZETTE', title: 'Gazette du matin', tone: 'day',
    description: 'La ville découvre les conséquences de la nuit et les éventuels rôles révélés.',
  },
  DAY_DISCUSSION: {
    icon: '💬', label: 'DÉBAT', title: 'Discussion publique', tone: 'day',
    description: 'La ville confronte les témoignages, les accusations et les résultats d’enquête.',
  },
  DAY_VOTE: {
    icon: '🗳️', label: 'VOTE', title: 'Vote de la ville', tone: 'day',
    description: 'Chaque vote public rapproche un suspect du procès.',
  },
  TRIAL: {
    icon: '⚖️', label: 'PROCÈS', title: 'Mise en accusation', tone: 'trial',
    description: 'Le joueur désigné dispose d’un dernier temps pour convaincre la ville.',
  },
  JUDGMENT: {
    icon: '⚖️', label: 'JUGEMENT', title: 'Jugement', tone: 'trial',
    description: 'Les joueurs encore en vie votent coupable, innocent ou abstention.',
  },
  SENTENCE: {
    icon: '🔨', label: 'SENTENCE', title: 'Sentence', tone: 'trial',
    description: 'Le verdict est appliqué et le rôle du condamné est révélé.',
  },
  GAME_OVER: {
    icon: '🏆', label: 'FIN', title: 'Fin de la partie', tone: 'result',
    description: 'Le dernier rapport révèle le camp qui contrôle désormais la ville.',
  },
};

const PHASE_ORDER = Object.keys(PHASE_INFO);

const NIGHT_ACTION_TEXT = {
  MAFIOSO: 'part en expédition punitive contre', GODFATHER: 'ordonne le meurtre de',
  SHERIFF: 'interroge', INVESTIGATOR: 'fouille le passé de', DETECTIVE: 'file',
  LOOKOUT: 'surveille la maison de', DOCTOR: 'protège', BODYGUARD: 'monte la garde auprès de',
  ESCORT: 'distrait', CONSORT: 'bloque', CONSIGLIERE: 'enquête sur',
  BLACKMAILER: 'fait chanter', JANITOR: 'se prépare à nettoyer', FRAMER: 'fabrique des preuves contre',
  BUS_DRIVER: 'prépare une permutation avec', VETERAN: 'se met en alerte chez', VIGILANTE: 'braque son arme sur',
};

const KIND_LABELS = {
  role: 'IDENTITÉ RÉVÉLÉE', night: 'ACTION NOCTURNE', death: 'ÉLIMINATION', save: 'PROTECTION',
  intel: 'INFORMATION', vote: 'DÉCISION PUBLIQUE', chat: 'MESSAGE', evidence: 'PREUVE',
  gazette: 'RAPPORT OFFICIEL', result: 'RÉSULTAT', system: 'ÉVÉNEMENT',
};

const participant = (id, label) => id ? { id, label } : null;

function eventPhase(event) {
  if (event.type === 'ROLE_ASSIGNED') return 'ROLE_REVEAL';
  if (event.type === 'PHASE_STARTED' && event.data?.phase) return event.data.phase;
  return event.phase ?? 'GAME_OVER';
}

function describeEvent(event, nameOf) {
  const actor = nameOf(event.actorId);
  const target = nameOf(event.targetId);
  const data = event.data ?? {};

  switch (event.type) {
    case 'PHASE_STARTED':
      return null;
    case 'ROLE_ASSIGNED': {
      const mafia = data.team === 'MAFIA' || ROLE_BY_KEY[data.role]?.team === 'MAFIA';
      return {
        kind: 'role', icon: mafia ? '◆' : '✦', roleKey: data.role, tone: mafia ? 'mafia' : 'town',
        title: `${actor} reçoit son identité`,
        text: `${actor} jouait ${roleName(data.role)}, membre de ${mafia ? 'la Famille Mafia' : 'l’Alliance Town'}.`,
        participants: [participant(event.actorId, 'JOUEUR')],
      };
    }
    case 'NIGHT_ACTION': {
      const secondaryName = data.secondaryTargetId ? nameOf(data.secondaryTargetId) : null;
      const verb = NIGHT_ACTION_TEXT[data.role] ?? 'agit sur';
      const mafia = ROLE_BY_KEY[data.role]?.team === 'MAFIA';
      return {
        kind: 'night', icon: '🌙', roleKey: data.role, tone: mafia ? 'mafia' : 'town',
        title: `${roleName(data.role)} en action`,
        text: `${actor}, qui jouait ${roleName(data.role)}, ${verb} ${target}${secondaryName ? ` et ${secondaryName}` : ''}.`,
        participants: [
          participant(event.actorId, 'AUTEUR'), participant(event.targetId, 'CIBLE'),
          participant(data.secondaryTargetId, '2E CIBLE'),
        ],
      };
    }
    case 'PLAYERS_REDIRECTED':
      return {
        kind: 'night', icon: '🚌', roleKey: 'BUS_DRIVER', tone: 'town', title: 'Destinations interverties',
        text: `${actor} a interverti ${target} et ${nameOf(data.secondaryTargetId)}. Les actions qui les visaient ont changé de destination.`,
        participants: [
          participant(event.actorId, 'CHAUFFEUR'), participant(event.targetId, '1RE CIBLE'),
          participant(data.secondaryTargetId, '2E CIBLE'),
        ],
      };
    case 'NIGHT_DEATH':
      return {
        kind: 'death', icon: '☠', roleKey: data.killerRole, tone: 'danger', title: `${target} est éliminé`,
        text: `${target} est retrouvé mort${event.actorId ? ` après l’attaque de ${actor}, qui jouait ${roleName(data.killerRole)}` : ''}.${data.cleaned ? ' Le Janitor a nettoyé le corps : son rôle et son testament sont cachés à la ville.' : ''}`,
        participants: [participant(event.targetId, 'VICTIME'), participant(event.actorId, 'ATTAQUANT')],
      };
    case 'PLAYER_SAVED':
      return {
        kind: 'save', icon: '⚕', roleKey: 'DOCTOR', tone: 'town', title: 'Attaque déjouée',
        text: `${target} a subi une attaque, mais ${actor}, le Médecin, l’a sauvé avant l’aube.`,
        participants: [participant(event.actorId, 'MÉDECIN'), participant(event.targetId, 'PROTÉGÉ')],
      };
    case 'BODYGUARD_SACRIFICE':
      return {
        kind: 'death', icon: '🛡️', roleKey: 'BODYGUARD', tone: 'town', title: 'Sacrifice du Garde du corps',
        text: `${actor} s’est interposé pour protéger ${target} et a payé cette protection de sa vie.`,
        participants: [participant(event.actorId, 'GARDE'), participant(event.targetId, 'PROTÉGÉ'), participant(data.killerId, 'ATTAQUANT')],
      };
    case 'BLACKMAILED':
      return {
        kind: 'night', icon: '🤐', roleKey: 'BLACKMAILER', tone: 'mafia', title: 'Chantage réussi',
        text: `${target} a été réduit au silence et ne pourra pas parler pendant la journée.`,
        participants: [participant(event.targetId, 'CIBLE')],
      };
    case 'INVESTIGATION': {
      let result = `${actor} a enquêté sur ${target}.`;
      if (data.kind === 'visit') result = `${actor} a suivi ${target} : sa destination était ${nameOf(data.visitedTargetId)}.`;
      else if (data.kind === 'watch') result = `${actor} a surveillé ${target} : ${data.visitorIds?.length ? `les visiteurs étaient ${data.visitorIds.map(nameOf).join(', ')}` : 'personne ne lui a rendu visite'}.`;
      else if (data.team) result = `${actor} a interrogé ${target} : le résultat était ${data.team === 'MAFIA' ? 'SUSPECT' : 'NON SUSPECT'}.`;
      else if (data.role) result = `${actor} a découvert que ${target} jouait ${roleName(data.role)}.`;
      else if (data.crimes?.length) result = `${actor} a relevé chez ${target} les crimes suivants : ${data.crimes.join(', ')}.`;
      return {
        kind: 'intel', icon: '🔎', tone: 'town', title: 'Résultat d’enquête', text: result,
        participants: [participant(event.actorId, 'ENQUÊTEUR'), participant(event.targetId, 'CIBLE')],
      };
    }
    case 'DAY_VOTE':
      return {
        kind: 'vote', icon: '🗳️', title: 'Vote public', text: `${actor} a voté pour envoyer ${target} au procès.`,
        participants: [participant(event.actorId, 'VOTANT'), participant(event.targetId, 'ACCUSÉ')],
      };
    case 'JUDGMENT_VOTE': {
      const verdict = data.verdict === 'GUILTY' ? 'COUPABLE' : data.verdict === 'INNOCENT' ? 'INNOCENT' : 'ABSTENTION';
      return {
        kind: 'vote', icon: '⚖️', title: `Vote ${verdict.toLowerCase()}`,
        text: `${actor} a voté ${verdict} au procès de ${target}.`,
        participants: [participant(event.actorId, 'JURÉ'), participant(event.targetId, 'ACCUSÉ')],
      };
    }
    case 'JUDGMENT_RESULT': {
      const guilty = data.verdict === 'GUILTY';
      return {
        kind: guilty ? 'death' : 'save', icon: guilty ? '☠' : '🕊️', tone: guilty ? 'danger' : 'town',
        title: guilty ? 'Verdict : coupable' : 'Verdict : innocent',
        text: guilty ? `${target} est reconnu coupable et exécuté en place publique.` : `${target} est déclaré innocent et épargné par la ville.`,
        participants: [participant(event.targetId, guilty ? 'CONDAMNÉ' : 'ACQUITTÉ')],
      };
    }
    case 'MAFIA_PROMOTION':
      return {
        kind: 'night', icon: '🔪', roleKey: 'MAFIOSO', tone: 'mafia', title: 'Promotion dans la Mafia',
        text: `${actor}, auparavant ${roleName(data.formerRole)}, reprend le couteau et devient Mafioso.`,
        participants: [participant(event.actorId, 'NOUVEAU MAFIOSO')],
      };
    case 'MAYOR_REVEAL':
      return {
        kind: 'intel', icon: '🏛️', roleKey: 'MAYOR', tone: 'town', title: 'Le Maire se révèle',
        text: `${actor} révèle publiquement son rôle de Maire. Son vote compte désormais double.`,
        participants: [participant(event.actorId, 'MAIRE')],
      };
    case 'EVIDENCE_ADDED':
      return {
        kind: 'evidence', icon: '📌', title: 'Preuve ajoutée au dossier',
        text: `${actor} a ajouté une preuve concernant ${target} : « ${data.text ?? 'note sans texte'} »`,
        participants: [participant(event.actorId, 'AUTEUR'), participant(event.targetId, 'SUJET')],
      };
    case 'EVIDENCE_REMOVED':
      return {
        kind: 'evidence', icon: '×', title: 'Preuve retirée',
        text: `${actor} a retiré une preuve qui concernait ${target}.`,
        participants: [participant(event.actorId, 'AUTEUR'), participant(event.targetId, 'SUJET')],
      };
    case 'CHAT_MESSAGE': {
      const channelLabel = data.channel === 'mafia' ? 'canal Mafia' : data.channel === 'dead' ? 'canal des morts' : 'place publique';
      return {
        kind: 'chat', icon: '“', tone: data.channel === 'mafia' ? 'mafia' : undefined,
        title: `Message dans le ${channelLabel}`,
        text: `« ${data.message ?? ''} »`,
        participants: [participant(event.actorId, 'AUTEUR')],
      };
    }
    case 'GAZETTE_NOTICE': {
      if (data.noElimination) {
        return { kind: 'gazette', icon: '📰', title: 'Aucune victime cette nuit', text: data.message ?? 'La Gazette ne rapporte aucune élimination.' };
      }
      const revealedRole = data.eliminatedRole ? ` Son rôle est révélé : ${roleName(data.eliminatedRole)}.` : '';
      const will = data.will ? ` Son testament disait : « ${data.will} »` : '';
      return {
        kind: 'gazette', icon: '📰', tone: 'danger', title: `La Gazette annonce la mort de ${data.eliminatedUsername ?? target}`,
        text: `${data.message ?? `${data.eliminatedUsername ?? target} a été retrouvé mort.`}${revealedRole}${will}`,
        participants: [participant(event.targetId, 'VICTIME')],
      };
    }
    case 'GAME_OVER': {
      const mafiaWon = data.winner === 'MAFIA';
      return {
        kind: 'result', icon: mafiaWon ? '◆' : '✦', tone: mafiaWon ? 'mafia' : 'town',
        title: mafiaWon ? 'La Mafia prend le contrôle' : 'La Town libère la ville',
        text: mafiaWon ? 'La Mafia égale ou dépasse les habitants survivants : la ville lui appartient.' : 'Tous les membres de la Mafia sont éliminés : la ville est sauvée.',
      };
    }
    default:
      return { kind: 'system', icon: '•', title: 'Événement enregistré', text: event.type.replaceAll('_', ' ').toLowerCase() };
  }
}

function TeamPlayerCard({ player, isMe }) {
  const mafia = player.team === 'MAFIA';
  return (
    <article className={`hd-roster-player ${mafia ? 'mafia' : 'town'} ${player.isAlive ? 'alive' : 'dead'}`}>
      <RoleIcon roleKey={player.role} size={68} decorative={false} />
      <div className="hd-roster-player-copy">
        <div className="hd-roster-player-name">
          <strong>{player.username}</strong>
          {player.isBot && <span className="hd-bot">BOT</span>}
          {isMe && <span className="hd-you">VOUS</span>}
        </div>
        <span className="hd-roster-role">{roleName(player.role)}</span>
        <span className={`hd-roster-status ${player.isAlive ? 'alive' : 'dead'}`}>
          {player.isAlive ? 'SURVIVANT' : `ÉLIMINÉ AU TOUR ${player.deathRecord?.round ?? '?'}`}
        </span>
        {player.deathRecord && (
          <div className="hd-roster-death">
            <strong>{player.deathRecord.cause}</strong>
            {(player.deathRecord.details ?? []).map((detail, index) => <span key={index}>{detail}</span>)}
          </div>
        )}
      </div>
    </article>
  );
}

function EventPlayer({ player, label, isMe }) {
  if (!player) return null;
  const mafia = player.team === 'MAFIA';
  return (
    <div className={`hd-event-player ${mafia ? 'mafia' : 'town'}`}>
      <RoleIcon roleKey={player.role} size={48} decorative={false} />
      <span className="hd-event-player-copy">
        <small>{label}</small>
        <strong>{player.username}{isMe ? ' · VOUS' : ''}</strong>
        <span>{roleName(player.role)}</span>
      </span>
    </div>
  );
}

function ArchiveEventCard({ entry, playerById, currentUserId }) {
  const participants = (entry.participants ?? [])
    .filter(Boolean)
    .filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id && candidate.label === item.label) === index);

  return (
    <article className={`hd-event-card hd-event-${entry.kind} ${entry.tone ? `tone-${entry.tone}` : ''}`}>
      <div className="hd-event-art" aria-hidden="true">
        {entry.roleKey ? <RoleIcon roleKey={entry.roleKey} size={58} /> : <span>{entry.icon}</span>}
      </div>
      <div className="hd-event-content">
        <header>
          <small>{KIND_LABELS[entry.kind] ?? KIND_LABELS.system}</small>
          <h4>{entry.title}</h4>
        </header>
        <p>{entry.text}</p>
        {participants.length > 0 && (
          <div className="hd-event-players">
            {participants.map((item, index) => (
              <EventPlayer key={`${item.id}-${item.label}-${index}`} player={playerById[item.id]}
                           label={item.label} isMe={item.id === currentUserId} />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

export default function GameDetailPage() {
  const router = useRouter();
  const { gameId } = useParams();
  const [session, setSession] = useState(null);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const [activeRound, setActiveRound] = useState(1);
  const [activePhase, setActivePhase] = useState('ROLE_REVEAL');
  const [showChat, setShowChat] = useState(false);
  const [showVotes, setShowVotes] = useState(true);

  useEffect(() => {
    const currentSession = getSession();
    if (!currentSession) { router.replace('/'); return; }
    setSession(currentSession);
    api.getGameDetail(gameId)
      .then((game) => {
        setDetail(game);
        setActiveRound(1);
        setActivePhase('ROLE_REVEAL');
      })
      .catch((requestError) => setError(requestError?.message ?? 'Archive introuvable.'));
  }, [router, gameId]);

  if (!session) return null;

  const players = detail?.players ?? [];
  const playerById = Object.fromEntries(players.map((player) => [player.userId, player]));
  const nameOf = (id) => playerById[id]?.username ?? 'un joueur inconnu';
  const me = players.find((player) => player.userId === session.userId || player.username === session.username);
  const won = Boolean(me && detail && me.team === detail.winner);
  const town = players.filter((player) => player.team !== 'MAFIA');
  const mafia = players.filter((player) => player.team === 'MAFIA');

  const gazetteEvents = (detail?.gazette ?? []).map((notice, index) => {
    const targetPlayer = players.find((player) => player.username === notice.eliminatedUsername);
    return {
      id: `gazette-${notice.round}-${index}`,
      ts: Number.MAX_SAFE_INTEGER - 1000 + index,
      round: notice.round,
      phase: 'MORNING_GAZETTE',
      type: 'GAZETTE_NOTICE',
      targetId: targetPlayer?.userId,
      data: notice,
    };
  });

  const archiveEvents = [...(detail?.replay ?? []), ...gazetteEvents]
    .sort((first, second) => (Number(first.round) - Number(second.round))
      || (Number(first.ts ?? 0) - Number(second.ts ?? 0)));

  const maxRound = Math.max(1, Number(detail?.rounds) || 0, ...archiveEvents.map((event) => Number(event.round) || 0));
  const roundNumbers = Array.from({ length: maxRound }, (_, index) => index + 1);
  const eventsForRound = (round) => archiveEvents.filter((event) => Number(event.round) === round);
  const phasesForRound = (round) => {
    const available = [...new Set(eventsForRound(round).map(eventPhase))];
    return [
      ...PHASE_ORDER.filter((phase) => available.includes(phase)),
      ...available.filter((phase) => !PHASE_ORDER.includes(phase)),
    ];
  };
  const entriesFor = (round, phase) => eventsForRound(round)
    .filter((event) => eventPhase(event) === phase)
    .map((event) => ({ event, entry: describeEvent(event, nameOf) }))
    .filter(({ entry }) => entry)
    .filter(({ entry }) => (showChat || entry.kind !== 'chat') && (showVotes || entry.kind !== 'vote'));

  const availablePhases = phasesForRound(activeRound);
  const selectedPhase = availablePhases.includes(activePhase) ? activePhase : availablePhases[0] ?? 'GAME_OVER';
  const phaseInfo = PHASE_INFO[selectedPhase] ?? {
    icon: '•', label: selectedPhase, title: selectedPhase.replaceAll('_', ' '), tone: 'result',
    description: 'Les événements enregistrés pendant cette phase.',
  };
  const selectedEntries = entriesFor(activeRound, selectedPhase);

  const chooseRound = (round) => {
    setActiveRound(round);
    setActivePhase(phasesForRound(round)[0] ?? 'GAME_OVER');
  };

  return (
    <main className="page meta-page history-detail-page">
      <div className="ambiance ambiance-home on" />
      <NavHeader session={session} />

      <Link href="/profile" className="hd-back">← RETOUR À L&apos;HISTORIQUE</Link>
      <PageHeading
        eyebrow="ARCHIVES DE LA VILLE"
        title={detail ? (detail.winner === 'MAFIA' ? 'VICTOIRE DE LA MAFIA' : 'VICTOIRE DE LA TOWN') : 'DOSSIER DE PARTIE'}
        subtitle={detail
          ? `${new Date(detail.playedAt).toLocaleString('fr-FR')} · ${detail.rounds} tour${detail.rounds > 1 ? 's' : ''} · ${players.length} joueurs`
          : 'Ouverture du dossier…'} />

      {error && <div className="meta-empty"><strong>DOSSIER INDISPONIBLE</strong><p>{error}</p></div>}
      {!error && !detail && <div className="meta-loading"><span /> Ouverture du dossier…</div>}

      {detail && (
        <>
          <section className={`hd-match-hero ${detail.winner === 'MAFIA' ? 'mafia' : 'town'}`}>
            <div className="hd-match-result">
              <span className="hd-match-emblem" aria-hidden="true">{detail.winner === 'MAFIA' ? '◆' : '✦'}</span>
              <div>
                <small>RÉSULTAT OFFICIEL</small>
                <strong>{detail.winner === 'MAFIA' ? 'LA MAFIA TRIOMPHE' : 'LA TOWN TRIOMPHE'}</strong>
                <p>{detail.winner === 'MAFIA' ? 'La famille contrôle désormais les rues.' : 'La ville a éliminé tous les membres de la Mafia.'}</p>
              </div>
            </div>

            <div className="hd-match-metrics">
              <span><small>TOURS JOUÉS</small><strong>{detail.rounds}</strong></span>
              <span><small>PARTICIPANTS</small><strong>{players.length}</strong></span>
              <span><small>SURVIVANTS</small><strong>{players.filter((player) => player.isAlive).length}</strong></span>
            </div>

            {me && (
              <div className={`hd-personal-result ${won ? 'won' : 'lost'} ${me.team === 'MAFIA' ? 'mafia' : 'town'}`}>
                <RoleIcon roleKey={me.role} size={82} decorative={false} />
                <div>
                  <small>VOTRE RÔLE</small>
                  <strong>{roleName(me.role)}</strong>
                  <span>{won ? 'VICTOIRE DE VOTRE CAMP' : 'DÉFAITE DE VOTRE CAMP'}</span>
                </div>
              </div>
            )}
          </section>

          <section className="hd-roster-section">
            <header className="hd-section-heading">
              <div><small>IDENTITÉS DÉCLASSIFIÉES</small><h2>LES JOUEURS ET LEURS RÔLES</h2></div>
              <p>Chaque portrait correspond à l’illustration officielle du rôle joué pendant cette partie.</p>
            </header>
            <div className="hd-team-dossiers">
              <section className="hd-team-dossier town">
                <header><span>✦</span><div><small>ALLIANCE TOWN</small><strong>{town.length} JOUEUR{town.length > 1 ? 'S' : ''}</strong></div></header>
                <div>{town.map((player) => <TeamPlayerCard key={player.userId} player={player} isMe={me?.userId === player.userId} />)}</div>
              </section>
              <section className="hd-team-dossier mafia">
                <header><span>◆</span><div><small>FAMILLE MAFIA</small><strong>{mafia.length} JOUEUR{mafia.length > 1 ? 'S' : ''}</strong></div></header>
                <div>{mafia.map((player) => <TeamPlayerCard key={player.userId} player={player} isMe={me?.userId === player.userId} />)}</div>
              </section>
            </div>
          </section>

          <section className="hd-archive-section">
            <header className="hd-section-heading hd-archive-heading">
              <div><small>DÉROULÉ COMPLET</small><h2>CHRONOLOGIE DE LA PARTIE</h2></div>
              <div className="hd-archive-filters" aria-label="Filtres de la chronologie">
                <label><input type="checkbox" checked={showVotes} onChange={(event) => setShowVotes(event.target.checked)} /><span>VOTES</span></label>
                <label><input type="checkbox" checked={showChat} onChange={(event) => setShowChat(event.target.checked)} /><span>MESSAGES</span></label>
              </div>
            </header>

            <nav className="hd-round-tabs" role="tablist" aria-label="Choisir un tour">
              {roundNumbers.map((round) => {
                const count = phasesForRound(round).reduce((total, phase) => total + entriesFor(round, phase).length, 0);
                return (
                  <button key={round} type="button" role="tab" aria-selected={activeRound === round}
                          className={activeRound === round ? 'active' : ''} onClick={() => chooseRound(round)}>
                    <small>TOUR</small><strong>{round}</strong><span>{count} ÉVÉNEMENT{count > 1 ? 'S' : ''}</span>
                  </button>
                );
              })}
            </nav>

            <nav className="hd-phase-tabs" role="tablist" aria-label={`Phases du tour ${activeRound}`}>
              {availablePhases.map((phase) => {
                const info = PHASE_INFO[phase] ?? { icon: '•', label: phase.replaceAll('_', ' ') };
                const count = entriesFor(activeRound, phase).length;
                return (
                  <button key={phase} type="button" role="tab" aria-selected={selectedPhase === phase}
                          className={`${selectedPhase === phase ? 'active' : ''} tone-${info.tone ?? 'result'}`}
                          onClick={() => setActivePhase(phase)}>
                    <span aria-hidden="true">{info.icon}</span>
                    <strong>{info.label}</strong>
                    <small>{count}</small>
                  </button>
                );
              })}
            </nav>

            <div className={`hd-phase-summary tone-${phaseInfo.tone}`}>
              <span className="hd-phase-symbol" aria-hidden="true">{phaseInfo.icon}</span>
              <div><small>TOUR {activeRound} · PHASE SÉLECTIONNÉE</small><h3>{phaseInfo.title}</h3><p>{phaseInfo.description}</p></div>
              <strong>{selectedEntries.length}<small>ÉVÉNEMENT{selectedEntries.length > 1 ? 'S' : ''}</small></strong>
            </div>

            <div className="hd-event-list" role="tabpanel">
              {selectedEntries.map(({ event, entry }) => (
                <ArchiveEventCard key={event.id} entry={entry} playerById={playerById} currentUserId={me?.userId} />
              ))}
              {selectedEntries.length === 0 && (
                <div className="hd-phase-empty">
                  <span>{showChat || selectedPhase !== 'DAY_DISCUSSION' ? '—' : '💬'}</span>
                  <strong>AUCUN ÉVÉNEMENT AFFICHÉ</strong>
                  <p>{!showChat && eventsForRound(activeRound).some((event) => eventPhase(event) === selectedPhase && event.type === 'CHAT_MESSAGE')
                    ? 'Activez le filtre « Messages » pour consulter les échanges de cette phase.'
                    : 'Cette phase ne contient aucun événement détaillé dans les archives.'}</p>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
