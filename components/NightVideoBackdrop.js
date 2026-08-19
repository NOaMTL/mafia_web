'use client';

export default function NightVideoBackdrop({ disabled = false, contained = false }) {
  return (
    <div className={`night-video-backdrop ${contained ? 'contained' : 'fullscreen'} ${disabled ? 'is-static' : ''}`} aria-hidden="true">
      {!disabled && (
        <video autoPlay muted loop playsInline preload="auto" poster="/bg/nuit.webp">
          <source src="/bg/night.mp4" type="video/mp4" />
        </video>
      )}
    </div>
  );
}
