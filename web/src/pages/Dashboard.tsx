import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
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
    offlinePacksDownloaded, 
    toggleOfflinePack,
    isEvaluating 
  } = useApp();
  
  const navigate = useNavigate();
  const isOfflineSaved = offlinePacksDownloaded.includes(selectedDestination.id);

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
            YatraSetu harmonizes your personal travel intent with real-time on-ground conditions, giving you clear GO / MODIFY decisions and remote resilience.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => navigate('/discover')}>
              <Compass size={18} />
              <span>Explore Decision Engine</span>
              <ArrowRight size={16} />
            </button>
            <button 
              className={`btn-secondary ${isOfflineSaved ? 'btn-saved' : ''}`}
              onClick={() => toggleOfflinePack(selectedDestination.id)}
            >
              <Download size={18} />
              <span>{isOfflineSaved ? 'Offline Pack Synced' : 'Download Trip Pack'}</span>
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
            <div className={`decision-pill pill-${evaluation?.decision.toLowerCase() || 'go'}`}>
              {isEvaluating ? 'Evaluating...' : evaluation?.decision}
            </div>
            <div className="suitability-preview">
              <span>Suitability Match:</span>
              <strong>{evaluation?.suitabilityScore || 85}%</strong>
            </div>
          </div>

          <p className="trip-card-note">
            "{selectedDestination.suitabilityNote}"
          </p>

          <div className="trip-card-footer">
            <div className="footer-stat">
              <span>Footfall Pressure</span>
              <strong className={selectedDestination.crowdLevel === 'heavy' ? 'text-amber' : 'text-green'}>
                {selectedDestination.sustainability.currentFootfallPressure}
              </strong>
            </div>
            <div className="footer-stat">
              <span>Connectivity</span>
              <strong>{selectedDestination.safety.networkConnectivity}</strong>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Status Grid */}
      <div className="dashboard-grid">
        {/* Card 1: Decision Intelligence */}
        <div className="feature-card glass-panel" onClick={() => navigate('/discover')}>
          <div className="card-icon icon-blue">
            <Compass size={24} />
          </div>
          <h3>AI Decision Engine</h3>
          <p>
            Deterministic suitability scoring, transparent ruleset explanations, and experience-equivalent alternatives.
          </p>
          <div className="card-metric">
            <span>Confidence Index</span>
            <strong>{evaluation?.confidenceScore || 90}%</strong>
          </div>
          <div className="card-link">
            <span>View Reality Engine</span>
            <ArrowRight size={16} />
          </div>
        </div>

        {/* Card 2: Smart Mobility */}
        <div className="feature-card glass-panel" onClick={() => navigate('/mobility')}>
          <div className="card-icon icon-green">
            <Navigation size={24} />
          </div>
          <h3>Smart Mobility & Drop Points</h3>
          <p>
            Multimodal routing with Smart Arrival Point at <strong>{selectedDestination.arrivalPoint.name}</strong>.
          </p>
          <div className="card-metric">
            <span>Vehicles Available</span>
            <strong>{selectedDestination.rentals.length} Verified</strong>
          </div>
          <div className="card-link">
            <span>Open Route & Rentals</span>
            <ArrowRight size={16} />
          </div>
        </div>

        {/* Card 3: Safety & Resilience */}
        <div className="feature-card glass-panel" onClick={() => navigate('/safety')}>
          <div className="card-icon icon-red">
            <ShieldAlert size={24} />
          </div>
          <h3>Resilience & Remote SOS</h3>
          <p>
            Live Safety Indicator, one-tap emergency satellite simulation, and {selectedDestination.mechanics.length} local mechanics on standby.
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
          <h4>Live Destination Telemetry ({selectedDestination.name})</h4>
        </div>
        <div className="evidence-items">
          {selectedDestination.evidence.map((ev, i) => (
            <div className="evidence-item" key={i}>
              <span className="ev-label">{ev.label}</span>
              <span className="ev-val">{ev.value}</span>
              <span className="ev-meta">{ev.source} · {ev.collectedAt}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
