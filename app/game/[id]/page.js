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
  VILLAGER: 'Villageois', MAFIA: 'Mafioso', DETECTIVE: 'Détective',
  DOCTOR: 'Médecin', MEDIUM: 'Médium', VIGILANTE: 'Vigilante',
  GODFATHER: 'Parrain', ESCORT: 'Escorte', CONSIGLIERE: 'Consigliere',
};

const ROLE_EMOJI = {
  VILLAGER: '🏘️', MAFIA: '🔪', DETECTIVE: '🔍',
  DOCTOR: '⚕️', MEDIUM: '🔮', VIGILANTE: '⚖️',
  GODFATHER: '🎩', ESCORT: '💃', CONSIGLIERE: '🕵️',
};

const NIGHT_PROMPTS = {
  MAFIA:       'Choisissez votre victime.',
  GODFATHER:   'Ordonnez l\'assassinat — votre voix compte double.',
  DETECTIVE:   'Choisissez un joueur à sonder.',
  CONSIGLIERE: 'Choisissez un joueur — son rôle exact vous sera révélé.',
  DOCTOR:      'Choisissez un joueur à protéger.',
  VIGILANTE:   'Choisissez une cible… ou personne.',
  ESCORT:      'Choisissez un joueur à distraire — son action sera annulée.',
};

