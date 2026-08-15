'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getSession } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { getAvatarMap } from '@/lib/avatars';
import { sounds, isMuted, toggleMute } from '@/lib/sounds';
import Chat from '@/components/Chat';
import GamePanel from '@/components/GamePanel';

// ─── Labels ───────────────────────────────────────────────────────────────────

const PHASE_LABELS = {
  ROLE_REVEAL:     'Révélation des rôles',
  NIGHT:           'Nuit',
  NIGHT_RESOLVE:   'La nuit s\'achève…',
  MORNING_GAZETTE: 'Gazette du matin',
  DAY_DISCUSSION:  'Discussion',
  DAY_VOTE:        'Vote',
  TRIAL:           'Procès',
  JUDGMENT:        'Jugement',
  SENTENCE:        'Sentence',
  GAME_OVER:       'Fin de partie',
};

const ROLE_LABELS = {
  CITIZEN: 'Citoyen', MAFIOSO: 'Mafioso', SHERIFF: 'Shérif',
  DETECTIVE: 'Détective', INVESTIGATOR: 'Enquêteur', DOCTOR: 'Médecin', VIGILANTE: 'Vigilante',
  GODFATHER: 'Parrain', ESCORT: 'Escorte', CONSIGLIERE: 'Consigliere',
  BLACKMAILER: 'Maître chanteur', JANITOR: 'Janitor', FRAMER: 'Framer',
  LOOKOUT: 'Guetteur', BODYGUARD: 'Garde du corps', CONSORT: 'Consort', MAYOR: 'Maire',
  BUS_DRIVER: 'Chauffeur de bus', VETERAN: 'Vétéran', SPY: 'Espion',
};

const ROLE_EMOJI = {
  CITIZEN: '🏘️', MAFIOSO: '🔪', SHERIFF: '⭐', DETECTIVE: '👣',
  INVESTIGATOR: '🔎', DOCTOR: '⚕️', VIGILANTE: '🔫',
  GODFATHER: '🎩', ESCORT: '💃', CONSIGLIERE: '🕵️',
  BLACKMAILER: '🤐', JANITOR: '🧹', FRAMER: '🖋️',
  LOOKOUT: '👁️', BODYGUARD: '🛡️', CONSORT: '🥀', MAYOR: '🏛️',
  BUS_DRIVER: '🚌', VETERAN: '🎖️', SPY: '📡',
};

const NIGHT_PROMPTS = {
  MAFIOSO:     'Choisissez la victime de la famille.',
  GODFATHER:   'Ordonnez l\'assassinat — votre voix compte double.',
  SHERIFF:     'Choisissez un joueur à interroger.',
  DETECTIVE:   'Choisissez un joueur à suivre cette nuit.',
  INVESTIGATOR:'Choisissez un joueur dont rechercher les crimes.',
  CONSIGLIERE: 'Choisissez un joueur — son rôle exact vous sera révélé.',
  DOCTOR:      'Choisissez un joueur à protéger.',
  VIGILANTE:   'Choisissez une cible… ou personne.',
  ESCORT:      'Choisissez un joueur à distraire — son action sera annulée.',
  BLACKMAILER: 'Choisissez qui sera réduit au silence demain.',
  JANITOR:     'Choisissez la victime dont les preuves devront disparaître.',
  FRAMER:      'Choisissez un innocent à faire apparaître suspect.',
  LOOKOUT:     'Choisissez un joueur à placer sous surveillance.',
  BODYGUARD:   'Choisissez la personne pour laquelle vous risquerez votre vie.',
  CONSORT:     'Choisissez un joueur dont vous bloquerez l’action.',
};

const NIGHT_ACTION_ROLES = ['MAFIOSO', 'GODFATHER', 'SHERIFF', 'DETECTIVE', 'INVESTIGATOR', 'CONSIGLIERE', 'DOCTOR', 'VIGILANTE', 'ESCORT', 'BLACKMAILER', 'JANITOR', 'FRAMER', 'LOOKOUT', 'BODYGUARD', 'CONSORT', 'BUS_DRIVER', 'VETERAN'];
const DAY_PHASES = ['MORNING_GAZETTE', 'DAY_DISCUSSION', 'DAY_VOTE', 'TRIAL', 'JUDGMENT', 'SENTENCE'];

