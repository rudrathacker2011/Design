import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../lib/auth.js';
import { prisma } from '../../lib/db.js';
import { fail, ok } from '../../lib/response.js';
import { validate } from '../../lib/validation.js';

export const offlineRouter = Router();
offlineRouter.use(requireAuth);

const OfflinePackSchema = z.object({
  tripId: z.string().uuid(),
  emergencyData: z.object({
    name: z.string().trim().max(120),
    phone: z.string().trim().max(40),
    relationship: z.string().trim().max(80),
  }).optional(),
});

offlineRouter.post('/packs', validate(OfflinePackSchema), async (req, res) => {
  const userId = req.userId!;
  const trip = await prisma.trip.findFirst({
    where: { id: req.body.tripId, userId },
    include: {
      destination: { select: { id: true, name: true, latitude: true, longitude: true } },
      itineraries: {
        where: { isActive: true },
        orderBy: { version: 'desc' },
        take: 1,
        include: { items: { orderBy: [{ dayNumber: 'asc' }, { timeSlot: 'asc' }] } },
      },
    },
  });
  if (!trip) {
    res.status(404).json(fail('NOT_FOUND', 'Owned trip not found.'));
    return;
  }
  const destination = trip.destination;
  if (!destination) {
    res.status(422).json(fail('VALIDATION_ERROR', 'Offline packs require a resolved destination.'));
    return;
  }
  const itinerary = trip.itineraries[0];
  const emergencyData = req.body.emergencyData?.name && req.body.emergencyData?.phone
    ? { ...req.body.emergencyData, availability: 'Traveller-provided; not independently verified' }
    : null;
  const now = new Date();
  const pack = await prisma.offlinePack.upsert({
    where: { tripId: trip.id },
    create: {
      tripId: trip.id,
      version: 1,
      status: 'READY',
      lastSyncedAt: now,
      assetManifest: { mapTiles: false, routeData: false, generatedAt: now.toISOString() },
      itineraryData: itinerary ? { version: itinerary.version, items: itinerary.items } : { version: null, items: [] },
      providerData: { verifiedProvidersIncluded: false, note: 'Provider availability must be refreshed online.' },
      emergencyData,
      mapBounds: { latitude: destination.latitude, longitude: destination.longitude },
    },
    update: {
      version: { increment: 1 },
      status: 'READY',
      lastSyncedAt: now,
      assetManifest: { mapTiles: false, routeData: false, generatedAt: now.toISOString() },
      itineraryData: itinerary ? { version: itinerary.version, items: itinerary.items } : { version: null, items: [] },
      providerData: { verifiedProvidersIncluded: false, note: 'Provider availability must be refreshed online.' },
      emergencyData,
      mapBounds: { latitude: destination.latitude, longitude: destination.longitude },
    },
  });
  res.status(201).json(ok({
    id: pack.id,
    tripId: trip.id,
    destinationName: destination.name,
    downloadedAt: now.toISOString(),
    lastSyncedAt: now.toISOString(),
    itinerary: itinerary?.items.map((item) => ({
      day: item.dayNumber,
      time: item.timeSlot ?? '',
      title: item.title,
      notes: item.description ?? '',
    })) ?? [],
    offlineCoordinates: { lat: destination.latitude, lng: destination.longitude },
    mapDataNote: 'No map tiles or live route data are bundled. Refresh online before departure.',
    realityLastSynced: now.toISOString(),
    emergencyContacts: emergencyData ? [{
      role: emergencyData.relationship,
      name: emergencyData.name,
      phone: emergencyData.phone,
      availability: emergencyData.availability,
      isVerifiedGov: false,
    }] : [],
    offlineMechanics: [],
    survivalNotes: ['Verify route access, opening status, weather and emergency channels online before departure.'],
    safeNodes: [],
    sizeKb: null,
  }));
});

offlineRouter.get('/packs/:tripId', async (req, res) => {
  const pack = await prisma.offlinePack.findFirst({
    where: { tripId: req.params.tripId, trip: { userId: req.userId! } },
  });
  if (!pack) {
    res.status(404).json(fail('NOT_FOUND', 'Offline pack not found.'));
    return;
  }
  res.json(ok(pack));
});
