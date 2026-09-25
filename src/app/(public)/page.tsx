import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="ys-landing">
      <Link className="ys-landing-brand" href="/">YatraSetu</Link>
      <section className="ys-landing-copy">
        <p className="ys-eyebrow">A clearer way to travel</p>
        <h1>Travel plans that respond to <em>real life.</em></h1>
        <p>Bring your travel intent together with destination conditions, practical mobility and support—then choose the next step with confidence.</p>
        <Link href="/dashboard">Explore the traveller workspace <span aria-hidden="true">→</span></Link>
      </section>
      <aside className="ys-landing-aside">
        <strong>One journey, from idea to adaptation</strong>
        <ul>
          <li>Find places that match the experience you want.</li>
          <li>See what is known, what is fresh and what is uncertain.</li>
          <li>Decide whether to go, modify your plan or consider an alternative.</li>
        </ul>
      </aside>
    </main>
  );
}
