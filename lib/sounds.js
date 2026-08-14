// Cues audio synthétisés en Web Audio — zéro fichier, zéro téléchargement.
// Mute persistant via localStorage ('mafia_muted').

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
  return localStorage.getItem('mafia_muted') === '1';
}

export function toggleMute() {
  const next = !isMuted();
  localStorage.setItem('mafia_muted', next ? '1' : '0');
  return next;
}

/** Play one tone. */
function tone(freq, { t = 0, dur = 0.4, type = 'sine', gain = 0.12, glideTo = null } = {}) {
  const ac = audioCtx();
  if (!ac || isMuted()) return;
  const osc = ac.createOscillator();
  const g   = ac.createGain();
  const start = ac.currentTime + t;

  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, start + dur);

  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(gain, start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);

  osc.connect(g).connect(ac.destination);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

// ─── Cues ─────────────────────────────────────────────────────────────────────

export const sounds = {
  /** Night falls — low descending drone. */
  night() {
    tone(220, { dur: 1.6, type: 'sine', gain: 0.08, glideTo: 110 });
    tone(110, { t: 0.2, dur: 1.8, type: 'triangle', gain: 0.05, glideTo: 55 });
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