const ROLE_NIGHT_SCENES = {
  CITIZEN:      { accent: '#9a8f7d', icon: '🏘️', set: 'alley', title: 'LA VILLE DORT', action: 'OBSERVER', copy: 'Tu n’as pas d’action nocturne. Prépare tes déductions pour le lever du jour.' },
  SHERIFF:      { accent: '#d5a548', icon: '⭐', set: 'sheriff', title: 'INTERROGATOIRE', action: 'INTERROGER', copy: 'Choisis un joueur. Tu apprendras s’il paraît suspect.' },
  INVESTIGATOR: { accent: '#4cb889', icon: '🔎', set: 'evidence', title: 'LABORATOIRE CRIMINEL', action: 'RECHERCHER LES CRIMES', copy: 'Examine les traces laissées par un joueur pendant la nuit.' },
  DETECTIVE:    { accent: '#4f94d8', icon: '👣', set: 'evidence', title: 'FILATURE', action: 'SUIVRE CE JOUEUR', copy: 'Suis une cible et découvre où elle se rend cette nuit.' },
  LOOKOUT:      { accent: '#69a5cf', icon: '👁️', set: 'window', title: 'SURVEILLANCE', action: 'PLACER SOUS SURVEILLANCE', copy: 'Observe une maison et relève l’identité de tous ses visiteurs.' },
  DOCTOR:       { accent: '#68b84d', icon: '⚕️', set: 'clinic', title: 'GARDE DE NUIT', action: 'PROTÉGER CE JOUEUR', copy: 'Choisis la personne qui recevra tes soins cette nuit.' },
  BODYGUARD:    { accent: '#54a875', icon: '🛡️', set: 'guard', title: 'SOUS PROTECTION', action: 'MONTER LA GARDE', copy: 'Intercepte l’attaque visant la personne que tu protèges.' },
  ESCORT:       { accent: '#d15f91', icon: '💃', set: 'club', title: 'DISTRACTION', action: 'DISTRAIRE', copy: 'Empêche une cible d’accomplir son action nocturne.' },
  VIGILANTE:    { accent: '#cf8138', icon: '🔫', set: 'armory', title: 'JUSTICE NOCTURNE', action: 'TIRER', copy: 'Une balle peut sauver la ville — ou condamner un innocent.' },
  MAYOR:        { accent: '#a56bd2', icon: '🏛️', set: 'podium', title: 'LE POIDS DU POUVOIR', action: 'PRÉPARER LE JOUR', copy: 'Ton pouvoir s’exerce au grand jour. Décide quand révéler ton autorité.' },
  SPY:          { accent: '#4aaab6', icon: '📡', set: 'radio', title: 'ÉCOUTE CLANDESTINE', action: 'INTERCEPTER', copy: 'Reste à l’écoute des mouvements de la Mafia.' },
  VETERAN:      { accent: '#b68745', icon: '🎖️', set: 'armory', title: 'DERNIÈRE GARDE', action: 'RESTER SUR SES GARDES', copy: 'La moindre visite peut devenir une menace.' },
  GODFATHER:    { accent: '#a866d5', icon: '🎩', set: 'office', title: 'L’ORDRE DU PARRAIN', action: 'ORDONNER L’ASSASSINAT', copy: 'Choisis la victime de la famille. Ta décision fait autorité.' },
  MAFIOSO:      { accent: '#d54e43', icon: '🔪', set: 'alley', title: 'LE CONTRAT', action: 'CHOISIR LA CIBLE', copy: 'Exécute le meurtre décidé avec ta famille.' },
  CONSIGLIERE:  { accent: '#bd665d', icon: '🕵️', set: 'office', title: 'DOSSIERS DE LA FAMILLE', action: 'DÉCOUVRIR LE RÔLE', copy: 'Identifie le rôle exact d’une cible pour conseiller la Mafia.' },
  CONSORT:      { accent: '#bd4e78', icon: '🥀', set: 'club', title: 'RENDEZ-VOUS SECRET', action: 'BLOQUER CETTE CIBLE', copy: 'Neutralise l’action nocturne d’un adversaire.' },
  BLACKMAILER:  { accent: '#c54b43', icon: '🤐', set: 'office', title: 'LE DOSSIER COMPROMETTANT', action: 'FAIRE CHANTER', copy: 'Choisis qui sera privé de parole au lever du jour.' },
  JANITOR:      { accent: '#9f554d', icon: '🧹', set: 'morgue', title: 'EFFACER LES TRACES', action: 'PRÉPARER LE NETTOYAGE', copy: 'Cache le rôle et le testament de la prochaine victime.' },
  FRAMER:       { accent: '#c87542', icon: '🖋️', set: 'evidence', title: 'FABRIQUER LES PREUVES', action: 'PIÉGER CETTE CIBLE', copy: 'Fais paraître un innocent suspect aux yeux des enquêteurs.' },
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function GamePage() {
  const router = useRouter();
  const { id: gameId } = useParams();

  const [session, setSession]     = useState(null);
  const [phase, setPhase]         = useState('');
  const [round, setRound]         = useState(1);
  const [endAt, setEndAt]         = useState(0);
  const [startAt, setStartAt]     = useState(0);
  const [now, setNow]             = useState(Date.now());
  const [avatarMap, setAvatarMap] = useState({});
  const [players, setPlayers]     = useState([]);
  const [role, setRole]           = useState(null);   // { role, team, description }
  const [votes, setVotes]         = useState({});
  const [gazette, setGazette]     = useState([]);
  const [trial, setTrial]         = useState(null);
  const [judgment, setJudgment]   = useState(null);   // { votes, guilty, innocent, abstain }
  const [myVerdict, setMyVerdict] = useState(null);
  const [sentence, setSentence]   = useState(null);
  const [winner, setWinner]       = useState(null);
  const [rewards, setRewards]     = useState(null);   // { diamondsEarned, newAchievements }
  const [nightTarget, setNightTarget]     = useState(null);
  const [nightSecondaryTarget, setNightSecondaryTarget] = useState(null);
  const [actionConfirmed, setActionConfirmed] = useState(false);
  const [myVote, setMyVote]       = useState(null);
  const [detective, setDetective] = useState(null);
  const [nightMsg, setNightMsg]   = useState('');
  const [skipInfo, setSkipInfo]   = useState(null);   // { count, total, voterIds }
  const [will, setWill]           = useState('');
  const [offline, setOffline]     = useState([]);     // userIds momentarily disconnected
  const [toasts, setToasts]       = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [intelOpen, setIntelOpen] = useState(true);
  const [notes, setNotes]         = useState({});     // userId → { text, suspicion }
  const [evidence, setEvidence]   = useState([]);
  const [blackmailedRound, setBlackmailedRound] = useState(null);
  const [gameLog, setGameLog]     = useState([]);     // { icon, text, round }
  const [muted, setMuted]         = useState(true);
  const [roleHidden, setRoleHidden] = useState(true);
  useEffect(() => { setMuted(isMuted()); }, []);

  const socketRef = useRef(null);
  const noteTimers = useRef({});
  const toastId   = useRef(0);
  const roundRef  = useRef(1);
  useEffect(() => { roundRef.current = round; }, [round]);

  const addLog = useCallback((icon, text) => {
    setGameLog((l) => [...l, { icon, text, round: roundRef.current }]);
  }, []);

  const toast = useCallback((text) => {
    const tid = ++toastId.current;
    setToasts((t) => [...t, { id: tid, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== tid)), 5000);
  }, []);

  // ── Socket wiring ───────────────────────────────────────────────────────────
  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace('/'); return; }
    setSession(s);

    const socket = getSocket();
    socketRef.current = socket;

    getAvatarMap().then(setAvatarMap);

    const onSync = (d) => {
      setPhase(d.phase); setRound(d.round ?? 1);
      if (d.endAt)   setEndAt(d.endAt);
      if (d.startAt) setStartAt(d.startAt);
      if (d.players) setPlayers(d.players);
      if (d.votes)   setVotes(d.votes);
      if (d.evidenceBoard) setEvidence(d.evidenceBoard);
    };
    const onPhase = (d) => {
      setPhase(d.phase);
      if (d.round) setRound(d.round);
      setEndAt(d.endAt ?? 0);
      setStartAt(d.startAt ?? 0);
      setSkipInfo(null);
      if (d.phase === 'NIGHT') {
        setNightTarget(null); setNightSecondaryTarget(null); setActionConfirmed(false);
        setDetective(null); setNightMsg('');
        addLog('🌙', `Début de la nuit ${d.round ?? ''}`);
        sounds.night();
      }
      if (d.phase === 'MORNING_GAZETTE') sounds.morning();
      if (d.phase === 'TRIAL') sounds.gong();
      if (d.phase === 'DAY_DISCUSSION') addLog('💬', 'Le jour se lève — discussion.');
      if (d.phase === 'DAY_VOTE') { setMyVote(null); addLog('🗳️', 'Ouverture du vote.'); }
      if (d.phase === 'JUDGMENT') { setJudgment(null); setMyVerdict(null); }
      if (!['TRIAL', 'JUDGMENT', 'SENTENCE'].includes(d.phase)) {
        setTrial(null); setSentence(null);
      }
    };
    const onPublic   = (d) => {
      if (d?.players) setPlayers(d.players);
      if (d?.votes) setVotes(d.votes);
      if (d?.evidenceBoard) setEvidence(d.evidenceBoard);
    };
    const onRole     = (d) => setRole(d);
    const onVotes    = (d) => setVotes(d.tally ?? {});
    const onGazette  = (d) => {
      const entries = d.entries ?? [];
      setGazette((prev) => {
        // Log only newly arrived entries.
        for (const e of entries.slice(prev.length)) {
          if (e.noElimination) addLog('🕊️', 'Nuit calme — personne n\'est mort.');
          else addLog('☠️', `${e.eliminatedUsername} éliminé — ${e.eliminatedRole}`);
        }
        return entries;
      });
    };
    const onTrial    = (d) => { setTrial(d); addLog('⚖️', `${d.accusedUsername} envoyé au procès.`); };
    const onJudgVotes = (d) => setJudgment(d);
    const onExec     = (d) => {
      setSentence({ type: 'executed', username: d.username, role: d.role, will: d.will });
      addLog('🔨', `${d.username} exécuté — ${d.role}`);
      sounds.death();
    };
    const onAcquit   = ()  => { setSentence({ type: 'acquitted' }); addLog('🕊️', 'Accusé acquitté.'); };
    const onOver     = (d) => {
      setWinner(d);
      const meP = d.players?.find((p) => p.userId === getSession()?.userId);
      if (meP && d.winner === meP.team) sounds.victory(); else sounds.defeat();
    };
    const onRewards  = (d) => setRewards(d);
    const onDet      = (d) => setDetective({ ...d, kind: 'team' });
    const onCons     = (d) => setDetective({ ...d, kind: 'role' });
    const onTracker  = (d) => setDetective({ ...d, kind: 'visit' });
    const onLookout  = (d) => setDetective({ ...d, kind: 'watch' });
    const onInvestigator = (d) => setDetective({ ...d, kind: 'crimes' });
    const onSpy = (d) => setDetective({ ...d, kind: 'spy' });
    const onBusDriver = (d) => toast(`🚌 ${d.firstUsername} et ${d.secondUsername} ont échangé de destination.`);
    const onVeteran = (d) => toast((d.visitorUsernames ?? []).length
      ? `🎖️ Alerte : ${(d.visitorUsernames ?? []).join(', ')} vous a rendu visite.`
      : '🎖️ Alerte : personne ne vous a rendu visite.');
    const onActionOk = (d) => setActionConfirmed(Boolean(d?.ok));
    const onSkip     = (d) => setSkipInfo(d);
    const onChat     = (m) => {
      setChatMessages((prev) => [...prev.slice(-199), m]);
      sounds.tick();
    };
    const onSaved    = ()  => toast('⚕️ Vous avez été attaqué cette nuit… mais quelqu\'un vous a sauvé.');
    const onDocSaved = (d) => toast(`⚕️ Votre protection a sauvé ${d.savedUsername} cette nuit !`);
    const onBodyguardSaved = (d) => toast(`🛡️ ${d.guardUsername} s’est sacrifié pour vous sauver.`);
    const onBodyguardSacrifice = (d) => toast(`🛡️ Vous vous êtes sacrifié pour sauver ${d.protectedUsername}.`);
    const onBlackmailed = (d) => {
      setBlackmailedRound(d.round);
      toast('🤐 La Mafia vous a réduit au silence pour la journée.');
    };
    const onChatBlocked = (d) => {
      if (d?.reason === 'BLACKMAILED') toast('🤐 Vous êtes réduit au silence aujourd’hui.');
    };
    const onNotebook = (d) => setNotes(d.entries ?? {});
    const onEvidence = (d) => setEvidence(d.items ?? []);
    const onDisc     = (d) => setOffline((o) => [...new Set([...o, d.userId])]);
    const onReco     = (d) => setOffline((o) => o.filter((u) => u !== d.userId));
    const onNightRes = (d) => {
      const deaths = d.deaths ?? (d.killed ? [d.killed] : []);
      if (deaths.length === 0) {
        setNightMsg(d.saved ? 'Quelqu\'un a frôlé la mort cette nuit.' : 'La nuit fut calme.');
      } else {
        setNightMsg(deaths.map((k) => `${k.username} a été éliminé`).join(' · '));
      }
    };

    socket.on('game:sync',                onSync);
    socket.on('phase:start',              onPhase);
    socket.on('game:public_state',        onPublic);
    socket.on('game:role_assigned',       onRole);
    socket.on('vote:update',              onVotes);
    socket.on('gazette:published',        onGazette);
    socket.on('trial:started',            onTrial);
    socket.on('judgment:voted',           onJudgVotes);
    socket.on('sentence:executed',        onExec);
    socket.on('sentence:acquitted',       onAcquit);
    socket.on('game:over',                onOver);
    socket.on('game:rewards',             onRewards);
    socket.on('night:detective_result',   onDet);
    socket.on('night:consigliere_result', onCons);
    socket.on('night:tracker_result',      onTracker);
    socket.on('night:lookout_result',      onLookout);
    socket.on('night:investigator_result', onInvestigator);
    socket.on('night:spy_result',           onSpy);
    socket.on('night:bus_driver_result',    onBusDriver);
    socket.on('night:veteran_result',       onVeteran);
    socket.on('night:action_received',    onActionOk);
    socket.on('night:result',             onNightRes);
    socket.on('night:you_were_saved',     onSaved);
    socket.on('night:doctor_saved',       onDocSaved);
    socket.on('night:bodyguard_saved',    onBodyguardSaved);
    socket.on('night:bodyguard_sacrifice', onBodyguardSacrifice);
    socket.on('night:blackmailed',        onBlackmailed);
    socket.on('chat:blocked',             onChatBlocked);
    socket.on('notebook:sync',            onNotebook);
    socket.on('evidence:updated',          onEvidence);
    socket.on('phase:skip_votes_updated', onSkip);
    socket.on('game:player_disconnected', onDisc);
    socket.on('game:player_reconnected',  onReco);
    socket.on('chat:message',             onChat);

    socket.emit('game:join', { gameId });

    // Auto re-join after a socket reconnection (wifi blip, laptop sleep…):
    // the server re-sends game:sync + our private role, play resumes seamlessly.
    const onReconnect = () => socket.emit('game:join', { gameId });
    socket.on('connect', onReconnect);

    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(tick);
      Object.values(noteTimers.current).forEach(clearTimeout);
      ['game:sync', 'phase:start', 'game:public_state', 'game:role_assigned',
       'vote:update', 'gazette:published', 'trial:started', 'judgment:voted',
       'sentence:executed', 'sentence:acquitted', 'game:over', 'game:rewards',
       'night:detective_result', 'night:consigliere_result', 'night:tracker_result', 'night:lookout_result', 'night:investigator_result', 'night:spy_result', 'night:bus_driver_result', 'night:veteran_result', 'night:action_received', 'night:result',
       'night:you_were_saved', 'night:doctor_saved', 'phase:skip_votes_updated',
       'night:blackmailed', 'night:bodyguard_saved', 'night:bodyguard_sacrifice', 'chat:blocked', 'notebook:sync', 'evidence:updated',
       'game:player_disconnected', 'game:player_reconnected', 'chat:message',
      ].forEach((e) => socket.off(e));
      socket.off('connect', onReconnect);
    };
  }, [gameId, router, toast, addLog]);

  // ── Derived state ───────────────────────────────────────────────────────────
  const me      = players.find((p) => p.userId === session?.userId);
  const isAlive = me?.isAlive ?? true;
  const mafiaTeammates = role?.team === 'MAFIA' ? (role.teammates ?? []) : [];
  const mafiaTeammateIds = new Set(mafiaTeammates.map((p) => p.userId));

  const canActAtNight =
    phase === 'NIGHT' && isAlive && role && NIGHT_ACTION_ROLES.includes(role.role);

  const isNightPhase = phase === 'NIGHT' || phase === 'NIGHT_RESOLVE';
  const isSilenced = isAlive && (
    Boolean(me?.silenced) || (blackmailedRound === round && DAY_PHASES.includes(phase))
  );

  const chatChannels = [];
  if (!isAlive) chatChannels.push('dead');
  chatChannels.push('day');
  if (isAlive && role?.team === 'MAFIA' && isNightPhase) {
    chatChannels.unshift('mafia');
  }
  const canWrite =
    (!isAlive) ||
    (isAlive && !isSilenced && DAY_PHASES.includes(phase)) ||
    (isAlive && role?.team === 'MAFIA' && isNightPhase);

  const remaining = endAt > now ? Math.round((endAt - now) / 1000) : 0;
  const duration  = endAt > startAt ? endAt - startAt : 1;
  const progress  = endAt > now ? Math.max(0, Math.min(100, ((endAt - now) / duration) * 100)) : 0;

  // Ambiance class per phase
  const ambiance =
    phase === 'NIGHT' || phase === 'NIGHT_RESOLVE' ? 'night'
    : phase === 'TRIAL' || phase === 'JUDGMENT' ? 'trial'
    : phase === 'SENTENCE' ? 'danger'
    : DAY_PHASES.includes(phase) ? 'day'
    : '';
  const bannerTone = ambiance === 'trial' ? 'danger' : ambiance;

  // ── Actions ─────────────────────────────────────────────────────────────────
  const send = useCallback((event, payload) =>
    socketRef.current?.emit(event, { gameId, ...payload }), [gameId]);

  function canTargetPlayer(p) {
    if (!p.isAlive) return false;
    if (phase === 'DAY_VOTE') return isAlive && p.userId !== session?.userId;
    if (!canActAtNight) return false;
    if (role?.role === 'VETERAN') return p.userId === session?.userId;
    if (role?.role === 'DOCTOR') return true;
    if (p.userId === session?.userId) return false;
    if (role?.team === 'MAFIA' && mafiaTeammateIds.has(p.userId)) return false;
    return true;
  }

  function clickPlayer(p) {
    if (!canTargetPlayer(p)) return;
    if (canActAtNight) {
      if (role?.role === 'BUS_DRIVER') {
        if (!nightTarget || nightSecondaryTarget) {
          setNightTarget(p.userId);
          setNightSecondaryTarget(null);
          setActionConfirmed(false);
          return;
        }
        if (nightTarget === p.userId) {
          setNightTarget(null);
          return;
        }
        setNightSecondaryTarget(p.userId);
        setActionConfirmed(false);
        send('night:action', { targetId: nightTarget, secondaryTargetId: p.userId });
        return;
      }
      setNightTarget(p.userId);
      setActionConfirmed(false);
      send('night:action', { targetId: p.userId });
    } else if (phase === 'DAY_VOTE' && isAlive) {
      setMyVote(p.userId);
      send('vote:cast', { targetId: p.userId });
    }
  }

  function castVerdict(verdict) {
    setMyVerdict(verdict);
    send('judgment:vote', { verdict });
  }

  function saveWill() {
    send('will:update', { text: will });
    toast('📜 Testament enregistré.');
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  if (!session) return null;

  // ═══ Game over ═══
  if (winner) {
    const mafiaWon = winner.winner === 'MAFIA';
    return (
      <main className={`game-over-screen ${mafiaWon ? 'mafia-victory' : 'village-victory'}`}>
        <div className={`ambiance on ${mafiaWon ? 'ambiance-danger' : 'ambiance-day'}`} />
        <div className="end-vignette" aria-hidden="true" />
        <section className="game-over-content">
          <div className="page-eyebrow">DOSSIER DE PARTIE CLOS</div>
          <div className="victory-emblem">{mafiaWon ? '◆' : '✦'}</div>
          <h1>{mafiaWon ? 'LA MAFIA TRIOMPHE' : 'LA TOWN TRIOMPHE'}</h1>
          <p>La ville connaît enfin la vérité. Tous les rôles sont révélés.</p>

          {rewards && (
            <div className="reward-summary">
              <div><span>RÉCOMPENSE</span><strong>+{rewards.diamondsEarned} 💎</strong></div>
              {(rewards.newAchievements ?? []).map((a) => (
                <div key={a.id} className="reward-achievement">
                  <span>{a.icon}</span>
                  <p><strong>{a.name}</strong><small>{a.description} · +{a.diamondReward} 💎</small></p>
                </div>
              ))}
            </div>
          )}

          <div className="final-roster">
            {(winner.players ?? []).map((p) => (
              <div key={p.userId} className={`final-player ${p.team === 'MAFIA' ? 'mafia' : 'village'} ${p.isAlive ? '' : 'eliminated'}`}>
                <span className="final-role-icon">{ROLE_EMOJI[p.role] ?? '❓'}</span>
                <div><strong>{p.username}</strong><small>{ROLE_LABELS[p.role] ?? p.role}</small></div>
                <span className="final-status">{p.isAlive ? 'SURVIVANT' : 'ÉLIMINÉ'}</span>
              </div>
            ))}
          </div>

          <ReplayTimeline events={winner.replay ?? []} players={winner.players ?? []} />

          <button className="btn-gold end-return" onClick={() => router.push('/lobby')}>
            RETOURNER AU LOBBY <span>→</span>
          </button>
        </section>
      </main>
    );
  }

  // ═══ Role reveal ═══
  if (phase === 'ROLE_REVEAL') {
    return (
      <main className="role-reveal-screen">
        <div className="ambiance ambiance-night on" />
        <div className="reveal-vignette" aria-hidden="true" />
        <div className="reveal-particles" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => <span key={i} />)}
        </div>
        {role ? (
          <section className={`role-reveal-stage ${role.team === 'MAFIA' ? 'mafia' : 'village'}`}>
            <div className="reveal-kicker"><span /> VOTRE IDENTITÉ POUR CETTE NUIT <span /></div>

            <div className="role-card-wrap">
              <div className="role-card-aura" aria-hidden="true" />
              <div className="role-reveal-card">
                <i className="card-corner corner-tl" /><i className="card-corner corner-tr" />
                <i className="card-corner corner-bl" /><i className="card-corner corner-br" />
                <div className="role-card-classified">DOSSIER CONFIDENTIEL · TOUR {round}</div>
                <div className="role-sigil">
                  <span className="sigil-ring" aria-hidden="true" />
                  <div className="role-icon">{ROLE_EMOJI[role.role] ?? '❓'}</div>
                </div>
                <div className="role-reveal-copy">
                  <div className="role-overline">VOUS ÊTES</div>
                  <h1 className="role-name">{(ROLE_LABELS[role.role] ?? role.role).toUpperCase()}</h1>
                  <div className="role-team-name">
                    {role.team === 'MAFIA' ? 'FAMILLE MAFIA' : 'ALLIANCE TOWN'}
                  </div>
                  <div className="role-divider"><span>◆</span></div>
                  <p>{role.description}</p>
                  {role.team === 'MAFIA' && (
                    <div className="mafia-accomplices">
                      <div className="accomplices-title">
                        <span>VOS COMPLICES</span>
                        <small>{mafiaTeammates.length + 1} MEMBRES</small>
                      </div>
                      {mafiaTeammates.length > 0 ? (
                        <div className="accomplices-list">
                          {mafiaTeammates.map((mate) => (
                            <div key={mate.userId} className="accomplice">
                              <span className="accomplice-mark">◆</span>
                              <div>
                                <strong>{mate.username}</strong>
                                <small>{ROLE_LABELS[mate.role] ?? mate.role}{mate.isBot ? ' · BOT' : ''}</small>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="accomplices-empty">Vous êtes le seul membre de la Mafia.</p>
                      )}
                    </div>
                  )}
                  <div className="role-secret">NE RÉVÉLEZ VOTRE IDENTITÉ À PERSONNE</div>
                </div>
              </div>
            </div>

            <div className="role-reveal-countdown">
              <div>
                <span>LA PARTIE COMMENCE</span>
                <strong>{remaining > 0 ? `${remaining}s` : 'BIENTÔT'}</strong>
              </div>
              <div className="reveal-progress">
                <span style={{ width: `${progress}%` }} />
              </div>
            </div>
          </section>
        ) : (
          <div className="role-dealing">
            <div className="dealing-card"><span>LG</span></div>
            <div className="page-eyebrow">DISTRIBUTION DES RÔLES</div>
            <p>La ville choisit votre destin…</p>
          </div>
        )}
      </main>
    );
  }

  function updateNote(subjectId, entry) {
    const normalized = { text: entry.text ?? '', suspicion: entry.suspicion ?? '?' };
    setNotes((current) => ({ ...current, [subjectId]: normalized }));
    clearTimeout(noteTimers.current[subjectId]);
    noteTimers.current[subjectId] = setTimeout(() => {
      send('notebook:update', { subjectId, ...normalized });
    }, 350);
  }

  function addEvidence(item) {
    send('evidence:add', item);
  }

  function removeEvidence(evidenceId) {
    send('evidence:remove', { evidenceId });
  }

  // ═══ Night resolve — suspense ═══
  if (phase === 'NIGHT_RESOLVE' && !(role?.team === 'MAFIA' && isAlive)) {
    return (
      <main className="night-resolve-screen">
        <div className="ambiance ambiance-night on" />
        <div className="night-resolve-vignette" aria-hidden="true" />
        <div className="night-moon" aria-hidden="true"><span>☾</span></div>
        <section className="night-resolve-content">
          <div className="page-eyebrow">NUIT {round} · LA VILLE RETIENT SON SOUFFLE</div>
          <h1>LA NUIT S&apos;ACHÈVE…</h1>
          <div className="night-ornament"><span>◆</span></div>
          <p>{nightMsg || 'Dans l’ombre, chaque décision produit ses conséquences.'}</p>
          <div className="night-resolve-progress"><span /></div>
          <small>RÉSOLUTION DES ACTIONS EN COURS</small>
        </section>
        <div className="night-silhouettes" aria-hidden="true">
          <i /><i /><i /><i /><i />
        </div>
        <ToastZone toasts={toasts} />
      </main>
    );
  }

  // ═══ Main board — table ronde (v2) ═══

  const sceneBg = ({
    night:  '/bg/nuit.webp',
    day:    '/bg/jour.webp',
    trial:  '/bg/proces.webp',
    danger: '/bg/sentence.webp',
  })[ambiance] ?? '/bg/nuit.webp';

  const N = Math.max(players.length, 1);
  const seatStyle = (i) => {
    const a = (i / N) * 2 * Math.PI - Math.PI / 2;
    return {
      left: `${50 + 41 * Math.cos(a)}%`,
      top:  `${52 + 37 * Math.sin(a)}%`,
    };
  };

  const shortCode = gameId.slice(-4).toUpperCase();
  const isDayTone = ambiance === 'day';
  const aliveCount = players.filter((p) => p.isAlive).length;

  // Main action pill content per phase
  let mainAction = { label: PHASE_LABELS[phase] ?? '…', sub: '' };
  if (phase === 'NIGHT') {
    mainAction = canActAtNight
      ? {
          label: actionConfirmed ? '✓ ACTION ENREGISTRÉE' : 'CHOISIS TA CIBLE',
          sub: actionConfirmed
            ? 'Modifiable jusqu\'à la fin de la nuit'
            : NIGHT_PROMPTS[role?.role] ?? '',
        }
      : { label: '🌙 LA VILLE DORT', sub: 'Vous n\'avez pas d\'action cette nuit' };
  } else if (phase === 'MORNING_GAZETTE') {
    mainAction = { label: '📰 LA GAZETTE', sub: nightMsg || 'Les nouvelles du matin' };
  } else if (phase === 'DAY_DISCUSSION') {
    mainAction = { label: '💬 DISCUSSION EN COURS', sub: 'Débattez dans le chat — trouvez la Mafia' };
  } else if (phase === 'DAY_VOTE') {
    mainAction = myVote
      ? { label: '✓ VOTE ENREGISTRÉ', sub: 'Cliquez un autre joueur pour changer' }
      : { label: '🗳️ VOTE EN COURS', sub: 'Cliquez sur un joueur autour de la table' };
  } else if (phase === 'TRIAL') {
    mainAction = { label: '⚖️ PROCÈS', sub: `${trial?.accusedUsername ?? '…'} présente sa défense` };
  } else if (phase === 'JUDGMENT') {
    mainAction = { label: '⚖️ JUGEMENT', sub: `Le sort de ${trial?.accusedUsername ?? '…'} est entre vos mains` };
  } else if (phase === 'SENTENCE') {
    mainAction = sentence?.type === 'executed'
      ? { label: '🔨 SENTENCE', sub: `${sentence.username} a été exécuté` }
      : { label: '🕊️ ACQUITTÉ', sub: 'Le doute a profité à l\'accusé' };
  }

  const gazetteNow = phase === 'MORNING_GAZETTE'
    ? gazette.filter((e) => e.round === round)
    : [];

  return (
    <div className="game-shell">
      {/* ── Top bar ── */}
      <div className="game-topbar">
        <div className="left">
          <span className="game-code">PARTIE #{shortCode}</span>
          <span className="game-sub">{aliveCount} / {players.length} joueurs en vie</span>
        </div>

        <div className="daynight">
          <span style={{ fontSize: 16, opacity: isDayTone ? 1 : 0.3 }}>☀️</span>
          <div className="track sun">
            <div style={{ width: isDayTone ? `${progress}%` : '0%' }} />
          </div>
          <div className="phase-pill">
            <div className="big">
              {ambiance === 'night' ? `NUIT ${round}` : `JOUR ${round}`}
            </div>
            <div className="small">{PHASE_LABELS[phase] ?? '…'}</div>
          </div>
          <div className="track moon">
            <div style={{ width: ambiance === 'night' ? `${progress}%` : '0%' }} />
          </div>
          <span style={{ fontSize: 16, opacity: ambiance === 'night' ? 1 : 0.3 }}>🌙</span>
        </div>

        <div className="right">
          <div className={`timer-chip ${remaining <= 10 && remaining > 0 ? 'urgent' : ''}`}>
            ⏱ {String(Math.floor(remaining / 60)).padStart(1, '0')}:{String(remaining % 60).padStart(2, '0')}
            <span className="lbl">FIN DU TOUR</span>
          </div>
          <button style={{ fontSize: 14, padding: '8px 12px' }}
                  title={muted ? 'Activer le son' : 'Couper le son'}
                  onClick={() => setMuted(toggleMute())}>
            {muted ? '🔇' : '🔊'}
          </button>
          <button className="danger" style={{ fontSize: 10, padding: '10px 14px' }}
                  onClick={() => router.push('/lobby')}>
            QUITTER
          </button>
        </div>
      </div>

      {/* ── Main : chat | table | rail ── */}
      <div className="game-main">
        {/* Left: chat */}
        <div className="side-panel">
          {isSilenced && <div className="silenced-banner">🤐 RÉDUIT AU SILENCE</div>}
          <Chat
            messages={chatMessages}
            available={chatChannels}
            canWrite={canWrite}
            onSend={(message) => send('chat:send', { message })}
            log={gameLog}
          />
        </div>

        {/* Center: table scene */}
        <div className={`table-scene scene-${ambiance || 'night'} phase-${phase.toLowerCase().replaceAll('_', '-')}`} style={{ backgroundImage: `url('${sceneBg}')` }}>
          <PhaseCenterStage
            phase={phase}
            round={round}
            remaining={remaining}
            role={role}
            players={players}
            avatarMap={avatarMap}
            sessionId={session.userId}
            isAlive={isAlive}
            nightTarget={nightTarget}
            nightSecondaryTarget={nightSecondaryTarget}
            actionConfirmed={actionConfirmed}
            canTargetPlayer={canTargetPlayer}
            clickPlayer={clickPlayer}
            mafiaTeammateIds={mafiaTeammateIds}
            gazetteNow={gazetteNow}
            nightMsg={nightMsg}
            detective={detective}
            trial={trial}
            sentence={sentence}
            votes={votes}
            myVote={myVote}
            myVerdict={myVerdict}
            judgment={judgment}
            castVerdict={castVerdict}
            onOpenNotebook={() => setPanelOpen(true)}
            onSkip={() => send('phase:skip_vote', {})}
            skipInfo={skipInfo}
          />
          <InvestigationHud
            open={intelOpen}
            onToggle={() => setIntelOpen((value) => !value)}
            onOpenDossier={() => setPanelOpen(true)}
            notes={notes}
            evidence={evidence}
            players={players}
            result={detective}
            round={round}
          />
          <div className="table-oval" />

          {/* Contextual banners */}
          {gazetteNow.map((e, i) =>
            e.noElimination ? (
              <div key={i} className="scene-banner gold" style={{ top: 12 + i * 54 }}>
                🌙 La nuit fut calme. Personne n&apos;a perdu la vie.
              </div>
            ) : (
              <div key={i} className="scene-banner danger" style={{ top: 12 + i * 54 }}>
                ☠️ <b>{e.eliminatedUsername}</b> a été éliminé — {e.eliminatedRole ? (ROLE_LABELS[e.eliminatedRole] ?? e.eliminatedRole) : 'RÔLE INCONNU'}
                {e.message ? <div className="dim" style={{ fontSize: 12 }}>{e.message}</div> : null}
                {e.will ? <div className="dim" style={{ fontSize: 12, fontStyle: 'italic' }}>📜 « {e.will} »</div> : null}
              </div>
            ),
          )}
          {detective && phase !== 'MORNING_GAZETTE' && (
            <div className="scene-banner info">
              {detective.kind === 'role'
                ? <>🕵️ <b>{detective.targetUsername}</b> est <b style={{ color: 'var(--gold-hi)' }}>{ROLE_LABELS[detective.role] ?? detective.role}</b></>
                : detective.kind === 'crimes'
                  ? <>🔎 Crimes de <b>{detective.targetUsername}</b> : <b>{(detective.crimes ?? []).join(', ') || 'aucun crime connu'}</b>.</>
                : detective.kind === 'visit'
                  ? <>👣 <b>{detective.targetUsername}</b> a visité <b>{detective.visitedUsername ?? 'personne'}</b>.</>
                  : detective.kind === 'watch'
                    ? <>👁️ Visiteurs de <b>{detective.targetUsername}</b> : <b>{(detective.visitorUsernames ?? []).join(', ') || 'aucun'}</b>.</>
                    : <>🔍 <b>{detective.targetUsername}</b> est du camp{' '}
                    <b style={{ color: detective.team === 'MAFIA' ? 'var(--red-hi)' : 'var(--blue)' }}>
                      {detective.team === 'MAFIA' ? 'MAFIA' : 'TOWN'}
                    </b></>}
            </div>
          )}
          {trial && (phase === 'TRIAL' || phase === 'JUDGMENT') && !detective && (
            <div className="scene-banner danger">
              ⚖️ <b>{trial.accusedUsername}</b> est accusé
              {trial.accusedId === session.userId && ' — défendez-vous dans le chat !'}
            </div>
          )}
          {sentence && phase === 'SENTENCE' && (
            <div className={`scene-banner ${sentence.type === 'acquitted' ? 'gold' : 'danger'}`}>
              {sentence.type === 'executed'
                ? <>🔨 <b>{sentence.username}</b> exécuté — {ROLE_LABELS[sentence.role] ?? sentence.role}
                    {sentence.will ? <div className="dim" style={{ fontSize: 12, fontStyle: 'italic' }}>📜 « {sentence.will} »</div> : null}</>
                : <>🕊️ L&apos;accusé a été acquitté.</>}
            </div>
          )}

          {!isAlive && (
            <div className="scene-banner danger spectator-banner">
              💀 VOUS ÊTES ÉLIMINÉ — MODE SPECTATEUR
            </div>
          )}

          {/* Seats */}
          {players.map((p, i) => {
            const voteCount  = (votes[p.userId] ?? []).length;
            const selectable = canTargetPlayer(p);
            const selected = (phase === 'NIGHT' && nightTarget === p.userId) ||
                             (phase === 'DAY_VOTE' && myVote === p.userId);
            const avatarUrl = p.avatarId ? avatarMap[p.avatarId] : null;
            const isOffline = offline.includes(p.userId);
            return (
              <div key={p.userId}
                   className={[
                     'seat',
                     p.isAlive ? '' : 'dead',
                     selectable ? 'selectable' : '',
                     selected ? 'selected' : '',
                     mafiaTeammateIds.has(p.userId) ? 'teammate' : '',
                     p.userId === session.userId ? 'me' : '',
                   ].join(' ')}
                   style={seatStyle(i)}
                   onClick={() => selectable && clickPlayer(p)}>
                <div className="seat-avatar">
                  <span className="seat-num">{i + 1}</span>
                  {avatarUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={avatarUrl} alt="" />
                    : (p.isBot ? '🤖' : (p.username?.[0]?.toUpperCase() ?? '?'))}
                </div>
                <div className="seat-name">
                  {p.username}{isOffline ? ' 📡' : ''}
                </div>
                {phase === 'DAY_VOTE' && voteCount > 0 && p.isAlive && (
                  <div className="seat-votes">{voteCount} vote{voteCount > 1 ? 's' : ''}</div>
                )}
                {!p.isAlive && p.role && (
                  <div className="seat-name" style={{ fontSize: 9, color: 'var(--text-dim)' }}>
                    {ROLE_LABELS[p.role] ?? p.role}
                  </div>
                )}
                {!p.isAlive && p.roleHidden && (
                  <div className="seat-name cleaned-role">PREUVES NETTOYÉES</div>
                )}
              </div>
            );
          })}

          {/* ── Contextual actions, anchored to the table ── */}
          <div className="game-actions">
            {phase === 'JUDGMENT' && isAlive && trial && trial.accusedId !== session.userId ? (
              <>
                <button className="danger verdict-btn" onClick={() => castVerdict('GUILTY')}>
                  COUPABLE {myVerdict === 'GUILTY' ? '✓' : ''}
                </button>
                <button className="primary verdict-btn" onClick={() => castVerdict('INNOCENT')}>
                  INNOCENT {myVerdict === 'INNOCENT' ? '✓' : ''}
                </button>
                <button className="verdict-btn" onClick={() => castVerdict('ABSTAIN')}>
                  ABSTENTION {myVerdict === 'ABSTAIN' ? '✓' : ''}
                </button>
              </>
            ) : (
              <div className="action-main">
                <span className="cinzel">{mainAction.label}</span>
                {mainAction.sub && <span className="sub">{mainAction.sub}</span>}
              </div>
            )}

            <button className="action-sq" title="Dossier de partie"
                    onClick={() => setPanelOpen(true)}>
              📖<span className="lbl">CARNET</span>
            </button>
            {isAlive && DAY_PHASES.includes(phase) && phase !== 'JUDGMENT' && (
              <button className="action-sq" title="Passer la phase"
                      onClick={() => send('phase:skip_vote', {})}>
                ⏭<span className="lbl">{skipInfo ? `${skipInfo.count}/${skipInfo.total}` : 'PASSER'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: rail */}
        <div className="side-panel">
          {/* Joueurs */}
          <div className="panel-card roster-panel">
            <div className="panel-title">JOUEURS <span className="dim">{aliveCount}/{players.length}</span></div>
            {players.map((p) => (
              <div key={p.userId}
                   className={`roster-row ${p.isAlive ? '' : 'dead-row'} ${mafiaTeammateIds.has(p.userId) ? 'mafia-mate-row' : ''}`}>
                <span className="dot" />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.username}
                  {p.userId === session.userId ? ' (vous)' : ''}
                  {p.isBot && <span className="bot-chip">BOT</span>}
                </span>
                {mafiaTeammateIds.has(p.userId) && <span className="mafia-mate-badge">MAFIA</span>}
                {p.roleHidden && <span className="cleaned-badge">NETTOYÉ</span>}
                {!p.isAlive && <span style={{ fontSize: 11 }}>💀</span>}
              </div>
            ))}
          </div>

          {/* Votation */}
          {(phase === 'DAY_VOTE' || phase === 'JUDGMENT') && (
            <div className="panel-card voting-panel">
              <div className="panel-title">
                VOTATION ACTUELLE
                {remaining > 0 && <span className="timer-bubble">{remaining}s</span>}
              </div>
              {phase === 'JUDGMENT' && judgment ? (
                <>

                  <div className="dim" style={{ fontSize: 13, marginBottom: 4 }}>
                    {trial?.accusedUsername} est accusé
                  </div>
                  <div className="votation-vs">
                    <div className="side guilty">
                      <div className="num">{judgment.guilty}</div>
                      <div className="lbl">COUPABLE</div>
                    </div>
                    <span className="vs">VS</span>
                    <div className="side innocent">
                      <div className="num">{judgment.innocent}</div>
                      <div className="lbl">INNOCENT</div>
                    </div>
                  </div>
                  {judgment.abstain > 0 && (
                    <div className="dim" style={{ textAlign: 'center', fontSize: 11 }}>
                      {judgment.abstain} abstention{judgment.abstain > 1 ? 's' : ''}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {Object.entries(votes)
                    .map(([id, voters]) => ({
                      p: players.find((x) => x.userId === id),
                      n: voters.length,
                    }))
                    .filter((x) => x.p && x.n > 0)
                    .sort((a, b) => b.n - a.n)
                    .slice(0, 4)
                    .map((x) => (
                      <div key={x.p.userId} className="roster-row">
                        <span style={{ flex: 1 }}>{x.p.username}</span>
                        <span className="vote-badge">{x.n}</span>
                      </div>
                    ))}
                  {Object.values(votes).every((v) => v.length === 0) && (
                    <div className="dim" style={{ fontSize: 12, fontStyle: 'italic' }}>
                      Aucun vote pour l&apos;instant.
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Ton rôle */}
          {role && (
            <div className="panel-card role-panel">
              <div className="panel-title">TON RÔLE</div>
              <div className="role-card-mini">
                <div className="role-ico"
                     style={{ borderColor: role.team === 'MAFIA' ? 'rgba(192,57,43,.5)' : undefined }}>
                  {roleHidden ? '❓' : (ROLE_EMOJI[role.role] ?? '❓')}
                </div>
                <div>
                  <div className="role-name"
                       style={{ color: roleHidden ? 'var(--text-dim)'
                                : role.team === 'MAFIA' ? 'var(--red-hi)' : 'var(--gold-hi)' }}>
                    {roleHidden ? '•••••' : (ROLE_LABELS[role.role] ?? role.role).toUpperCase()}
                  </div>
                  <div className="role-team">
                    {roleHidden ? 'Rôle masqué' : `Équipe : ${role.team === 'MAFIA' ? 'Mafia' : 'Village'}`}
                  </div>
                </div>
              </div>
              <button className="reveal-btn" onClick={() => setRoleHidden(!roleHidden)}>
                {roleHidden ? '👁 VOIR TON RÔLE' : '🙈 MASQUER'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Dossier de partie (drawer) ── */}
      <GamePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        players={players}
        myId={session.userId}
        myRole={role?.role}
        round={round}
        notes={notes}
        onUpdateNote={updateNote}
        evidence={evidence}
        onAddEvidence={addEvidence}
        onRemoveEvidence={removeEvidence}
        canPublishEvidence={isAlive && ['MORNING_GAZETTE', 'DAY_DISCUSSION', 'DAY_VOTE', 'TRIAL'].includes(phase)}
        will={will}
        setWill={setWill}
        onSaveWill={saveWill}
        log={gameLog}
      />

      <ToastZone toasts={toasts} />
    </div>
  );
}

function PhaseCenterStage({
  phase, round, remaining, role, players, avatarMap, sessionId, isAlive,
  nightTarget, nightSecondaryTarget, actionConfirmed, canTargetPlayer, clickPlayer, mafiaTeammateIds,
  gazetteNow, nightMsg, detective, trial, sentence, votes, myVote, myVerdict,
  judgment, castVerdict, onOpenNotebook, onSkip, skipInfo,
}) {
  const timer = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
  const living = players.filter((player) => player.isAlive);

  const playerOption = (player, mode = 'night') => {
    const selected = mode === 'night'
      ? nightTarget === player.userId || nightSecondaryTarget === player.userId
      : myVote === player.userId;
    const selectionOrder = mode === 'night'
      ? nightTarget === player.userId ? 1 : nightSecondaryTarget === player.userId ? 2 : null
      : null;
    const enabled = mode === 'night'
      ? canTargetPlayer(player)
      : isAlive && player.userId !== sessionId;
    const avatarUrl = player.avatarId ? avatarMap[player.avatarId] : null;
    const teammate = mafiaTeammateIds.has(player.userId);
    const voteCount = mode === 'vote' ? (votes[player.userId] ?? []).length : 0;
    return (
      <button
        key={player.userId}
        className={`phase-player-option mode-${mode} ${selected ? 'selected' : ''} ${teammate ? 'mafia-known' : ''}`}
        disabled={!enabled}
        onClick={() => enabled && clickPlayer(player)}
      >
        <span className="phase-player-avatar">
          {avatarUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={avatarUrl} alt="" />
            : (player.isBot ? '🤖' : player.username?.[0]?.toUpperCase())}
        </span>
        <span><b>{player.username}</b><small>{player.userId === sessionId ? 'VOUS' : teammate ? 'ALLIÉ MAFIA' : mode === 'vote' ? 'ACCUSER' : 'VIVANT'}</small></span>
        <i>{mode === 'vote' && voteCount ? voteCount : selectionOrder ?? (selected ? '✓' : '›')}</i>
      </button>
    );
  };

  const footer = (allowSkip = false) => (
    <div className="phase-stage-footer">
      <button onClick={onOpenNotebook}>📖 <span>CARNET D’ENQUÊTE</span></button>
      {allowSkip && <button onClick={onSkip}>⏭ <span>{skipInfo ? `PASSER · ${skipInfo.count}/${skipInfo.total}` : 'PASSER LA PHASE'}</span></button>}
    </div>
  );

  if (phase === 'NIGHT' || phase === 'NIGHT_RESOLVE') {
    const theme = ROLE_NIGHT_SCENES[role?.role] ?? ROLE_NIGHT_SCENES.CITIZEN;
    const canAct = phase === 'NIGHT' && NIGHT_ACTION_ROLES.includes(role?.role) && isAlive;
    const isResolving = phase === 'NIGHT_RESOLVE';
    return (
      <section
        className={`phase-stage night-role-stage night-set-${theme.set}`}
        style={{ '--role-accent': theme.accent }}
      >
        <div className="night-role-atmosphere" aria-hidden="true"><span>{theme.icon}</span></div>
        <header className="phase-stage-heading">
          <div><small>NUIT {round} · TON RÔLE</small><h2>{ROLE_LABELS[role?.role] ?? role?.role ?? 'INCONNU'}</h2></div>
          <time><small>FIN DE NUIT</small>{timer}</time>
        </header>
        <div className="night-role-layout">
          <article className="night-role-brief">
            <span className="night-role-icon">{theme.icon}</span>
            <small>MISSION NOCTURNE</small>
            <h1>{theme.title}</h1>
            <p>{theme.copy}</p>
            {role?.team === 'MAFIA' && (
              <div className="known-team-strip">
                <small>TA FAMILLE</small>
                <div>{players.filter((player) => player.userId === sessionId || mafiaTeammateIds.has(player.userId)).map((player) => <span key={player.userId}>◆ {player.username}</span>)}</div>
              </div>
            )}
          </article>
          <article className="night-action-card">
            {isResolving ? (
              <div className="night-passive-state"><span className="stage-hourglass">⌛</span><small>ACTION EN COURS</small><h3>LA NUIT S’ACHÈVE</h3><p>Les actions sont en train d’être résolues.</p></div>
            ) : canAct ? (
              <>
                <div className="night-action-title"><span>{role?.role === 'BUS_DRIVER' ? 'SÉLECTIONNE DEUX JOUEURS' : role?.role === 'VETERAN' ? 'DÉCLENCHE TON ALERTE' : 'SÉLECTIONNE UNE CIBLE'}</span><b>{living.filter(canTargetPlayer).length} choix</b></div>
                <div className="phase-player-grid">{living.map((player) => playerOption(player))}</div>
                <div className={`night-confirm-state ${actionConfirmed ? 'confirmed' : ''}`}>
                  <span>{actionConfirmed ? '✓ ACTION ENREGISTRÉE' : theme.action}</span>
                  <small>{role?.role === 'BUS_DRIVER' && nightTarget && !nightSecondaryTarget
                    ? 'Choisis maintenant le deuxième joueur.'
                    : nightTarget ? 'Tu peux encore modifier ton choix.' : 'Choisis un joueur pour agir.'}</small>
                </div>
              </>
            ) : (
              <div className="night-passive-state"><span className="stage-hourglass">⌛</span><small>AUCUNE ACTION ACTIVE</small><h3>OBSERVE ET PRÉPARE-TOI</h3><p>Ton rôle agira pendant une autre phase ou dispose d’un pouvoir passif.</p></div>
            )}
          </article>
        </div>
        {footer(false)}
      </section>
    );
  }

  if (phase === 'MORNING_GAZETTE') {
    return (
      <section className="phase-stage gazette-stage">
        <header className="gazette-masthead"><span>ÉDITION Nº {round}</span><h1>LA GAZETTE DE LA NUIT</h1><time>{timer}</time></header>
        <div className="gazette-paper">
          <div className="gazette-date">LOUP GAROU MAFIA · JOUR {round} · ÉDITION SPÉCIALE</div>
          {(gazetteNow.length ? gazetteNow : [{ noElimination: true }]).map((entry, index) => (
            <article key={index} className={entry.noElimination ? 'peaceful' : 'fatal'}>
              <span className="gazette-mark">{entry.noElimination ? '☀' : '☠'}</span>
              <div>
                <small>{entry.noElimination ? 'UNE NUIT ÉTONNAMMENT CALME' : 'DERNIÈRE HEURE'}</small>
                <h2>{entry.noElimination ? 'AUCUNE VICTIME À DÉPLORER' : `${entry.eliminatedUsername} RETROUVÉ SANS VIE`}</h2>
                <p>{entry.noElimination ? (nightMsg || 'La ville se réveille intacte, mais la menace demeure.') : entry.message || `La victime était ${entry.eliminatedRole ? ROLE_LABELS[entry.eliminatedRole] ?? entry.eliminatedRole : 'de rôle inconnu'}.`}</p>
                {entry.will && <blockquote>« {entry.will} »</blockquote>}
              </div>
            </article>
          ))}
          <footer>VÉRIFIEZ LES FAITS · MÉFIEZ-VOUS DES RUMEURS · LA VILLE VOUS OBSERVE</footer>
        </div>
        {footer(true)}
      </section>
    );
  }

  if (phase === 'DAY_DISCUSSION') {
    return (
      <section className="phase-stage discussion-stage">
        <header className="phase-stage-heading"><div><small>JOUR {round}</small><h2>LA PAROLE EST À LA VILLE</h2></div><time><small>DISCUSSION</small>{timer}</time></header>
        <div className="discussion-emblem"><span>💬</span><h1>QUI MENT ?</h1><p>Compare les témoignages, les visites et les votes. Le chat est ouvert.</p></div>
        <div className="discussion-cast">{living.map((player) => <span key={player.userId} className={player.userId === sessionId ? 'me' : ''}>{player.username}</span>)}</div>
        {detective && <InvestigationResult result={detective} />}
        {footer(true)}
      </section>
    );
  }

  if (phase === 'DAY_VOTE') {
    return (
      <section className="phase-stage vote-stage">
        <div className="vote-crowd" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
        <header className="phase-stage-heading"><div><small>JOUR {round} · LA PLACE PUBLIQUE</small><h2>QUI DEVRA RÉPONDRE DEVANT LA VILLE ?</h2></div><time><small>LA FOULE TRANCHE DANS</small>{timer}</time></header>
        <div className="vote-stage-layout">
          <div className="vote-candidates">{living.map((player) => playerOption(player, 'vote'))}</div>
          <aside className="ballot-booth"><span className="vote-box-icon">🗳️</span><small>TON BULLETIN</small><h3>{myVote ? 'TA VOIX EST DÉPOSÉE' : 'LA VILLE ATTEND TON CHOIX'}</h3><p>{myVote ? 'Tant que la cloche n’a pas sonné, tu peux encore changer d’avis.' : 'Désigne celui qui devra se défendre devant tous.'}</p><div className="ballot-status">{myVote ? <><span>ACCUSATION</span><strong>{players.find((player) => player.userId === myVote)?.username}</strong></> : <><span>BULLETIN VIERGE</span><strong>—</strong></>}</div></aside>
        </div>
        {footer(true)}
      </section>
    );
  }

  if (phase === 'TRIAL' || phase === 'JUDGMENT') {
    const accused = players.find((player) => player.userId === trial?.accusedId);
    const isAccused = trial?.accusedId === sessionId;
    return (
      <section className={`phase-stage court-stage ${phase === 'JUDGMENT' ? 'judging' : ''}`}>
        <header className="phase-stage-heading"><div><small>TRIBUNAL DE LA VILLE</small><h2>{phase === 'TRIAL' ? 'LE PROCÈS' : 'LE VERDICT'}</h2></div><time><small>{phase === 'TRIAL' ? 'DÉFENSE' : 'DÉLIBÉRATION'}</small>{timer}</time></header>
        <div className="courtroom">
          <div className="court-seal">⚖️</div>
          <div className="accused-stand"><small>L’ACCUSÉ</small><span>{accused?.username?.[0]?.toUpperCase() ?? '?'}</span><h1>{accused?.username ?? 'INCONNU'}</h1><p>{isAccused ? 'Défends-toi maintenant dans le chat.' : phase === 'TRIAL' ? 'Écoute sa défense avant de juger.' : 'Décide de son sort.'}</p></div>
          {phase === 'JUDGMENT' && isAlive && !isAccused ? (
            <div className="court-verdict-actions"><button className={myVerdict === 'GUILTY' ? 'active guilty' : 'guilty'} onClick={() => castVerdict('GUILTY')}>COUPABLE</button><button className={myVerdict === 'INNOCENT' ? 'active innocent' : 'innocent'} onClick={() => castVerdict('INNOCENT')}>INNOCENT</button><button className={myVerdict === 'ABSTAIN' ? 'active' : ''} onClick={() => castVerdict('ABSTAIN')}>ABSTENTION</button></div>
          ) : <div className="court-instruction">{phase === 'TRIAL' ? 'LA DÉFENSE A LA PAROLE' : 'EN ATTENTE DU VERDICT'}</div>}
          {judgment && phase === 'JUDGMENT' && <div className="court-tally"><span><b>{judgment.guilty}</b> COUPABLE</span><i>CONTRE</i><span><b>{judgment.innocent}</b> INNOCENT</span></div>}
        </div>
        {footer(false)}
      </section>
    );
  }

  if (phase === 'SENTENCE') {
    const executed = sentence?.type === 'executed';
    return (
      <section className={`phase-stage sentence-stage ${executed ? 'executed' : 'acquitted'}`}>
        <div className="sentence-light" />
        <small>LE TRIBUNAL A TRANCHÉ</small>
        <span className="sentence-symbol">{executed ? '⚒' : '🕊️'}</span>
        <h1>{executed ? 'COUPABLE' : 'ACQUITTÉ'}</h1>
        <h2>{sentence?.username ?? trial?.accusedUsername ?? 'L’ACCUSÉ'}</h2>
        <p>{executed ? `Son rôle était ${ROLE_LABELS[sentence?.role] ?? sentence?.role ?? 'inconnu'}.` : 'Le doute a profité à l’accusé.'}</p>
        {sentence?.will && <blockquote>DERNIER TESTAMENT · « {sentence.will} »</blockquote>}
        {footer(false)}
      </section>
    );
  }

  return null;
}

function InvestigationResult({ result }) {
  let text = `${result.targetUsername} paraît ${result.team === 'MAFIA' ? 'suspect' : 'non suspect'}.`;
  if (result.kind === 'role') text = `${result.targetUsername} est ${ROLE_LABELS[result.role] ?? result.role}.`;
  if (result.kind === 'crimes') text = `${result.targetUsername} : ${(result.crimes ?? []).join(', ') || 'aucun crime connu'}.`;
  if (result.kind === 'visit') text = `${result.targetUsername} a visité ${result.visitedUsername ?? 'personne'}.`;
  if (result.kind === 'watch') text = `Visiteurs de ${result.targetUsername} : ${(result.visitorUsernames ?? []).join(', ') || 'aucun'}.`;
  if (result.kind === 'spy') text = `La Mafia s’est intéressée à : ${(result.targetUsernames ?? []).join(', ') || 'personne'}.`;
  return <div className="investigation-result"><small>RÉSULTAT DE LA NUIT</small><b>{text}</b></div>;
}

function InvestigationHud({ open, onToggle, onOpenDossier, notes, evidence, players, result, round }) {
  const tracked = Object.entries(notes ?? {})
    .filter(([, entry]) => entry?.text || (entry?.suspicion && entry.suspicion !== '?'))
    .slice(0, 3);
  const recentEvidence = [...(evidence ?? [])].sort((a, b) => b.createdAt - a.createdAt).slice(0, 2);
  if (!open) {
    return <button className="intel-hud-collapsed" onClick={onToggle}><span>🕵️</span> FIL D’ENQUÊTE <b>{tracked.length + recentEvidence.length}</b></button>;
  }
  return (
    <aside className="investigation-hud">
      <header><div><small>TOUR {round}</small><strong>FIL D’ENQUÊTE</strong></div><button onClick={onToggle}>−</button></header>
      <div className="intel-hud-content">
        {result && <InvestigationResult result={result} />}
        {tracked.map(([userId, entry]) => {
          const player = players.find((item) => item.userId === userId);
          return <article key={userId} className={`intel-line intel-${String(entry.suspicion ?? 'unknown').toLowerCase()}`}><span>{entry.suspicion === 'MAFIA' ? '◆' : entry.suspicion === 'TOWN' ? '✦' : '?'}</span><div><b>{player?.username ?? 'Inconnu'}</b><p>{entry.text || `Soupçon : ${entry.suspicion}`}</p></div></article>;
        })}
        {recentEvidence.map((item) => <article key={item.id} className="intel-line public"><span>🧷</span><div><b>{players.find((player) => player.userId === item.subjectId)?.username ?? 'Inconnu'}</b><p>{item.text}</p></div></article>)}
        {!result && tracked.length === 0 && recentEvidence.length === 0 && <p className="intel-empty">Aucune piste pour le moment. Observe les votes et prends des notes.</p>}
      </div>
      <button className="intel-open-dossier" onClick={onOpenDossier}>OUVRIR LE DOSSIER COMPLET <span>→</span></button>
    </aside>
  );
}

function ReplayTimeline({ events, players }) {
  const [open, setOpen] = useState(false);
  const names = Object.fromEntries(players.map((p) => [p.userId, p.username]));

  function describe(event) {
    const actor = names[event.actorId] ?? 'Le système';
    const target = names[event.targetId] ?? '—';
    switch (event.type) {
      case 'ROLE_ASSIGNED': return `${actor} était ${ROLE_LABELS[event.data?.role] ?? event.data?.role}`;
      case 'NIGHT_ACTION': return `${actor} (${ROLE_LABELS[event.data?.role] ?? event.data?.role}) a ciblé ${target}`;
      case 'NIGHT_DEATH': return `${target} a été éliminé par ${actor}${event.data?.cleaned ? ' — preuves nettoyées' : ''}`;
      case 'PLAYER_SAVED': return `${actor} a sauvé ${target}`;
      case 'INVESTIGATION':
        if (event.data?.kind === 'visit') return `${actor} a suivi ${target}`;
        if (event.data?.kind === 'watch') return `${actor} a surveillé ${target}`;
        return `${actor} a enquêté sur ${target}`;
      case 'BODYGUARD_SACRIFICE': return `${actor} s’est sacrifié pour sauver ${target}`;
      case 'BLACKMAILED': return `${target} a été réduit au silence`;
      case 'DAY_VOTE': return `${actor} a voté contre ${target}`;
      case 'JUDGMENT_VOTE': return `${actor} a voté ${event.data?.verdict ?? ''}`;
      case 'JUDGMENT_RESULT': return `Verdict : ${event.data?.verdict ?? ''}${event.targetId ? ` pour ${target}` : ''}`;
      case 'EVIDENCE_ADDED': return `${actor} a épinglé une preuve sur ${target}`;
      case 'CHAT_MESSAGE': return `${actor} [${event.data?.channel}] : ${event.data?.message}`;
      case 'PHASE_STARTED': return `${PHASE_LABELS[event.data?.phase] ?? event.data?.phase}`;
      case 'GAME_OVER': return `Victoire : ${event.data?.winner === 'MAFIA' ? 'Mafia' : 'Village'}`;
      default: return event.type;
    }
  }

  return (
    <section className={`replay-dossier ${open ? 'open' : ''}`}>
      <button className="replay-toggle" onClick={() => setOpen((value) => !value)}>
        <span><small>ARCHIVES DÉCLASSIFIÉES</small>REPLAY DE LA PARTIE</span>
        <b>{events.length} ÉVÉNEMENTS {open ? '−' : '+'}</b>
      </button>
      {open && (
        <div className="replay-timeline">
          {events.map((event) => (
            <div key={event.id} className={`replay-event event-${event.type.toLowerCase()}`}>
              <span className="replay-round">T{event.round}</span>
              <i />
              <div><small>{PHASE_LABELS[event.phase] ?? event.phase}</small><p>{describe(event)}</p></div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Toasts ───────────────────────────────────────────────────────────────────

function ToastZone({ toasts }) {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-zone">
      {toasts.map((t) => <div key={t.id} className="toast">{t.text}</div>)}
    </div>
  );
}
