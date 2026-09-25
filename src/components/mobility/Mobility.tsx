'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/modules/profile/app-context';
import { mobilityService, type SmartRoutePlan } from '@/modules/mobility/mobility.service';

import { type VehicleRentalOption, SEED_DESTINATIONS } from '@/modules/destination/seed';
import { 
  Navigation, 
  MapPin, 
  Clock, 
  Car, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle, 
  Leaf,
  Wrench
} from 'lucide-react';
import './Mobility.css';

export default function Mobility() {
  const { selectedDestination, profile, tripPlan, updateTripPlan, recordSupportRequest } = useApp();
  const activeDestination = SEED_DESTINATIONS.find((destination) => destination.id === tripPlan?.destinationId) ?? selectedDestination;
  const [routePlan, setRoutePlan] = useState<SmartRoutePlan | null>(null);
  const [rentals, setRentals] = useState<VehicleRentalOption[]>([]);
  const [bookedRentalId, setBookedRentalId] = useState<string | null>(null);
  const [rentalRequest, setRentalRequest] = useState<{ reference: string; message: string } | null>(null);
  const [fallbackOriginCity, setOriginCity] = useState<string>('Ahmedabad Junction');
  const originCity = tripPlan?.origin ?? fallbackOriginCity;
  const matchingRentals = rentals.filter((rental) => rental.capacity >= (tripPlan?.partySize ?? profile.partySize));

  useEffect(() => {
    let current = true;
    void Promise.all([
      mobilityService.getRoutePlan(originCity, activeDestination.id, tripPlan?.transportPreference ?? profile.transportPreference),
      mobilityService.getVehicleRentals(activeDestination.id),
    ]).then(([route, options]) => {
      if (!current) return;
      setRoutePlan(route);
      setRentals(options);
    });
    return () => { current = false; };
  }, [originCity, activeDestination.id, tripPlan?.transportPreference, profile.transportPreference]);

  const handleBookRental = async (rental: VehicleRentalOption) => {
    const res = await mobilityService.createDemoRentalRequest(rental.id, tripPlan?.travelDates ?? profile.travelDates);
    setBookedRentalId(rental.id);
    setRentalRequest(res);
    recordSupportRequest({
      id: res.reference,
      reference: res.reference,
      kind: 'rental',
      destinationId: activeDestination.id,
      destinationName: activeDestination.name,
      detail: `${rental.model} · requested for ${(tripPlan?.travelDates ?? profile.travelDates) || 'dates not set'}`,
      status: 'recorded',
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="mobility-page">
      {/* Header */}
      <div className="mobility-header">
        <div>
          <div className="badge-row">
            <span className="pill-badge pill-purple">
              <Sparkles size={14} /> Smart Mobility Layer
            </span>
            <span className="pill-badge pill-green">
              <Leaf size={14} /> Illustrative route data · not live
            </span>
          </div>
          <h2>Smart Routes, Drop Points & Vehicle Rentals</h2>
          <p className="subtitle">
            Illustrative route legs and vehicle listings for the selected destination. Routes and availability are not live.
          </p>
        </div>

        <div className="origin-picker glass-panel">
          <MapPin size={16} className="text-secondary" />
          <span>Origin:</span>
          <select 
            value={originCity} 
            onChange={(e) => { setOriginCity(e.target.value); if (tripPlan) updateTripPlan({ origin: e.target.value }); }}
            className="origin-select"
          >
            {originCity && !['Ahmedabad Junction', 'Gandhinagar Capital', 'Vadodara Central'].includes(originCity) && <option value={originCity}>{originCity}</option>}
            <option value="Ahmedabad Junction">Ahmedabad Junction</option>
            <option value="Gandhinagar Capital">Gandhinagar Capital</option>
            <option value="Vadodara Central">Vadodara Central</option>
          </select>
        </div>
      </div>

      <div className="mobility-grid">
        {/* Left Column: Smart Route & Smart Arrival Point */}
        <div className="route-column">
          {/* Smart Arrival Point Spotlight (Our distinctive feature) */}
          <div className="arrival-spotlight glass-panel">
            <div className="spotlight-top">
              <div className="spotlight-badge">
                <Navigation size={16} />
                <span>RECOMMENDED SMART ARRIVAL POINT (FR-MOB-02)</span>
              </div>
              <span className="pill-badge pill-gold">Nearest ≠ Best</span>
            </div>

            <h3>{activeDestination.arrivalPoint.name}</h3>
            <p className="arrival-reason">
              "{activeDestination.arrivalPoint.reason}"
            </p>

            <div className="arrival-metrics-row">
              <div className="arrival-stat">
                <Clock size={16} />
                <span>{activeDestination.arrivalPoint.walkTime}</span>
              </div>
              <div className="arrival-stat">
                <MapPin size={16} />
                <span>{activeDestination.arrivalPoint.distanceToDestinationKm} km from core</span>
              </div>
              <div className="arrival-stat">
                <ShieldCheck size={16} />
                <span>{activeDestination.arrivalPoint.accessibilityScore}/100 Access</span>
              </div>
            </div>

            <div className="facilities-cluster">
              <span className="fac-label">Illustrative arrival facilities:</span>
              <div className="facilities-tags">
                {activeDestination.arrivalPoint.facilities.map((f, i) => (
                  <span className="fac-tag" key={i}>
                    <CheckCircle size={12} /> {f}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Multimodal Route Legs */}
          <div className="route-legs-card glass-panel">
            <div className="legs-header">
              <h3>Multimodal Journey Breakdown</h3>
              <span className="total-time">{routePlan?.segments.length ? `Illustrative total: ${routePlan.totalDurationMinutes} mins · ${routePlan.totalDistanceKm} km` : 'No route fixture available'}</span>
            </div>

            {routePlan?.availabilityNote && <p className="rent-desc">{routePlan.availabilityNote}</p>}
            <div className="timeline-container">
              {routePlan?.segments.map((seg, idx) => (
                <div className="timeline-item" key={idx}>
                  <div className="timeline-marker">
                    <div className="marker-dot"></div>
                    {idx < (routePlan?.segments.length || 0) - 1 && <div className="marker-line"></div>}
                  </div>
                  <div className="timeline-content">
                    <div className="seg-top">
                      <span className="seg-mode">{seg.mode}</span>
                      <span className="seg-stats">{seg.durationMinutes} min · {seg.distanceKm} km</span>
                    </div>
                    <div className="seg-places">
                      <strong>{seg.from}</strong> → <strong>{seg.to}</strong>
                    </div>
                    <p className="seg-notes">{seg.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Vehicle Rental Marketplace & Mechanics */}
        <div className="rentals-column">
          <div className="rentals-header-box glass-panel">
            <div className="rent-title-row">
              <div>
                <span className="sub-label">ON-DEMAND MOBILITY</span>
                <h3>Vehicle Rental Fixtures</h3>
              </div>
              <Car size={20} className="text-blue" />
            </div>
            <p className="rent-desc">
              Example terrain-matched listings. No inventory or provider verification is connected.
            </p>
          </div>

          {/* Rental Options List */}
          <div className="rentals-list">
            {matchingRentals.map((rental) => {
              const isBooked = bookedRentalId === rental.id;
              return (
                <div className={`rental-card glass-panel ${isBooked ? 'card-booked' : ''}`} key={rental.id}>
                  <div className="rental-top">
                    <div>
                      <span className="rental-type">{rental.type}</span>
                      <h4>{rental.model}</h4>
                      <span className="rental-provider">
                        <ShieldCheck size={12} className="text-green" /> Demo listing · {rental.provider}
                      </span>
                    </div>
                    <div className="rental-price">
                      <strong>₹{rental.dailyRateInr}</strong>
                      <small>illustrative / day</small>
                    </div>
                  </div>

                  <div className="terrain-tags">
                    <span className="terrain-label">Terrain Fit:</span>
                    {rental.suitableTerrain.map((t, ti) => (
                      <span className="t-tag" key={ti}>{t}</span>
                    ))}
                  </div>

                  <div className="rental-meta-row">
                    <span>{rental.transmission}</span>
                    <span>·</span>
                    <span>{rental.capacity} Persons</span>
                    <span>·</span>
                    <span>Example rating {rental.rating}</span>
                  </div>

                  {isBooked ? (
                    <div className="booking-pass">
                      <CheckCircle size={16} />
                      <div>
                        <strong>Demo request recorded</strong>
                        <small>{rentalRequest?.reference}. {rentalRequest?.message}</small>
                      </div>
                    </div>
                  ) : (
                    <button className="btn-book-rental" onClick={() => handleBookRental(rental)}>
                      <span>Send demo rental request</span>
                    </button>
                  )}
                </div>
              );
            })}
            {matchingRentals.length === 0 && <p className="rent-desc">No demo vehicle fixture has capacity for {tripPlan?.partySize ?? profile.partySize} travellers. Contact a local provider independently.</p>}
          </div>

          {/* Local Mechanic Quick Bar */}
          <div className="mechanic-preview-card glass-panel">
            <div className="mech-top">
              <Wrench size={18} className="text-amber" />
              <div>
                <h4>{activeDestination.mechanics.length} Mechanics in the demo catalogue</h4>
                <p>Illustrative nearest distance: {activeDestination.safety.nearestMechanicKm} km. Availability is not live.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
