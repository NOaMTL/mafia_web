// Cues audio synthétisés en Web Audio — zéro fichier, zéro téléchargement.
// Mixage persistant via localStorage. Tous les sons restent synthétisés :
// aucun fichier audio externe ni délai de téléchargement.

let ctx = null;

function audioCtx() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function isMuted() {
  if (typeof window === 'undefined') return true;
  return getAudioSettings().muted;
}

export function toggleMute() {
  const next = !isMuted();
  localStorage.setItem('mafia_muted', next ? '1' : '0');
  setAudioSettings({ muted: next });
  return next;
}

const DEFAULT_AUDIO_SETTINGS = { muted: false, master: 0.85, effects: 0.9, ambience: 0.65 };

export function getAudioSettings() {
  if (typeof window === 'undefined') return { ...DEFAULT_AUDIO_SETTINGS, muted: true };
  try {
    const saved = JSON.parse(localStorage.getItem('mafia_audio_settings') ?? '{}');
    return {
      ...DEFAULT_AUDIO_SETTINGS,
      ...saved,
      muted: saved.muted ?? localStorage.getItem('mafia_muted') === '1',
    };
  } catch {
    return { ...DEFAULT_AUDIO_SETTINGS, muted: localStorage.getItem('mafia_muted') === '1' };
  }
}

export function setAudioSettings(patch) {
  if (typeof window === 'undefined') return { ...DEFAULT_AUDIO_SETTINGS, ...patch };
  const next = { ...getAudioSettings(), ...patch };
  for (const key of ['master', 'effects', 'ambience']) {
    next[key] = Math.max(0, Math.min(1, Number(next[key]) || 0));
  }
  localStorage.setItem('mafia_audio_settings', JSON.stringify(next));
  localStorage.setItem('mafia_muted', next.muted ? '1' : '0');
  return next;
}

/** Play one tone. */
function tone(freq, { t = 0, dur = 0.4, type = 'sine', gain = 0.12, glideTo = null, channel = 'effects' } = {}) {
  const ac = audioCtx();
  const settings = getAudioSettings();
  if (!ac || settings.muted) return;
  const osc = ac.createOscillator();
  const g   = ac.createGain();
  const start = ac.currentTime + t;

  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, start + dur);

  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(gain * settings.master * settings[channel], start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);

  osc.connect(g).connect(ac.destination);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

// ─── Cues ─────────────────────────────────────────────────────────────────────

export const sounds = {
  /** Night falls — low descending drone. */
  night() {
    tone(220, { dur: 1.6, type: 'sine', gain: 0.08, glideTo: 110, channel: 'ambience' });
    tone(110, { t: 0.2, dur: 1.8, type: 'triangle', gain: 0.05, glideTo: 55, channel: 'ambience' });
  },

  /** Morning bell (gazette). */
  morning() {
    tone(880,  { dur: 0.5, type: 'sine', gain: 0.09 });
    tone(1320, { t: 0.12, dur: 0.6, type: 'sine', gain: 0.06 });
  },

  /** Trial gong — dark and heavy. */
  gong() {
    tone(98,  { dur: 2.2, type: 'triangle', gain: 0.16 });
    tone(147, { t: 0.03, dur: 1.8, type: 'sine', gain: 0.08 });
    tone(196, { t: 0.06, dur: 1.2, type: 'sine', gain: 0.05 });
  },

  /** A death — descending minor hit. */
  death() {
    tone(392, { dur: 0.35, type: 'sawtooth', gain: 0.07, glideTo: 196 });
    tone(196, { t: 0.3, dur: 0.9, type: 'triangle', gain: 0.09, glideTo: 98 });
  },

  /** New chat message — soft tick. */
  tick() {
    tone(1200, { dur: 0.08, type: 'sine', gain: 0.045 });
  },

  /** A choice is sealed — timbre changes subtly with the role family. */
  action(role = '') {
    const mafia = ['GODFATHER', 'MAFIOSO', 'BLACKMAILER', 'JANITOR', 'FRAMER', 'CONSORT', 'CONSIGLIERE'].includes(role);
    const investigative = ['SHERIFF', 'DETECTIVE', 'INVESTIGATOR', 'LOOKOUT', 'SPY'].includes(role);
    const root = mafia ? 147 : investigative ? 440 : role === 'DOCTOR' ? 523 : 294;
    tone(root, { dur: 0.16, type: mafia ? 'sawtooth' : 'triangle', gain: 0.065 });
    tone(root * (mafia ? 1.19 : 1.5), { t: 0.11, dur: 0.28, type: 'sine', gain: 0.075 });
  },

  denied() {
    tone(180, { dur: 0.14, type: 'square', gain: 0.045, glideTo: 120 });
    tone(130, { t: 0.13, dur: 0.2, type: 'square', gain: 0.035 });
  },

  vote() {
    tone(330, { dur: 0.08, type: 'triangle', gain: 0.055 });
    tone(247, { t: 0.07, dur: 0.18, type: 'triangle', gain: 0.05 });
  },

  paper() {
    tone(1800, { dur: 0.035, type: 'sawtooth', gain: 0.018 });
    tone(1200, { t: 0.04, dur: 0.05, type: 'sawtooth', gain: 0.014 });
  },

  heartbeat() {
    tone(72, { dur: 0.13, type: 'sine', gain: 0.13, channel: 'ambience' });
    tone(64, { t: 0.19, dur: 0.17, type: 'sine', gain: 0.1, channel: 'ambience' });
  },

  spirit() {
    tone(392, { dur: 1.5, type: 'sine', gain: 0.055, glideTo: 784, channel: 'ambience' });
    tone(523, { t: 0.18, dur: 1.6, type: 'triangle', gain: 0.035, glideTo: 1046, channel: 'ambience' });
  },

  seance() {
    tone(174, { dur: 1.4, type: 'triangle', gain: 0.045, glideTo: 261, channel: 'ambience' });
    tone(349, { t: 0.3, dur: 1.1, type: 'sine', gain: 0.025, glideTo: 523, channel: 'ambience' });
  },

  /** Victory — small major arpeggio. */
  victory() {
    tone(523, { dur: 0.35, gain: 0.1 });
    tone(659, { t: 0.15, dur: 0.35, gain: 0.1 });
    tone(784, { t: 0.30, dur: 0.5,  gain: 0.1 });
    tone(1046,{ t: 0.45, dur: 0.8,  gain: 0.09 });
  },

  /** Defeat — sombre descending line. */
  defeat() {
    tone(392, { dur: 0.4, gain: 0.09 });
    tone(311, { t: 0.25, dur: 0.4, gain: 0.09 });
    tone(233, { t: 0.5,  dur: 0.9, gain: 0.1, glideTo: 116 });
  },
};
