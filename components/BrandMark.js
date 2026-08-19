import Image from 'next/image';
import Link from 'next/link';

export default function BrandMark({ href = '/', compact = false }) {
  return (
    <Link href={href} className={`landing-brand ${compact ? 'compact' : ''}`} aria-label="MAFIA — accueil">
      <Image
        className="brand-logo-image"
        src="/brand/mafia-logo-flat.png"
        alt="MAFIA"
        width={1200}
        height={391}
        priority
        sizes={compact ? '152px' : '190px'}
      />
    </Link>
  );
}
