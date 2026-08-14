import Link from 'next/link';

export default function BrandMark({ href = '/', compact = false }) {
  return (
    <Link href={href} className={`landing-brand ${compact ? 'compact' : ''}`}>
      <svg className="wolf-mark" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="29" />
        <path d="M20 46c3-7 3-13 2-18l7 4 5-14 4 11 8-6-2 12c5 4 7 9 7 15H17c0-2 1-3 3-4Z" />
        <path d="m34 37 6-2-3 5Z" className="wolf-eye" />
        <path d="M24 48c2 3 3 6 3 9M34 49v8M43 47c-1 4-1 7 0 10" />
      </svg>
      <span className="brand-copy">
        <strong>LOUP GAROU</strong>
        <small>MAFIA</small>
      </span>
    </Link>
  );
}
