import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="ys-public">
      <header className="ys-public-nav">
        <Link className="ys-public-brand" href="/"><span className="ys-brand-mark" aria-hidden="true">Y</span>YatraSetu</Link>
        <nav aria-label="Public navigation">
          <Link href="/discover">Discover</Link>
          <Link href="/trust">Trusted providers</Link>
          <Link href="/login">Log in</Link>
          <Link className="ys-public-signup" href="/register">Sign up</Link>
        </nav>
      </header>
      <section className="ys-public-hero">
        <p className="ys-eyebrow">Reality-aware travel planning</p>
        <h1>One calmer way to plan the journey ahead.</h1>
        <p>Bring your travel intent, destination reality, mobility and support into one clear workspace—then choose whether to go, modify or find a better alternative.</p>
        <div className="ys-public-actions">
          <Link className="ys-public-primary" href="/register">Start planning <span aria-hidden="true">→</span></Link>
          <Link className="ys-public-secondary" href="/dashboard">Explore the workspace <span aria-hidden="true">→</span></Link>
        </div>
      </section>
      <section className="ys-product-preview" aria-label="YatraSetu product preview">
        <div className="ys-preview-toolbar"><strong>YatraSetu</strong><span>Saved · destination reality</span><button type="button">Share</button></div>
        <div className="ys-preview-body">
          <div className="ys-preview-plan">
            <p className="ys-preview-kicker">Your next decision</p>
            <h2>Plan with more confidence</h2>
            <p>See the evidence behind a recommendation, what is still unknown, and the practical next step for your trip.</p>
            <div className="ys-preview-row"><span className="ys-preview-icon ys-preview-icon-green">✓</span><span>Suitability and freshness</span><strong>Known</strong></div>
            <div className="ys-preview-row"><span className="ys-preview-icon ys-preview-icon-amber">↗</span><span>Mobility and arrival</span><strong>Ready</strong></div>
            <div className="ys-preview-row"><span className="ys-preview-icon ys-preview-icon-blue">+</span><span>Safety and offline support</span><strong>Prepare</strong></div>
          </div>
          <div className="ys-preview-map"><span className="ys-map-pin ys-map-pin-one">1</span><span className="ys-map-pin ys-map-pin-two">2</span><span className="ys-map-route" aria-hidden="true" /></div>
        </div>
      </section>
      <section className="ys-public-features">
        <p className="ys-eyebrow">From idea to adaptation</p>
        <h2>Everything your journey needs, without hiding the uncertainty.</h2>
        <div className="ys-public-grid">
          {[
            ['01', 'Discover with intent', 'Start with the experience you want, not a generic list of places.'],
            ['02', 'Decide with evidence', 'Understand freshness, confidence and limitations before you commit.'],
            ['03', 'Adapt with support', 'Keep mobility, safety, offline preparation and help close at hand.'],
          ].map(([number, title, copy]) => <article className="ys-public-card" key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}
        </div>
      </section>
      <footer className="ys-public-footer"><strong>YatraSetu</strong><span>Travel with a clearer next step.</span><Link href="/register">Create your workspace →</Link></footer>
    </main>
  );
}
