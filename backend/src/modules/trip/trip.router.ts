import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../lib/auth.js';
import { prisma } from '../../lib/db.js';
import { fail, ok } from '../../lib/response.js';
import { validate } from '../../lib/validation.js';

export const tripRouter = Router();

const ItemSchema = z.object({
  id: z.string().optional(),
  day: z.number().int().min(1).max(30),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  title: z.string().trim().min(1).max(200),
  notes: z.string().max(1000),
});

const TripSchema = z.object({
  destinationId: z.string().min(2).max(200),
  origin: z.string().trim().min(2).max(200),
  travelDates: z.object({
    start: z.coerce.date(),
    end: z.coerce.date(),
  }),
  partySize: z.number().int().min(1).max(20),
  pace: z.enum(['RELAXED', 'BALANCED', 'FAST']),
  budget: z.enum(['VALUE', 'COMFORTABLE', 'FLEXIBLE']),
  transportPreference: z.string().max(50),
  items: z.array(ItemSchema).max(100),
});

function serializeTrip(trip: {
  id: string;
  destination: { slug: string; name: string } | null;
  origin: string;
  startDate: Date;
  endDate: Date;
  planningPreferences: unknown;
  itineraries: Array<{ version: number; items: Array<{ id: string; dayNumber: number; timeSlot: string | null; title: string; description: string | null }> }>;
  updatedAt: Date;
}) {
  const itinerary = trip.itineraries[0];
  return {
    id: trip.id,
    destinationId: trip.destination?.slug ?? '',
    destinationName: trip.destination?.name ?? 'Selected destination',
    origin: trip.origin,
    travelDates: {
      start: trip.startDate.toISOString().slice(0, 10),
      end: trip.endDate.toISOString().slice(0, 10),
    },
    partySize: typeof trip.planningPreferences === 'object' && trip.planningPreferences !== null && 'partySize' in trip.planningPreferences ? Number((trip.planningPreferences as { partySize?: number }).partySize) : 1,
    pace: typeof trip.planningPreferences === 'object' && trip.planningPreferences !== null && 'pace' in trip.planningPreferences ? (trip.planningPreferences as { pace: 'RELAXED' | 'BALANCED' | 'FAST' }).pace : 'BALANCED',
    budget: typeof trip.planningPreferences === 'object' && trip.planningPreferences !== null && 'budget' in trip.planningPreferences ? (trip.planningPreferences as { budget: 'VALUE' | 'COMFORTABLE' | 'FLEXIBLE' }).budget : 'COMFORTABLE',
    transportPreference: typeof trip.planningPreferences === 'object' && trip.planningPreferences !== null && 'transportPreference' in trip.planningPreferences ? String((trip.planningPreferences as { transportPreference?: string }).transportPreference) : 'mixed',
    version: itinerary?.version ?? 1,
    adaptationCount: 0,
    items: (itinerary?.items ?? []).map((item) => ({
      id: item.id,
      day: item.dayNumber,
      time: item.timeSlot ?? '09:00',
      title: item.title,
      notes: item.description ?? '',
    })),
    updatedAt: trip.updatedAt.toISOString(),
  };
}

const includeTrip = {
  destination: { select: { slug: true, name: true } },
  itineraries: {
    where: { isActive: true },
    orderBy: { version: 'desc' as const },
    take: 1,
    include: { items: { orderBy: { sortOrder: 'asc' as const } } },
  },
};

tripRouter.get('/', requireAuth, async (req, res) => {
  const trip = await prisma.trip.findFirst({
    where: { userId: req.userId!, status: { in: ['PLANNED', 'ACTIVE'] } },
    orderBy: { updatedAt: 'desc' },
    include: includeTrip,
  });
  res.json(ok(trip ? serializeTrip(trip) : null));
});

tripRouter.post('/', requireAuth, validate(TripSchema), async (req, res) => {
  const input = req.body as z.infer<typeof TripSchema>;
  const destination = await prisma.destination.findFirst({
    where: { OR: [{ slug: input.destinationId }, { name: input.destinationId }], isActive: true },
  });
  if (!destination) {
    res.status(404).json(fail('NOT_FOUND', 'The selected destination is not available.'));
    return;
  }

  const trip = await prisma.trip.create({
    data: {
      userId: req.userId!,
      destinationId: destination.id,
      origin: input.origin,
      destinationSummary: destination.description,
      startDate: input.travelDates.start,
      endDate: input.travelDates.end,
      planningPreferences: {
        partySize: input.partySize,
        pace: input.pace,
        budget: input.budget,
        transportPreference: input.transportPreference,
      },
      itineraries: {
        create: {
          items: {
            create: input.items.map((item, index) => ({
              dayNumber: item.day,
              timeSlot: item.time,
              title: item.title,
              description: item.notes,
              sortOrder: index,
            })),
          },
        },
      },
    },
    include: includeTrip,
  });
  res.status(201).json(ok(serializeTrip(trip)));
});

tripRouter.put('/:tripId', requireAuth, validate(TripSchema), async (req, res) => {
  const input = req.body as z.infer<typeof TripSchema>;
  const tripId = Array.isArray(req.params.tripId) ? req.params.tripId[0] : req.params.tripId;
  const existing = await prisma.trip.findFirst({ where: { id: tripId, userId: req.userId! } });
  if (!existing) {
    res.status(404).json(fail('NOT_FOUND', 'Trip not found.'));
    return;
  }
  const destination = await prisma.destination.findFirst({
    where: { OR: [{ slug: input.destinationId }, { name: input.destinationId }], isActive: true },
  });
  if (!destination) {
    res.status(404).json(fail('NOT_FOUND', 'The selected destination is not available.'));
    return;
  }

  const trip = await prisma.$transaction(async (tx) => {
    const active = await tx.itinerary.findFirst({ where: { tripId: existing.id, isActive: true }, orderBy: { version: 'desc' } });
    const nextVersion = (active?.version ?? 0) + 1;
    await tx.itinerary.updateMany({ where: { tripId: existing.id, isActive: true }, data: { isActive: false } });
    return tx.trip.update({
      where: { id: existing.id },
      data: {
        destinationId: destination.id,
        origin: input.origin,
        startDate: input.travelDates.start,
        endDate: input.travelDates.end,
        planningPreferences: {
          partySize: input.partySize,
          pace: input.pace,
          budget: input.budget,
          transportPreference: input.transportPreference,
        },
        itineraries: {
          create: {
            version: nextVersion,
            generatedBy: 'USER',
            parentId: active?.id,
            items: {
              create: input.items.map((item, index) => ({
                dayNumber: item.day,
                timeSlot: item.time,
                title: item.title,
                description: item.notes,
                sortOrder: index,
              })),
            },
          },
        },
      },
      include: includeTrip,
    });
  });
  res.json(ok(serializeTrip(trip)));
});
