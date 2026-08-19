'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import GamePanel from '@/components/GamePanel';
import RoleIcon from '@/components/RoleIcon';
import { ROLE_GUIDE } from '@/lib/roleGuide';

const PHASES = [
  ['ROLE_REVEAL', '🎭', 'Révélation'],
  ['NIGHT', '🌙', 'Nuit'],
  ['NIGHT_RESOLVE', '⌛', 'Résolution'],
  ['MORNING_GAZETTE', '📰', 'Gazette'],
  ['DAY_DISCUSSION', '💬', 'Discussion'],
  ['DAY_VOTE', '🗳️', 'Vote'],
  ['TRIAL', '⚖️', 'Procès'],
  ['JUDGMENT', '🔨', 'Jugement'],
  ['SENTENCE', '☠', 'Sentence'],
  ['GAME_OVER', '🏆', 'Fin de partie'],
];

const PHASE_LABELS = Object.fromEntries(PHASES.map(([key, , label]) => [key, label]));

const SAMPLE_PLAYERS = [
  { userId: 'me', username: 'Violette', isAlive: true, role: 'SHERIFF' },
  { userId: 'p2', username: 'Lucien', isAlive: true, role: 'DOCTOR' },
  { userId: 'p3', username: 'Marcel', isAlive: true, role: 'GODFATHER' },
  { userId: 'p4', username: 'Adèle', isAlive: true, role: 'DETECTIVE' },
  { userId: 'p5', username: 'Gaston', isAlive: false, role: 'CITIZEN' },
  { userId: 'p6', username: 'Rose', isAlive: true, role: 'ESCORT' },
];

const INTEL_REPORTS = [
  { id: 3, tone: 'danger', icon: '⭐', title: 'RÉSULTAT DE L’INTERROGATOIRE', message: 'Marcel paraît suspect.', round: 3 },
  { id: 2, tone: 'town', icon: '👁️', title: 'RAPPORT DE SURVEILLANCE', message: 'Visiteurs de Lucien : Rose et Marcel.', round: 2 },
  { id: 1, tone: 'info', icon: '👣', title: 'FIN DE LA FILATURE', message: 'Adèle a visité Gaston.', round: 1 },
];

const OVERLAY_GROUPS = [
  {
    label: 'ANIMATIONS',
    actions: [
      ['phaseNight', '🌙', 'Carton nuit'],
      ['phaseDay', '☀️', 'Carton jour'],
      ['actionFlash', '✓', 'Action scellée'],
      ['nightResult', '🔎', 'Résultat privé'],
      ['toastInfo', '👁️', 'Notification utile'],
      ['affectedSaved', '⚕️', 'Action : sauvé'],
      ['affectedBlocked', '⛔', 'Action : bloqué'],
    ],
  },
  {
    label: 'MODALES & DRAWERS',
    actions: [
      ['roleCard', '🎴', 'Ta carte de rôle'],
      ['intel', '🗂', 'Drawer Intel'],
      ['dossier', '📖', 'Dossier enquête'],
      ['settings', 'Aa', 'Réglages'],
      ['death', '†', 'Vous êtes mort'],
    ],
  },
];

function roleScene(role) {
  return {
    accent: role?.color ?? '#c99a4c',
    icon: role?.emoji ?? '🎭',
    title: role?.nightAction ? 'MISSION NOCTURNE' : 'RÔLE D’OBSERVATION',
    action: role?.nightAction ? role.nightAction.toUpperCase() : 'OBSERVER ET DÉDUIRE',
    copy: role?.nightAction ?? role?.tip ?? 'Observe les comportements et prépare ton vote.',
  };
}

