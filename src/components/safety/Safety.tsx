'use client';

import { useState } from 'react';
import { useApp } from '@/modules/profile/app-context';
import { useAuth } from '@/modules/auth/AuthProvider';
import { apiClient } from '@/lib/api/client';
import type { OfflineTripPack } from '@/modules/safety/safety.service';
import { SEED_DESTINATIONS } from '@/modules/destination/seed';
import { 
  ShieldAlert, 
  PhoneCall, 
  Wrench, 
  Download, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText
} from 'lucide-react';
import './Safety.css';

export default function Safety() {
  const { 
    selectedDestination, 
    offlinePacks,
    saveOfflinePack,
    tripPlan,
    profile,
    isSosActive,
    setIsSosActive,
  } = useApp();
  const { session } = useAuth();
  const activeDestination = SEED_DESTINATIONS.find((destination) => destination.id === tripPlan?.destinationId) ?? selectedDestination;

  const [sosResult, setSosResult] = useState<{
    status: string;
    incidentId: string;
    timestamp: string;
    locationShared: string;
    simulatedSteps: string[];
    nearestHospital: { name: string; distanceKm: number; phone: string };
    nearestPolice: { station: string; distanceKm: number; phone: string };
  } | null>(null);

  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [mechanicConsent, setMechanicConsent] = useState(false);
  const [mechanicRequests, setMechanicRequests] = useState<Record<string, string>>({});
  const [showSosConfirmation, setShowSosConfirmation] = useState(false);
  const [sosConsent, setSosConsent] = useState(false);

  const offlinePack: OfflineTripPack | null = offlinePacks[activeDestination.id] ?? null;
  const isOfflineSaved = offlinePack !== null;
  const { safety } = activeDestination;

  const handleTriggerSOS = async () => {
    if (!sosConsent) return;
    if (!session?.access_token) return;
    let coordinates = activeDestination.coordinates;
    if ('geolocation' in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 }));
        coordinates = { lat: position.coords.latitude, lng: position.coords.longitude };
      } catch {
        // The server records the destination coordinates only when device location permission is unavailable.
      }
    }
    const res = await apiClient.dispatchAssistance({
      type: 'SOS',
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      locationName: activeDestination.name,
      notes: 'Emergency assistance requested from YatraSetu.',
    }, session.access_token);
    setSosResult({
      status: res.status,
      incidentId: res.id,
      timestamp: res.createdAt,
      locationShared: `${res.coordinates.latitude.toFixed(4)}, ${res.coordinates.longitude.toFixed(4)}`,
      simulatedSteps: [res.message],
      nearestHospital: { name: 'Not provided by configured assistance service', distanceKm: 0, phone: 'Use verified local emergency channels' },
      nearestPolice: { station: 'Not provided by configured assistance service', distanceKm: 0, phone: 'Use verified local emergency channels' },
    });
    setIsSosActive(true);
    setShowSosConfirmation(false);
    setSosConsent(false);
  };

  const handleDownloadPack = async () => {
    if (!session?.access_token) return;
    setIsDownloading(true);
    try {
      const savedTrip = await apiClient.getTrip(session.access_token);
      if (!savedTrip) throw new Error('Create and save a trip before downloading an offline pack.');
      const pack = await apiClient.createOfflinePack({
        tripId: savedTrip.id,
        emergencyData: {
          name: profile.emergencyContactName,
          phone: profile.emergencyContactPhone,
          relationship: profile.emergencyContactRelationship,
        },
      }, session.access_token);
      saveOfflinePack(activeDestination.id, pack as OfflineTripPack);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRequestMechanic = async (mechId: string) => {
    if (!mechanicConsent || !session?.access_token) return;
    const mechanic = activeDestination.mechanics.find((item) => item.id === mechId);
    const res = await apiClient.dispatchAssistance({
      type: 'MECHANIC',
      latitude: activeDestination.coordinates.lat,
      longitude: activeDestination.coordinates.lng,
      locationName: activeDestination.name,
      notes: `Roadside assistance requested for ${mechanic?.name ?? 'a nearby provider'}.`,
    }, session.access_token);
    setMechanicRequests((previous) => ({ ...previous, [mechId]: res.id }));
  };

  return (
    <div className="safety-page">
      {/* Header */}
      <div className="safety-header">
        <div>
          <div className="badge-row">
            <span className="pill-badge pill-red">
            <ShieldAlert size={14} /> Safety and assistance
            </span>
            <span className="pill-badge pill-purple">
              Destination: {activeDestination.region}
            </span>
          </div>
          <h2>Safety Indicator, SOS & Remote Assistance</h2>
          <p className="subtitle">
            Safety signals and assistance availability depend on current provider integrations and permissions.
          </p>
        </div>

        <button className="btn-trigger-sos" onClick={() => setShowSosConfirmation(true)}>
          <PhoneCall size={18} />
          <span>Request assistance</span>
        </button>
      </div>

      {showSosConfirmation && (
        <section className="safety-consent-card glass-panel" role="alertdialog" aria-modal="true" aria-labelledby="sos-consent-title">
          <h3 id="sos-consent-title">Confirm assistance request</h3>
          <p>This records an authenticated assistance event for the active trip. Device location is requested when permitted. No emergency service is contacted unless a configured operator or emergency integration acknowledges it.</p>
          <label><input type="checkbox" checked={sosConsent} onChange={(event) => setSosConsent(event.target.checked)} /> I understand this records a request and does not guarantee dispatch.</label>
          <div><button type="button" className="btn-cancel-sos" onClick={() => { setShowSosConfirmation(false); setSosConsent(false); }}>Cancel</button><button type="button" className="btn-trigger-sos" disabled={!sosConsent} onClick={() => void handleTriggerSOS()}>Request assistance</button></div>
        </section>
      )}

      {/* SOS Active Overlay Banner */}
      {isSosActive && sosResult && (
        <div className="sos-banner glass-panel">
          <div className="sos-banner-head">
            <div className="pulse-red"></div>
            <div>
              <h3>ASSISTANCE REQUEST RECORDED</h3>
              <p>Reference: <strong>{sosResult.incidentId}</strong> · {sosResult.timestamp}</p>
            </div>
          </div>

          <div className="sos-grid">
            <div className="sos-box">
              <span className="sos-sub">Coordinates submitted to the backend</span>
              <strong>{sosResult.locationShared}</strong>
            </div>
            <div className="sos-box">
              <span className="sos-sub">Medical support</span>
              <strong>{sosResult.nearestHospital.name} ({sosResult.nearestHospital.distanceKm} km)</strong>
              <small>Dial: {sosResult.nearestHospital.phone}</small>
            </div>
            <div className="sos-box">
              <span className="sos-sub">Local assistance</span>
              <strong>{sosResult.nearestPolice.station} ({sosResult.nearestPolice.distanceKm} km)</strong>
              <small>Dial: {sosResult.nearestPolice.phone}</small>
            </div>
          </div>

          <ul className="sos-simulation-steps">{sosResult.simulatedSteps.map((step) => <li key={step}>{step}</li>)}</ul>

          <button className="btn-cancel-sos" onClick={() => setIsSosActive(false)}>
            Close Emergency Simulation
          </button>
        </div>
      )}

      {/* Remote Area Warning Banner if applicable */}
      {activeDestination.isRemoteArea && (
        <div className="remote-warning-banner glass-panel">
          <AlertTriangle size={24} className="text-amber" />
          <div className="remote-warn-text">
            <h4>Remote-area demo scenario ({activeDestination.name})</h4>
            <p>
              The demo fixture marks this area as remote, with illustrative facility distances. Confirm connectivity, medical support, fuel, and access through current local sources before travel.
            </p>
          </div>
          <button 
            className={`btn-offline-quick ${isOfflineSaved ? 'saved' : ''}`}
            onClick={handleDownloadPack}
            disabled={isDownloading}
          >
            <Download size={16} />
            <span>{isOfflineSaved ? 'Local demo pack saved' : isDownloading ? 'Saving demo pack...' : 'Save Offline Pack'}</span>
          </button>
        </div>
      )}

      <div className="safety-layout-grid">
        {/* Left Column: Safety Indicator (Factors, Proximity, Freshness) */}
        <div className="safety-indicator-card glass-panel">
          <div className="indicator-top">
            <div>
            <span className="sub-label">ILLUSTRATIVE SAFETY SCENARIO (FR-SAFE-02)</span>
              <h3>Demo scenario: <span className={`text-${safety.level === 'High' ? 'green' : 'amber'}`}>{safety.level}</span></h3>
            </div>
            <div className="safety-score-pill">
              <strong>{safety.score}</strong>
              <small>/100</small>
            </div>
          </div>

          <p className="safety-disclaimer">
            *These are curated examples only; they are not verified current conditions and must not be used to make real-world safety decisions.
          </p>

          {/* Infrastructure Metrics */}
          <div className="infra-stats-grid">
            <div className="infra-stat">
          <span className="stat-label">Fixture connectivity</span>
              <div className="stat-val">
                {safety.networkConnectivity.includes('Zero') ? <WifiOff size={16} className="text-red" /> : <Wifi size={16} className="text-green" />}
                <span>{safety.networkConnectivity}</span>
              </div>
            </div>
            <div className="infra-stat">
              <span className="stat-label">Illustrative medical distance</span>
              <strong>{safety.nearestHospitalKm} km</strong>
            </div>
            <div className="infra-stat">
              <span className="stat-label">Illustrative assistance distance</span>
              <strong>{safety.nearestPoliceKm} km</strong>
            </div>
            <div className="infra-stat">
              <span className="stat-label">Illustrative fuel distance</span>
              <strong>{safety.nearestFuelKm} km</strong>
            </div>
          </div>

          {/* Factor Breakdown */}
          <div className="factors-section">
            <h4>Illustrative Risk & Condition Factors</h4>
            <div className="factors-list">
              {safety.factors.map((f, fi) => (
                <div className="factor-row" key={fi}>
                  <div className={`factor-status-dot dot-${f.status}`}></div>
                  <div className="factor-info">
                    <div className="factor-name-row">
                      <strong>{f.name}</strong>
                      <small>Fixture timestamp: {f.lastVerified}</small>
                    </div>
                    <p>Demo fixture only; not currently verified. {f.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="road-condition-note">
            <Clock size={16} className="text-secondary" />
              <span><strong>Illustrative route note:</strong> {safety.routeConditions}</span>
          </div>
        </div>

        {/* Right Column: Mechanic Assistance & Offline Pack */}
        <div className="support-tools-col">
          {/* Mechanic Breakdown Assistance (New Feature #3) */}
          <div className="mechanic-card glass-panel">
            <div className="mech-card-header">
              <div>
                <span className="sub-label">ROADSIDE RESILIENCE</span>
                <h3>Mechanic Breakdown Assistance</h3>
              </div>
              <Wrench size={20} className="text-amber" />
            </div>
            <p className="mech-intro">
              Provider directory entries are informational. This records an authenticated roadside assistance request for operator acknowledgement.
            </p>

            <label className="safety-consent-inline"><input type="checkbox" checked={mechanicConsent} onChange={(event) => setMechanicConsent(event.target.checked)} /> I understand this records a request and does not guarantee provider dispatch.</label>

            <div className="mechanics-list">
              {activeDestination.mechanics.map((mech) => (
                <div className="mech-item" key={mech.id}>
                  <div className="mech-info-top">
                    <div>
                      <h4>{mech.name}</h4>
                      <span className="mech-shop">{mech.shopName}</span>
                    </div>
                    <div className="mech-dist">
                      <strong>{mech.distanceKm} km</strong>
                      <span className="mech-available-tag">Fixture · availability unknown</span>
                    </div>
                  </div>

                  <p className="mech-spec">{mech.specialty}</p>

                  <div className="mech-foot">
                    <span className="mech-fee">Est. Callout: ₹{mech.estimatedChargeInr}</span>
                    {mechanicRequests[mech.id] ? (
                      <span className="btn-requested">
                        <CheckCircle2 size={14} /> Request recorded · {mechanicRequests[mech.id]}
                      </span>
                    ) : (
                      <button 
                        className="btn-call-mech"
                        disabled={!mechanicConsent}
                        onClick={() => handleRequestMechanic(mech.id)}
                      >
                        <Wrench size={14} />
                        <span>Request roadside assistance</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Offline Pack Manager (New Feature #6) */}
          <div className="offline-pack-card glass-panel">
            <div className="offline-card-top">
              <div>
                <span className="sub-label">OFFLINE TRIP PACK (FR-SAFE-05)</span>
                <h3>{isOfflineSaved ? 'Offline Demo Pack Saved' : 'Prepare Trip Information'}</h3>
              </div>
              <FileText size={20} className="text-blue" />
            </div>

            <p className="offline-desc">
              Saves the trip outline, your entered contact, coordinates, and example support records to this browser. This demo does not include map tiles, verified emergency contacts, or live conditions.
            </p>

            {offlinePack && (
              <div className="offline-bundle-preview">
                <div className="bundle-stat">
                  <span>Map data:</span> <strong>{offlinePack.mapDataNote}</strong>
                </div>
                <div className="bundle-stat">
                  <span>Personal contacts:</span> <strong>{offlinePack.emergencyContacts.length || 'None'} · user-entered, not verified</strong>
                </div>
                <div className="bundle-stat">
                  <span>Trip items saved:</span> <strong>{offlinePack.itinerary.length}</strong>
                </div>
                <div className="bundle-stat"><span>Dynamic data:</span><strong>Unknown · last sync not available</strong></div>
                <div className="offline-saved-itinerary"><strong>Saved itinerary</strong>{offlinePack.itinerary.length ? <ul>{offlinePack.itinerary.map((item, index) => <li key={`${item.day}-${item.time}-${index}`}>Day {item.day} · {item.time} · {item.title || 'Untitled activity'}</li>)}</ul> : <p>No trip itinerary existed when this pack was saved.</p>}</div>
                <ul>{offlinePack.survivalNotes.map((note) => <li key={note}>{note}</li>)}</ul>
              </div>
            )}

            <button 
              className={`btn-offline-toggle ${isOfflineSaved ? 'btn-synced' : ''}`}
              onClick={handleDownloadPack}
              disabled={isDownloading}
            >
              <Download size={16} />
              <span>{isOfflineSaved ? 'Refresh local demo pack' : isDownloading ? 'Saving demo pack...' : 'Save offline demo pack'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
