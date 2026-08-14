export default function PageHeading({ eyebrow, title, subtitle }) {
  return (
    <header className="page-heading">
      {eyebrow && <div className="page-eyebrow">{eyebrow}</div>}
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </header>
  );
}