export default function UiLabPage() {
  const [phase, setPhase] = useState('NIGHT');
  const [roleKey, setRoleKey] = useState('SHERIFF');
  const [device, setDevice] = useState('desktop');
  const [overlay, setOverlay] = useState(null);
  const [replayKey, setReplayKey] = useState(0);
  const [notes, setNotes] = useState({ p2: { suspicion: 'TOWN', text: 'Nuit 1 · aperçu près de la maison de Gaston.\nSemble cohérent.' }, p3: { suspicion: 'MAFIA', text: 'Change souvent de version.' } });
  const [will, setWill] = useState('Marcel est suspect. Vérifiez mes résultats avant de voter.');
  const role = useMemo(() => ROLE_GUIDE.find((item) => item.key === roleKey) ?? ROLE_GUIDE[0], [roleKey]);

  const trigger = (name) => {
    setOverlay(name);
    setReplayKey((value) => value + 1);
  };

  useEffect(() => {
    const close = (event) => event.key === 'Escape' && setOverlay(null);
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);

  return (
    <main className="ui-lab-page">
      <header className="ui-lab-header">
        <div>
          <Link href="/lobby">← RETOUR AU JEU</Link>
          <small>OUTIL DE DÉVELOPPEMENT VISUEL</small>
          <h1>MAFIA · UI LAB</h1>
          <p>Prévisualise chaque phase et rejoue les états visuels sans créer de partie.</p>
        </div>
        <div className="ui-lab-header-actions">
          <div><button className={device === 'desktop' ? 'active' : ''} onClick={() => setDevice('desktop')}>▱ DESKTOP</button><button className={device === 'mobile' ? 'active' : ''} onClick={() => setDevice('mobile')}>▯ MOBILE</button></div>
          <button onClick={() => setReplayKey((value) => value + 1)}>↻ REJOUER LA SCÈNE</button>
        </div>
      </header>

      <div className="ui-lab-layout">
        <aside className="ui-lab-controls">
          <section>
            <header><span>01</span><div><small>ÉCRANS</small><h2>PHASES DE JEU</h2></div></header>
            <div className="ui-lab-phase-grid">
              {PHASES.map(([key, icon, label]) => (
                <button key={key} className={phase === key ? 'active' : ''} onClick={() => { setPhase(key); setReplayKey((value) => value + 1); }}>
                  <span>{icon}</span><b>{label}</b><small>{key}</small>
                </button>
              ))}
            </div>
          </section>

          <section>
            <header><span>02</span><div><small>CONTEXTE</small><h2>RÔLE TESTÉ</h2></div></header>
            <label className="ui-lab-role-select">
              <RoleIcon roleKey={role.key} className="ui-lab-role-icon" />
              <span><small>CARTE & ACTIONS</small><b>{role.name}</b></span>
              <select value={roleKey} onChange={(event) => { setRoleKey(event.target.value); setReplayKey((value) => value + 1); }}>
                {ROLE_GUIDE.map((item) => <option key={item.key} value={item.key}>{item.name} · {item.team}</option>)}
              </select>
            </label>
          </section>

          {OVERLAY_GROUPS.map((group, groupIndex) => (
            <section key={group.label}>
              <header><span>{String(groupIndex + 3).padStart(2, '0')}</span><div><small>DÉCLENCHEURS</small><h2>{group.label}</h2></div></header>
              <div className="ui-lab-trigger-grid">
                {group.actions.map(([key, icon, label]) => <button key={key} onClick={() => trigger(key)}><span>{icon}</span><b>{label}</b><i>→</i></button>)}
              </div>
            </section>
          ))}
        </aside>

        <section className="ui-lab-preview-panel">
          <header>
            <div><small>APERÇU EN DIRECT</small><h2>{PHASE_LABELS[phase]}</h2></div>
            <div><span>{device === 'mobile' ? '390 × 844' : '1440 × 900'}</span><b>TOUR 3</b></div>
          </header>
          <div className={`ui-lab-device device-${device}`}>
            <div className="ui-lab-device-screen" key={`${phase}-${roleKey}-${replayKey}`}>
              <LabScreen phase={phase} role={role} />
            </div>
          </div>
          <footer><span>ASTUCE</span> Utilise <kbd>Échap</kbd> pour fermer n’importe quelle modale de test.</footer>
        </section>
      </div>

      {overlay && <button className="ui-lab-overlay-dismiss" onClick={() => setOverlay(null)}>FERMER LE TEST <span>✕</span></button>}
      <LabOverlay key={`${overlay}-${replayKey}`} type={overlay} role={role} onClose={() => setOverlay(null)} />
      <GamePanel
        open={overlay === 'dossier'}
        onClose={() => setOverlay(null)}
        players={SAMPLE_PLAYERS}
        myId="me"
        myRole={role.key}
        round={3}
        notes={notes}
        onUpdateNote={(userId, value) => setNotes((current) => ({ ...current, [userId]: value }))}
        will={will}
        setWill={setWill}
        onSaveWill={() => {}}
        log={[{ icon: '🌙', text: 'La nuit 3 commence.', round: 3 }, { icon: '🗳️', text: 'Marcel a été envoyé au procès.', round: 2 }]}
        dayFeed={[{ id: 1, icon: '☠', text: 'Gaston a été retrouvé mort', round: 2 }]}
      />
    </main>
  );
}

function LabScreen({ phase, role }) {
  if (phase === 'ROLE_REVEAL') return <LabRoleReveal role={role} />;
  if (phase === 'NIGHT_RESOLVE') return <LabNightResolve role={role} />;
  if (phase === 'GAME_OVER') return <LabGameOver />;

  const ambiance = ['TRIAL', 'JUDGMENT'].includes(phase) ? 'trial' : phase === 'SENTENCE' ? 'danger' : phase === 'NIGHT' ? 'night' : 'day';
  const scene = { night: '/bg/nuit.webp', day: '/bg/jour.webp', trial: '/bg/proces.webp', danger: '/bg/sentence.webp' }[ambiance];

  return (
    <div className="game-shell ui-lab-game-shell">
      <div className="game-topbar">
        <div className="left"><span className="game-code">PARTIE #LAB3</span><span className="game-sub">5 / 6 joueurs en vie</span></div>
        <div className="daynight"><span>{ambiance === 'night' ? '🌙' : '☀️'}</span><div className="phase-pill"><div className="big">{ambiance === 'night' ? 'NUIT 3' : 'JOUR 3'}</div><div className="small">{PHASE_LABELS[phase]}</div></div></div>
        <div className="right"><div className="timer-chip">⏱ 0:42<span className="lbl">FIN DU TOUR</span></div></div>
      </div>
      <div className="game-main ui-lab-game-main">
        <div className={`table-scene scene-${ambiance} phase-${phase.toLowerCase().replaceAll('_', '-')}`} style={{ backgroundImage: `url('${scene}')` }}>
          <LabPhaseStage phase={phase} role={role} />
        </div>
      </div>
      <nav className="game-mobile-tabs"><div className="mobile-timer"><span>{ambiance === 'night' ? '🌙' : '☀️'}</span><b>0:42</b><small>{PHASE_LABELS[phase]}</small></div>{[['🎭','TABLE'],['💬','CHAT'],['👥','JOUEURS']].map(([icon,label], index) => <button key={label} className={index === 0 ? 'active' : ''}><span>{icon}</span><small>{label}</small></button>)}</nav>
    </div>
  );
}

function LabPhaseStage({ phase, role }) {
  const scene = roleScene(role);
  if (phase === 'NIGHT') {
    return <section className="phase-stage night-role-stage night-set-evidence" style={{ '--role-accent': scene.accent }}>
      <div className="night-role-atmosphere" aria-hidden="true"><span>{scene.icon}</span></div>
      <header className="phase-stage-heading"><div><small>NUIT 3 · TON RÔLE</small><h2>{role.name}</h2></div><time><small>FIN DE NUIT</small>00:42</time></header>
      <div className="night-role-layout"><article className="night-role-brief"><RoleIcon roleKey={role.key} className="night-role-icon" /><small>{role.nightAction ? 'MISSION NOCTURNE' : 'RÔLE PASSIF'}</small><h1>{scene.title}</h1><p>{scene.copy}</p></article><article className="night-action-card"><div className="night-action-title"><span>{role.nightAction ? 'SÉLECTIONNE UNE CIBLE' : 'AUCUNE CIBLE'}</span><b>5 choix</b></div><div className="phase-player-grid">{SAMPLE_PLAYERS.filter((player) => player.isAlive && player.userId !== 'me').slice(0,4).map((player, index) => <button key={player.userId} className={`phase-player-option mode-night ${index === 1 ? 'selected' : ''}`}><span className="phase-player-avatar">{player.username[0]}</span><span><b>{player.username}</b><small>VIVANT</small></span><i>{index === 1 ? '✓' : '›'}</i></button>)}</div><div className="night-confirm-state"><span>{scene.action}</span><small>Choisis un joueur pour agir.</small></div></article></div>
    </section>;
  }
  if (phase === 'MORNING_GAZETTE') return <section className="phase-stage gazette-stage"><header className="gazette-masthead"><span>ÉDITION Nº 3</span><h1>LA GAZETTE DE LA NUIT</h1><time>00:42</time></header><div className="gazette-paper"><div className="gazette-date">LOUP GAROU MAFIA · JOUR 3 · ÉDITION SPÉCIALE</div><article className="fatal"><span className="gazette-mark">☠</span><div><small>DERNIÈRE HEURE</small><h2>GASTON RETROUVÉ SANS VIE</h2><p>La victime était Citoyen. La ville se réveille sous le choc.</p><blockquote>« Méfiez-vous de Marcel. »</blockquote></div></article><footer>VÉRIFIEZ LES FAITS · MÉFIEZ-VOUS DES RUMEURS · LA VILLE VOUS OBSERVE</footer></div></section>;
  if (phase === 'DAY_DISCUSSION') return <section className="phase-stage discussion-stage"><header className="phase-stage-heading"><div><small>JOUR 3 · PLACE DU VILLAGE</small><h2>LA PAROLE EST À LA VILLE</h2></div><time><small>DISCUSSION</small>00:42</time></header><div className="discussion-plaza"><div className="discussion-crowd" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div><div className="discussion-emblem"><span>♟</span><small>PLACE PUBLIQUE · JOUR 3</small><h1>DISCUSSION EN COURS</h1><p>Le village débat jusqu’à la fin du temps imparti.</p><div className="discussion-skip-vote"><div className="discussion-skip-copy"><span>⏭</span><div><small>VOTE COLLECTIF</small><strong>PASSER À LA PHASE SUIVANTE</strong></div></div><div className="discussion-skip-progress"><span style={{ width: '33%' }} /></div><button><b>VOTER POUR PASSER</b><small>1/3 · majorité requise</small></button></div></div><div className="discussion-lampposts"><i /><i /></div></div></section>;
  if (phase === 'DAY_VOTE') return <section className="phase-stage vote-stage"><div className="vote-crowd"><i /><i /><i /><i /><i /><i /><i /></div><header className="phase-stage-heading"><div><small>JOUR 3 · LA PLACE PUBLIQUE</small><h2>QUI DEVRA RÉPONDRE DEVANT LA VILLE ?</h2></div><time><small>LA FOULE TRANCHE DANS</small>00:42</time></header><div className="vote-stage-layout"><div className="vote-candidates">{SAMPLE_PLAYERS.filter((player) => player.isAlive && player.userId !== 'me').map((player, index) => <button key={player.userId} className={`phase-player-option mode-vote ${index === 1 ? 'selected' : ''}`}><span className="phase-player-avatar">{player.username[0]}</span><span><b>{player.username}</b><small>ACCUSER</small></span><i>{index === 1 ? 3 : '›'}</i></button>)}</div><aside className="ballot-booth"><span className="vote-box-icon">🗳️</span><small>TON BULLETIN</small><h3>TA VOIX EST DÉPOSÉE</h3><p>Tu peux encore changer d’avis.</p><div className="ballot-status"><span>ACCUSATION</span><strong>Marcel</strong></div></aside></div></section>;
  if (phase === 'TRIAL' || phase === 'JUDGMENT') return <section className={`phase-stage court-stage ${phase === 'JUDGMENT' ? 'judging' : ''}`}><header className="phase-stage-heading"><div><small>TRIBUNAL DE LA VILLE</small><h2>{phase === 'TRIAL' ? 'LE PROCÈS' : 'LE VERDICT'}</h2></div><time><small>{phase === 'TRIAL' ? 'DÉFENSE' : 'DÉLIBÉRATION'}</small>00:42</time></header><div className="courtroom"><div className="court-seal">⚖️</div><div className="accused-stand"><small>L’ACCUSÉ</small><span>M</span><h1>MARCEL</h1><p>{phase === 'TRIAL' ? 'Écoute sa défense avant de juger.' : 'Décide de son sort.'}</p></div>{phase === 'JUDGMENT' ? <><div className="court-verdict-actions"><button className="guilty">COUPABLE</button><button className="innocent">INNOCENT</button><button>ABSTENTION</button></div><div className="court-tally"><span><b>3</b> COUPABLE</span><i>CONTRE</i><span><b>1</b> INNOCENT</span></div></> : <div className="court-instruction">LA DÉFENSE A LA PAROLE</div>}</div></section>;
  if (phase === 'SENTENCE') return <section className="phase-stage sentence-stage executed"><div className="sentence-light" /><small>LE TRIBUNAL A TRANCHÉ</small><span className="sentence-symbol">⚒</span><h1>COUPABLE</h1><h2>MARCEL</h2><p>Son rôle était <strong className="sentence-role role-mafia">PARRAIN</strong>.</p><blockquote>DERNIER TESTAMENT · « Vous ne savez rien de la famille. »</blockquote></section>;
  return null;
}

function LabRoleReveal({ role }) {
  return <main className="role-reveal-screen"><div className="reveal-vignette" /><section className={`role-reveal-stage ${role.team === 'MAFIA' ? 'mafia' : 'village'}`} style={{ '--reveal-accent': role.color }}><div className="reveal-kicker"><span /> VOTRE IDENTITÉ POUR CETTE NUIT <span /></div><div className="role-card-wrap"><div className="role-card-aura" /><div className="role-reveal-card"><img className="role-reveal-art" src={role.image} alt="" /><div className="role-reveal-scrim" /><div className="role-reveal-overlay"><div className="role-reveal-topline"><span><i />{role.team === 'MAFIA' ? 'MAFIA' : 'VILLE'}</span><b>LG-03</b></div><div className="role-reveal-copy"><div className="role-reveal-kicker">DOSSIER DE RÔLE · IDENTITÉ CONFIDENTIELLE</div><h1 className="role-name">{role.name.toUpperCase()}</h1><div className="role-team-name">{role.team === 'MAFIA' ? '◆ FAMILLE MAFIA' : '✦ ALLIANCE TOWN'}</div><p>{role.description}</p><div className="role-reveal-power"><span>{role.nightAction ? 'MISSION NOCTURNE' : 'RÔLE PASSIF'}</span><strong>{role.nightAction ?? role.tip}</strong></div><div className="role-secret"><span>◈</span> NE RÉVÉLEZ VOTRE IDENTITÉ À PERSONNE</div></div></div></div></div><div className="role-reveal-countdown"><div><span>LA PARTIE COMMENCE</span><strong>8s</strong></div><div className="reveal-progress"><span style={{ width: '78%' }} /></div></div></section></main>;
}

function LabNightResolve({ role }) {
  return <main className="night-resolve-screen night-set-evidence" style={{ '--resolve-accent': role.color }}><div className="night-resolve-vignette" /><div className="night-moon role-resolve-icon"><RoleIcon roleKey={role.key} className="role-resolve-art" /></div><section className="night-resolve-content"><div className="page-eyebrow">NUIT 3 · LA VILLE RETIENT SON SOUFFLE</div><h1>TON ACTION EST SCELLÉE</h1><div className="night-ornament"><span>◆</span></div><p>{role.nightAction ?? 'Dans l’ombre, chaque décision produit ses conséquences.'}</p><div className="night-resolve-progress"><span /></div><small>{role.name.toUpperCase()} · RÉSOLUTION EN COURS</small></section><div className="night-silhouettes"><i /><i /><i /><i /><i /></div></main>;
}

function LabGameOver() {
  return <main className="game-over-screen village-victory"><div className="end-vignette" /><section className="game-over-content"><header className="victory-heading"><div className="page-eyebrow">DOSSIER DE PARTIE CLOS</div><div className="victory-emblem">✦</div><h1>LA TOWN TRIOMPHE</h1><p>La ville connaît enfin la vérité. Tous les rôles sont révélés.</p></header><div className="reward-summary"><div><span>RÉCOMPENSE</span><strong>+120 💎</strong></div><div><span>CLASSEMENT</span><strong>+24 ELO</strong></div></div><div className="final-roster"><section className="final-team town winner"><header className="final-team-heading"><div><small>CAMP VAINQUEUR</small><h2>ALLIANCE TOWN</h2></div><span>3 JOUEURS</span></header><div className="final-team-list">{SAMPLE_PLAYERS.filter((player) => player.role !== 'GODFATHER').slice(0,3).map((player) => <div className="final-player village survivor" key={player.userId}><RoleIcon roleKey={player.role} className="final-role-icon" /><div className="final-player-identity"><strong>{player.username}</strong><small className="final-player-role">{ROLE_GUIDE.find((role) => role.key === player.role)?.name}</small></div><span className="final-status">SURVIVANT</span></div>)}</div></section></div></section></main>;
}

function LabOverlay({ type, role, onClose }) {
  if (!type || type === 'dossier') return null;
  const scene = roleScene(role);
  if (type === 'phaseNight' || type === 'phaseDay') { const night = type === 'phaseNight'; return <div className={`phase-slate tone-${night ? 'night' : 'day'}`}><span className="phase-slate-halo" /><span className="phase-slate-icon">{night ? '🌙' : '☀️'}</span><strong>{night ? 'LA NUIT TOMBE' : 'LE VILLAGE S’ÉVEILLE'}</strong><span className="phase-slate-line" /><em>{night ? 'La ville ferme les yeux' : 'La gazette du matin'}</em></div>; }
  if (type === 'actionFlash') return <div className="action-cinematic-flash" style={{ '--flash-accent': scene.accent }}><div className="action-flash-prop">{scene.icon}</div><div className="action-flash-copy"><small>ORDRE NOCTURNE SCELLÉ</small><strong>{scene.action}</strong><p>Ton choix a été enregistré.</p></div><span className="action-wax-seal">✓</span></div>;
  if (type === 'nightResult') return <div className="night-result-reveal tone-town"><span className="night-result-icon">🔎</span><div><small>INFORMATION PRIVÉE · AJOUTÉE AU DOSSIER</small><strong>RÉSULTAT DE L’ENQUÊTE</strong><p>Marcel paraît suspect.</p></div><i>CONFIDENTIEL</i><button className="night-result-dismiss" onClick={onClose}>×</button></div>;
  if (type === 'toastInfo') return <div className="toast-zone"><article className="toast"><span>👁️ Une présence inconnue s’est approchée de vous pendant la nuit.</span><button onClick={onClose}>×</button></article></div>;
  if (type === 'affectedSaved' || type === 'affectedBlocked') { const saved = type === 'affectedSaved'; return <div className={`affected-action-reveal effect-${saved ? 'protected' : 'blocked'}`} role="alertdialog"><div className="affected-action-shadows"><i /><i /><i /></div><section><span className="affected-action-icon">{saved ? '⚕️' : '⛔'}</span><small>{saved ? 'ACTION SUBIE · PROTECTION' : 'ACTION SUBIE · BLOCAGE'}</small><h1>{saved ? 'VOUS AVEZ ÉTÉ SAUVÉ' : 'VOTRE ACTION A ÉCHOUÉ'}</h1><p>{saved ? 'Une présence bienveillante vous a arraché à la mort.' : 'Quelqu’un vous a empêché d’agir cette nuit.'}</p><div className="affected-consequence"><span>CONSÉQUENCE</span><b>{saved ? 'VOUS ÊTES TOUJOURS EN VIE' : 'POUVOIR NOCTURNE ANNULÉ'}</b></div><button onClick={onClose}>J’AI COMPRIS</button></section></div>; }
  if (type === 'death') return <div className="death-transition" role="dialog"><div className="death-cemetery">{Array.from({ length: 9 }, (_, index) => <i key={index} />)}</div><div className="death-fog"><i /><i /><i /></div><section><span className="death-soul">†</span><small>LE MONDE DES VIVANTS S’ÉLOIGNE</small><h1>VOUS ÊTES MORT</h1><p>Votre rôle était <b>{role.name}</b>. La partie continue : observez la ville et échangez avec les autres morts.</p><div className="death-rules"><span>💬 Canal privé des morts</span><span>👁 Observation sans action</span><span>🔮 Un Médium peut vous entendre la nuit</span></div><button onClick={onClose}>ENTRER DANS LE MONDE DES MORTS</button></section></div>;
  if (type === 'roleCard') return <LabRoleCardModal role={role} onClose={onClose} />;
  if (type === 'intel') return <LabIntelDrawer onClose={onClose} />;
  if (type === 'settings') return <div className="ui-lab-settings-layer"><aside className="game-settings-popover"><header><div><small>CONFORT DE JEU</small><strong>LISIBILITÉ & AMBIANCE</strong></div><button onClick={onClose}>✕</button></header><section><label>MODE VISUEL</label><div className="visual-theme-options"><button className="active"><b>☾</b><span><strong>Sombre</strong><small>Ambiance cinématique</small></span></button><button><b>☀</b><span><strong>Clair contrasté</strong><small>Lisibilité maximale</small></span></button></div><label>TAILLE DES TEXTES</label><div className="text-scale-options"><button className="active"><b>A</b><span>Normal</span></button><button><b>A+</b><span>Grand</span></button><button><b>A++</b><span>Très grand</span></button></div><label className="setting-switch"><span><b>Contraste renforcé</b><small>Contours plus visibles</small></span><input type="checkbox" /></label></section></aside></div>;
  return null;
}

function LabRoleCardModal({ role, onClose }) {
  const scene = roleScene(role);
  const mafia = role.team === 'MAFIA';
  return <div className={`role-card-modal ${mafia ? 'mafia' : 'town'}`} style={{ '--role-card-accent': role.color }} role="dialog"><section className="role-card-modal-window"><header className="role-card-modal-header"><div><small>IDENTITÉ PERSONNELLE · TOUR 3</small><strong>TA CARTE DE RÔLE</strong></div><button onClick={onClose}>✕</button></header><article className="role-identity-card"><img className="role-card-background-art" src={role.image} alt="" /><div className="role-card-background-veil" /><i className="role-card-corner top-left" /><i className="role-card-corner top-right" /><i className="role-card-corner bottom-left" /><i className="role-card-corner bottom-right" /><div className="role-card-security"><span>CONFIDENTIEL</span><b>LG-03</b></div><div className="role-card-emblem"><span>{role.emoji}</span></div><div className="role-card-identity"><small>VOUS ÊTES</small><h1>{role.name.toUpperCase()}</h1><strong>{mafia ? 'FAMILLE MAFIA' : 'ALLIANCE TOWN'}</strong></div><p className="role-card-description">{role.description}</p><div className="role-card-information"><section><small>TON POUVOIR</small><h2>{scene.title}</h2><p>{scene.copy}</p><b>{scene.action}</b></section><section><small>CONDITION DE VICTOIRE</small><h2>{mafia ? 'PRENDRE LE CONTRÔLE' : 'SAUVER LA VILLE'}</h2><p>{mafia ? 'Élimine les membres de la Town jusqu’à prendre le contrôle du vote.' : 'Identifie puis élimine toute la Mafia.'}</p></section></div></article><footer><span>⚠ Cette carte est privée.</span><button onClick={onClose}>MASQUER LA CARTE</button></footer></section></div>;
}

function LabIntelDrawer({ onClose }) {
  return <div className="intel-drawer-layer"><button className="intel-drawer-backdrop" onClick={onClose} /><aside className="intel-drawer"><header className="intel-drawer-header"><div className="intel-drawer-heading"><span>🗂</span><div><small>CARNET PRIVÉ · CONSULTATION SECRÈTE</small><h2>RENSEIGNEMENTS</h2></div></div><button onClick={onClose}>✕</button></header><div className="intel-drawer-summary"><span className="intel-summary-mark">◈</span><p><strong>3 rapports sécurisés</strong>Les résultats de tes actions sont conservés ici pendant toute la partie.</p></div><div className="intel-list-heading"><span>RAPPORTS COLLECTÉS</span><small>PLUS RÉCENT D’ABORD</small></div><div className="intel-list">{INTEL_REPORTS.map((entry, index) => <article key={entry.id} className={`intel-entry tone-${entry.tone} ${index === 0 ? 'latest' : ''}`}><div className="intel-entry-meta"><span>{index === 0 ? 'DERNIER RAPPORT' : 'RAPPORT CONFIDENTIEL'}</span><time>NUIT {entry.round}</time></div><div className="intel-entry-content"><span className="intel-icon">{entry.icon}</span><div><h3 className="intel-title">{entry.title}</h3><p>{entry.message}</p></div></div></article>)}</div><footer className="intel-drawer-footer"><span>⌁</span> VISIBLE UNIQUEMENT PAR TOI</footer></aside></div>;
}
