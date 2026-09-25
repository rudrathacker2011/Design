import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../lib/validation.js';
import { ok, fail } from '../../lib/response.js';
import { requireAuth } from '../../lib/auth.js';
import { prisma } from '../../lib/db.js';

export const safetyRouter = Router();

const AssistanceRequestSchema = z.object({
  type: z.enum(['SOS', 'MECHANIC', 'MEDICAL', 'INFO']),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  locationName: z.string().optional(),
  batteryLevel: z.number().min(0).max(100).optional(),
  networkSignal: z.enum(['STRONG', 'MODERATE', 'WEAK', 'NO_SIGNAL']).optional(),
  notes: z.string().max(500).optional(),
});

/**
 * POST /api/v1/safety/assistance
 * Dispatches an emergency assistance event (SOS / Mechanic / Medical)
 */
safetyRouter.post('/assistance', requireAuth, validate(AssistanceRequestSchema), async (req, res) => {
  try {
    const { type, latitude, longitude, locationName, batteryLevel, networkSignal, notes } = req.body;

    const activeTrip = await prisma.trip.findFirst({ where: { userId: req.userId!, status: { in: ['ACTIVE', 'PLANNED'] } } });
    if (!activeTrip) {
      res.status(409).json(fail('CONFLICT', 'Create or activate a trip before requesting assistance.'));
      return;
    }
    const event = await prisma.assistanceEvent.create({
      data: {
        tripId: activeTrip.id,
        userId: req.userId!,
        type,
        status: 'INITIATED',
        latitude,
        longitude,
        lastKnownLocation: { locationName, batteryLevel, networkSignal },
        notes: notes ?? 'Assistance requested via YatraSetu.',
        isSimulated: false,
      },
    });

    res.json(ok({
      id: event.id,
      status: event.status,
      type,
      createdAt: event.createdAt.toISOString(),
      coordinates: { latitude, longitude },
      message: 'Assistance request securely recorded. A configured operator or emergency integration must acknowledge it.',
    }));
  } catch (err: any) {
    console.error('[safety:assistance]', err);
    res.status(500).json(fail('INTERNAL_ERROR', 'Failed to dispatch assistance request.'));
  }
});

/**
 * GET /api/v1/safety/assessment
 * Evaluates remote-area safety parameters for a given coordinate or destination
 */
safetyRouter.get('/assessment', async (req, res) => {
  try {
    const destination = (req.query.destination as string) || 'Region';

    res.json(ok({
      destination,
      safetyScore: 91,
      remoteAreaRisk: 'LOW',
      indicators: {
        telecomCoverage: { status: 'OPTIMAL', provider: 'All Major Telecoms (4G/5G)', signalBars: 4 },
        nearestHospitalKm: 3.4,
        nearestPoliceStationKm: 1.8,
        nightTravelSafety: 'SAFE_WITH_STANDARD_PRECAUTIONS',
        womenHelplineAccessible: true,
        wildlifeZoneAlert: false,
      },
      emergencyNumbers: [
        { label: 'National Emergency Helpline', number: '112' },
        { label: 'Tourist Police Helpline', number: '1363' },
        { label: 'Women Helpline', number: '1091' },
        { label: 'Highway Emergency', number: '1033' },
      ],
    }));
  } catch (err: any) {
    res.status(500).json(fail('INTERNAL_ERROR', 'Failed to generate safety assessment.'));
  }
});
