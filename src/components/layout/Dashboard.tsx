import { useRouter } from 'next/navigation';
import { useApp } from '@/modules/profile/app-context';
import { 
  Sparkles, 
  ShieldAlert, 
  ArrowRight, 
  Award, 
  Download, 
  Navigation,
  Compass
} from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
  const { 
    selectedDestination, 
    evaluation, 
    yatraPoints, 
    offlinePacks,
    evaluationStatus
  } = useApp();
  
  const router = useRouter();
  const isOfflineSaved = Boolean(offlinePacks[selectedDestination.id]);

  return (
    <div className="dashboard-container">
      {/* Top Banner / Hero */}
      <header className="dashboard-hero glass-panel">
        <div className="hero-content">
          <div className="badge-row">
            <span className="pill-badge pill-purple">
              <Sparkles size={14} /> Gujarat Pilot · Phase 1
            </span>
            <span className="pill-badge pill-gold">
              <Award size={14} /> {yatraPoints} Yatra Points
            </span>
          </div>
          <h1 className="hero-title">
            Adaptive Intelligence for <span>Confident Journeys</span>
          </h1>
          <p className="hero-subtitle">
            Explore how YatraSetu can connect your travel intent to destination conditions. This preview uses curated fixtures and partial provider data.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => router.push('/discover')}>
              <Compass size={18} />
              <span>Explore Decision Engine</span>
              <ArrowRight size={16} />
            </button>
            <button 
              className={`btn-secondary ${isOfflineSaved ? 'btn-saved' : ''}`}
              onClick={() => router.push('/support')}
            >
              <Download size={18} />
              <span>{isOfflineSaved ? 'View Saved Demo Pack' : 'Prepare Offline Demo Pack'}</span>
            </button>
          </div>
        </div>
        
        <div className="hero-trip-card glass-panel">
          <div className="trip-card-header">
            <div>
              <span className="sub-label">ACTIVE DESTINATION</span>
              <h3>{selectedDestination.name}</h3>
            </div>
            <span className="region-tag">{selectedDestination.region}</span>
          </div>
          
          <div className="decision-preview-row">
            <div className={`decision-pill pill-${evaluation?.decision.toLowerCase() || 'unknown'}`}>
              {evaluationStatus === 'loading' ? 'Checking...' : evaluation?.decision || 'Not assessed'}
            </div>
            <div className="suitability-preview">
              <span>Current suitability:</span>
              <strong>{evaluation?.suitabilityScore == null ? '—' : `${evaluation.suitabilityScore}%`}</strong>
            </div>
          </div>

          <p className="trip-card-note">
            "{selectedDestination.suitabilityNote}"
          </p>

          <div className="trip-card-footer">
            <div className="footer-stat">
              <span>Demo crowd fixture</span>
              <strong className={selectedDestination.crowdLevel === 'heavy' ? 'text-amber' : 'text-green'}>
                {selectedDestination.sustainability.currentFootfallPressure}
              </strong>
            </div>
            <div className="footer-stat">
              <span>Demo connectivity fixture</span>
              <strong>{selectedDestination.safety.networkConnectivity}</strong>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Status Grid */}
      <div className="dashboard-grid">
        {/* Card 1: Decision Intelligence */}
        <div className="feature-card glass-panel" role="link" tabIndex={0} onClick={() => router.push('/discover')} onKeyDown={(event) => event.key === 'Enter' && router.push('/discover')}>
          <div className="card-icon icon-blue">
            <Compass size={24} />
          </div>
          <h3>Destination Assessment</h3>
          <p>
            This local demo uses illustrative destination scenarios. Weather, crowd, operating and accessibility data are not checked live.
          </p>
          <div className="card-metric">
            <span>Confidence Index</span>
            <strong>{evaluation ? `${Math.round(evaluation.confidence * 100)}%` : '—'}</strong>
          </div>
          <div className="card-link">
            <span>View Reality Engine</span>
            <ArrowRight size={16} />
          </div>
        </div>

        {/* Card 2: Smart Mobility */}
        <div className="feature-card glass-panel" role="link" tabIndex={0} onClick={() => router.push('/mobility')} onKeyDown={(event) => event.key === 'Enter' && router.push('/mobility')}>
          <div className="card-icon icon-green">
            <Navigation size={24} />
          </div>
          <h3>Smart Mobility & Drop Points</h3>
          <p>
            Multimodal routing with Smart Arrival Point at <strong>{selectedDestination.arrivalPoint.name}</strong>.
          </p>
          <div className="card-metric">
            <span>Vehicles Available</span>
            <strong>{selectedDestination.rentals.length} demo listings</strong>
          </div>
          <div className="card-link">
            <span>Open Route & Rentals</span>
            <ArrowRight size={16} />
          </div>
        </div>

        {/* Card 3: Safety & Resilience */}
        <div className="feature-card glass-panel" role="link" tabIndex={0} onClick={() => router.push('/safety')} onKeyDown={(event) => event.key === 'Enter' && router.push('/safety')}>
          <div className="card-icon icon-red">
            <ShieldAlert size={24} />
          </div>
          <h3>Resilience & Remote SOS</h3>
          <p>
            Curated support fixtures only. No emergency dispatch or live mechanic availability is connected.
          </p>
          <div className="card-metric">
            <span>Safety Indicator</span>
            <strong className={selectedDestination.safety.level === 'High' ? 'text-green' : 'text-amber'}>
              {selectedDestination.safety.level} ({selectedDestination.safety.score}/100)
            </strong>
          </div>
          <div className="card-link">
            <span>Access Safety Hub</span>
            <ArrowRight size={16} />
          </div>
        </div>
      </div>

      {/* Real-time Evidence Banner */}
      <section className="evidence-strip glass-panel">
        <div className="strip-header">
          <div className="pulse-dot"></div>
          <h4>Illustrative Destination Signals ({selectedDestination.name})</h4>
        </div>
        <div className="evidence-items">
          {selectedDestination.evidence.map((ev, i) => (
            <div className="evidence-item" key={i}>
              <span className="ev-label">{ev.label}</span>
              <span className="ev-val">{ev.value}</span>
              <span className="ev-meta">Curated YatraSetu demo fixture · source and currentness not verified</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
