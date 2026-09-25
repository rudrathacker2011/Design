import { SEED_DESTINATIONS, type SafetyIndicatorData, type Mechanic } from '../destination/seed';

export interface EmergencyContact {
  role: string;
  name: string;
  phone: string;
  availability: string;
  isVerifiedGov: boolean;
}

export interface OfflineTripPack {
  destinationName: string;
  downloadedAt: string;
  itinerary: { day: number; time: string; title: string; notes: string }[];
  offlineCoordinates: { lat: number; lng: number };
  mapDataNote: string;
  realityLastSynced: null;
  emergencyContacts: EmergencyContact[];
  offlineMechanics: Mechanic[];
  survivalNotes: string[];
  safeNodes: string[];
  sizeKb: null;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const safetyService = {
  async getSafetyIndicator(destinationId: string): Promise<SafetyIndicatorData> {
    await delay(150);
    const dest = SEED_DESTINATIONS.find((item) => item.id === destinationId) ?? SEED_DESTINATIONS[0];
    return dest.safety;
  },

  async triggerSOS(destinationId: string): Promise<{
    status: 'SIMULATED_ONLY';
    incidentId: string;
    timestamp: string;
    locationShared: string;
    simulatedSteps: string[];
    nearestHospital: { name: string; distanceKm: number; phone: string };
    nearestPolice: { station: string; distanceKm: number; phone: string };
  }> {
    await delay(250);
    const dest = SEED_DESTINATIONS.find((item) => item.id === destinationId) ?? SEED_DESTINATIONS[0];
    return {
      status: 'SIMULATED_ONLY',
      incidentId: `DEMO-SOS-${Date.now().toString().slice(-8)}`,
      timestamp: new Date().toLocaleTimeString(),
      locationShared: `Illustrative destination coordinates ${dest.coordinates.lat.toFixed(4)}, ${dest.coordinates.lng.toFixed(4)}; this is not device GPS.`,
      simulatedSteps: [
        'A local demo incident record was created.',
        'No emergency service, authority, or contact was notified.',
        'Use locally verified emergency channels if this is a real emergency.',
      ],
      nearestHospital: { name: 'Unverified medical-support fixture', distanceKm: dest.safety.nearestHospitalKm, phone: 'No verified phone number in demo data' },
      nearestPolice: { station: 'Unverified local-assistance fixture', distanceKm: dest.safety.nearestPoliceKm, phone: 'No verified phone number in demo data' },
    };
  },

  async downloadOfflinePack(
    destinationId: string,
    trip?: { items: { day: number; time: string; title: string; notes: string }[] },
    contact?: { name: string; phone: string; relationship: string },
  ): Promise<OfflineTripPack> {
    await delay(250);
    const dest = SEED_DESTINATIONS.find((item) => item.id === destinationId) ?? SEED_DESTINATIONS[0];
    const hasContact = Boolean(contact?.name.trim() && contact.phone.trim());
    return {
      destinationName: dest.name,
      downloadedAt: new Date().toISOString(),
      itinerary: trip?.items ?? [],
      offlineCoordinates: dest.coordinates,
      mapDataNote: 'Coordinates only. No map tiles or live route data are bundled in demo mode.',
      realityLastSynced: null,
      emergencyContacts: hasContact ? [{
        role: contact?.relationship || 'Traveller contact',
        name: contact?.name ?? '',
        phone: contact?.phone ?? '',
        availability: 'User-entered; not verified',
        isVerifiedGov: false,
      }] : [],
      offlineMechanics: dest.mechanics,
      survivalNotes: [
        'Confirm current opening status, route access, and local conditions before departure.',
        'No live weather, crowd, transport, or emergency-service data is included.',
        hasContact ? 'A user-entered contact is saved in this browser; verify the details yourself.' : 'No personal emergency contact was added to this pack.',
      ],
      safeNodes: [dest.arrivalPoint.name],
      sizeKb: null,
    };
  },
};
