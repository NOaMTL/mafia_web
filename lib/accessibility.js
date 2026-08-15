const DEFAULTS = {
  textScale: 'normal',
  reducedMotion: false,
  highContrast: false,
};

export function getAccessibilitySettings() {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const saved = JSON.parse(localStorage.getItem('mafia_accessibility') ?? '{}');
    return {
      ...DEFAULTS,
      ...saved,
      textScale: ['normal', 'large', 'xlarge'].includes(saved.textScale) ? saved.textScale : 'normal',
      reducedMotion: saved.reducedMotion ?? window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    };
  } catch {
    return DEFAULTS;
  }
}

export function applyAccessibilitySettings(settings) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.gameText = settings.textScale;
  root.dataset.gameMotion = settings.reducedMotion ? 'reduced' : 'full';
  root.dataset.gameContrast = settings.highContrast ? 'high' : 'normal';
}

export function saveAccessibilitySettings(patch) {
  if (typeof window === 'undefined') return { ...DEFAULTS, ...patch };
  const next = { ...getAccessibilitySettings(), ...patch };
  localStorage.setItem('mafia_accessibility', JSON.stringify(next));
  applyAccessibilitySettings(next);
  return next;
}
