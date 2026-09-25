import Link from 'next/link';

export function PrototypePage({
  section,
  title,
  description,
  next,
}: {
  section: string;
  title: string;
  description: string;
  next?: { href: string; label: string };
}) {
  return (
    <section className="ys-page">
      <p className="ys-eyebrow">{section}</p>
      <h1>{title}</h1>
      <p>{description}</p>
      <p>This part of the journey is a structural shell. It does not claim to save, book, verify or dispatch anything yet.</p>
      {next && <Link href={next.href}>{next.label} <span aria-hidden="true">→</span></Link>}
    </section>
  );
}