const NIGHT_ACTION_ROLES = ['MAFIA', 'GODFATHER', 'DETECTIVE', 'CONSIGLIERE', 'DOCTOR', 'VIGILANTE', 'ESCORT'];
const DAY_PHASES = ['MORNING_GAZETTE', 'DAY_DISCUSSION', 'DAY_VOTE', 'TRIAL', 'JUDGMENT', 'SENTENCE'];

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
  const [notes, setNotes]         = useState({});     // userId → { text, suspicion }
  const [gameLog, setGameLog]     = useState([]);     // { icon, text, round }
  const [muted, setMuted]         = useState(true);
  const [roleHidden, setRoleHidden] = useState(true);
  useEffect(() => { setMuted(isMuted()); }, []);

  const socketRef = useRef(null);
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
    };
    const onPhase = (d) => {
      setPhase(d.phase);
      if (d.round) setRound(d.round);
      setEndAt(d.endAt ?? 0);
      setStartAt(d.startAt ?? 0);
      setSkipInfo(null);
      if (d.phase === 'NIGHT') {
        setNightTarget(null); setActionConfirmed(false);
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
    const onPublic   = (d) => { if (d?.players) setPlayers(d.players); if (d?.votes) setVotes(d.votes); };
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
    const onActionOk = ()  => setActionConfirmed(true);
    const onSkip     = (d) => setSkipInfo(d);
    const onChat     = (m) => {
      setChatMessages((prev) => [...prev.slice(-199), m]);
      sounds.tick();
    };
    const onSaved    = ()  => toast('⚕️ Vous avez été attaqué cette nuit… mais quelqu\'un vous a sauvé.');
    const onDocSaved = (d) => toast(`⚕️ Votre protection a sauvé ${d.savedUsername} cette nuit !`);
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
    socket.on('night:action_received',    onActionOk);
    socket.on('night:result',             onNightRes);
    socket.on('night:you_were_saved',     onSaved);
    socket.on('night:doctor_saved',       onDocSaved);
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
      ['game:sync', 'phase:start', 'game:public_state', 'game:role_assigned',
       'vote:update', 'gazette:published', 'trial:started', 'judgment:voted',
       'sentence:executed', 'sentence:acquitted', 'game:over', 'game:rewards',
       'night:detective_result', 'night:consigliere_result', 'night:action_received', 'night:result',
       'night:you_were_saved', 'night:doctor_saved', 'phase:skip_votes_updated',
       'game:player_disconnected', 'game:player_reconnected', 'chat:message',
      ].forEach((e) => socket.off(e));
      socket.off('connect', onReconnect);
    };
  }, [gameId, router, toast, addLog]);

  // ── Derived state ───────────────────────────────────────────────────────────
  const me      = players.find((p) => p.userId === session?.userId);
  const isAlive = me?.isAlive ?? true;

  const canActAtNight =
    phase === 'NIGHT' && isAlive && role && NIGHT_ACTION_ROLES.includes(role.role);

  const isNightPhase = phase === 'NIGHT' || phase === 'NIGHT_RESOLVE';
  const isMediumSeance = isAlive && role?.role === 'MEDIUM' && isNightPhase;

  const chatChannels = [];
  if (!isAlive) chatChannels.push('dead');
  if (isMediumSeance) chatChannels.push('dead'); // séance spirite du Médium
  chatChannels.push('day');
  if (isAlive && role?.team === 'MAFIA' && isNightPhase) {
    chatChannels.unshift('mafia');
  }
  const canWrite =
    (!isAlive) ||
    isMediumSeance ||
    (isAlive && DAY_PHASES.includes(phase)) ||
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

  function clickPlayer(p) {
    if (!p.isAlive || p.userId === session?.userId) return;
    if (canActAtNight) {
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
    return (
      <div className="page" style={{ maxWidth: 560, textAlign: 'center', paddingTop: 50 }}>
        <div className={`ambiance on ${winner.winner === 'MAFIA' ? 'ambiance-danger' : 'ambiance-day'}`} />
        <h1 className="title-gold" style={{ fontSize: 30, marginBottom: 6 }}>
          {winner.winner === 'MAFIA' ? '🔪 LA MAFIA TRIOMPHE' : '🏘️ LE VILLAGE TRIOMPHE'}
        </h1>
        <p className="dim" style={{ fontStyle: 'italic', marginBottom: 24 }}>La partie est terminée.</p>

        {rewards && (
          <div className="gazette-entry gold" style={{ marginBottom: 20, textAlign: 'left' }}>
            💎 <b>+{rewards.diamondsEarned} diamants gagnés</b>
            {(rewards.newAchievements ?? []).map((a) => (
              <div key={a.id} style={{ marginTop: 6, fontSize: 13 }}>
                {a.icon} <b>{a.name}</b> — {a.description}
                <span className="dim"> (+{a.diamondReward} 💎)</span>
              </div>
            ))}
          </div>
        )}

        <div className="card" style={{ textAlign: 'left' }}>
          {(winner.players ?? []).map((p) => (
            <div key={p.userId}
                 style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 4px',
                          opacity: p.isAlive ? 1 : 0.5 }}>
              <span>{ROLE_EMOJI[p.role] ?? ''} {p.username}{!p.isAlive ? ' 💀' : ''}</span>
              <span style={{ color: p.team === 'MAFIA' ? 'var(--red-hi)' : 'var(--blue)' }}>
                {ROLE_LABELS[p.role] ?? p.role}
              </span>
            </div>
          ))}
        </div>
        <button className="primary" style={{ marginTop: 24 }} onClick={() => router.push('/lobby')}>
          RETOUR À L&apos;ACCUEIL
        </button>
      </div>
    );
  }

  // ═══ Role reveal ═══
  if (phase === 'ROLE_REVEAL') {
    return (
      <div className="page">
        <div className="ambiance ambiance-night on" />
        {role ? (
          <div className={`role-reveal ${role.team === 'MAFIA' ? 'mafia' : 'village'}`}>
            <div className="dim" style={{ fontSize: 11, letterSpacing: 4 }}>VOTRE RÔLE</div>
            <div className="role-icon">{ROLE_EMOJI[role.role] ?? '❓'}</div>
            <div className="role-name cinzel"
                 style={{ color: role.team === 'MAFIA' ? 'var(--red-hi)' : 'var(--gold-hi)' }}>
              {(ROLE_LABELS[role.role] ?? role.role).toUpperCase()}
            </div>
            <div className="dim" style={{ fontSize: 12, letterSpacing: 2, marginBottom: 14 }}>
              CAMP {role.team === 'MAFIA' ? 'MAFIA' : 'VILLAGE'}
            </div>
            <p style={{ fontStyle: 'italic', color: 'var(--text-dim)', lineHeight: 1.5 }}>
              {role.description}
            </p>
            <p className="dim" style={{ marginTop: 18, fontSize: 13 }}>
              La nuit tombe dans {remaining > 0 ? `${remaining}s` : 'quelques instants'}…
            </p>
          </div>
        ) : (
          <div className="suspense">Distribution des rôles…</div>
        )}
      </div>
    );
  }

  // ═══ Night resolve — suspense ═══
  if (phase === 'NIGHT_RESOLVE' && !(role?.team === 'MAFIA' && isAlive)) {
    return (
      <div className="page">
        <div className="ambiance ambiance-night on" />
        <div className="phase-banner">
          <div className="dim" style={{ fontSize: 11, letterSpacing: 3 }}>TOUR {round}</div>
          <div className="phase-name">🌘 {PHASE_LABELS[phase]}</div>
        </div>
        <div className="suspense">
          <span className="moon">🌘</span>
          {nightMsg || 'Les événements de la nuit se déroulent…'}
        </div>
        <ToastZone toasts={toasts} />
      </div>
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
          <Chat
            messages={chatMessages}
            available={chatChannels}
            canWrite={canWrite}
            onSend={(message) => send('chat:send', { message })}
            log={gameLog}
          />
        </div>

        {/* Center: table scene */}
        <div className={`table-scene scene-${ambiance || 'night'}`} style={{ backgroundImage: `url('${sceneBg}')` }}>
          <div className="table-oval" />

          {/* Contextual banners */}
          {gazetteNow.map((e, i) =>
            e.noElimination ? (
              <div key={i} className="scene-banner gold" style={{ top: 12 + i * 54 }}>
                🌙 La nuit fut calme. Personne n&apos;a perdu la vie.
              </div>
            ) : (
              <div key={i} className="scene-banner danger" style={{ top: 12 + i * 54 }}>
                ☠️ <b>{e.eliminatedUsername}</b> a été éliminé — {ROLE_LABELS[e.eliminatedRole] ?? e.eliminatedRole}
                {e.will ? <div className="dim" style={{ fontSize: 12, fontStyle: 'italic' }}>📜 « {e.will} »</div> : null}
              </div>
            ),
          )}
          {detective && phase !== 'MORNING_GAZETTE' && (
            <div className="scene-banner info">
              {detective.kind === 'role'
                ? <>🕵️ <b>{detective.targetUsername}</b> est <b style={{ color: 'var(--gold-hi)' }}>{ROLE_LABELS[detective.role] ?? detective.role}</b></>
                : <>🔍 <b>{detective.targetUsername}</b> est du camp{' '}
                    <b style={{ color: detective.team === 'MAFIA' ? 'var(--red-hi)' : 'var(--blue)' }}>
                      {detective.team === 'MAFIA' ? 'MAFIA' : 'VILLAGE'}
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
            const selectable = p.isAlive && p.userId !== session.userId &&
              (canActAtNight || (phase === 'DAY_VOTE' && isAlive));
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
              <div key={p.userId} className={`roster-row ${p.isAlive ? '' : 'dead-row'}`}>
                <span className="dot" />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.username}
                  {p.userId === session.userId ? ' (vous)' : ''}
                  {p.isBot && <span className="bot-chip">BOT</span>}
                </span>
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
        setNotes={setNotes}
        will={will}
        setWill={setWill}
        onSaveWill={saveWill}
        log={gameLog}
      />

      <ToastZone toasts={toasts} />
    </div>
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
