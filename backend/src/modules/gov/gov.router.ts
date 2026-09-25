import { Router } from 'express';
import { ok, fail } from '../../lib/response.js';
import { requireAuth, requireRole } from '../../lib/auth.js';
import { prisma } from '../../lib/db.js';

export const govRouter = Router();
govRouter.use(requireAuth, requireRole('TOURISM_ADMIN', 'SYSTEM_ADMIN'));

govRouter.get('/monitor', async (_req, res) => {
  try {
    const [users, activeTrips, openAssistance, openServices, verifiedProviders, feedback, latestObservations] = await Promise.all([
      prisma.user.count(),
      prisma.trip.count({ where: { status: { in: ['PLANNED', 'ACTIVE'] } } }),
      prisma.assistanceEvent.count({ where: { status: { in: ['INITIATED', 'DISPATCHED', 'EN_ROUTE'] } } }),
      prisma.serviceRequest.count({ where: { status: { in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS'] } } }),
      prisma.provider.count({ where: { isActive: true, verificationStatus: 'VERIFIED' } }),
      prisma.feedback.count(),
      prisma.destinationObservation.findMany({
        orderBy: { collectedAt: 'desc' },
        take: 100,
        include: { destination: { select: { id: true, name: true } } },
      }),
    ]);

    const observations = latestObservations.map((observation) => ({
      id: observation.id,
      destinationId: observation.destinationId,
      destinationName: observation.destination.name,
      signalType: observation.signalType,
      value: observation.value,
      source: observation.source,
      confidence: observation.confidence,
      collectedAt: observation.collectedAt.toISOString(),
      expiresAt: observation.expiresAt?.toISOString() ?? null,
    }));

    res.json(ok({
      generatedAt: new Date().toISOString(),
      counts: { users, activeTrips, openAssistance, openServices, verifiedProviders, feedback },
      observations,
      providerConfiguration: {
        supabase: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
        database: Boolean(process.env.DATABASE_URL),
        ai: Boolean(process.env.GEMINI_API_KEY),
        maps: Boolean(process.env.GOOGLE_MAPS_API_KEY),
        weather: Boolean(process.env.WEATHER_API_KEY),
        redis: Boolean(process.env.REDIS_URL),
      },
    }));
  } catch (error) {
    console.error('[Gov Monitor]', error);
    res.status(503).json(fail('SERVICE_UNAVAILABLE', 'Government monitor data is temporarily unavailable.', { retryable: true }));
  }
});

/**
 * GET /api/v1/gov/capacity
 * Returns destination capacity telemetry, real-time footfall, and surge advisories
 */
govRouter.get('/capacity', async (req, res) => {
  try {
    const destination = typeof req.query.destination === 'string' ? req.query.destination : undefined;
    const observations = await prisma.destinationObservation.findMany({
      where: {
        signalType: 'CROWD',
        ...(destination ? { destination: { name: { contains: destination, mode: 'insensitive' } } } : {}),
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { collectedAt: 'desc' },
      take: 100,
      include: { destination: { select: { id: true, name: true } } },
    });
    if (!observations.length) {
      res.status(503).json(fail('PROVIDER_UNAVAILABLE', 'No current crowd-capacity observations are available.', { retryable: true }));
      return;
    }
    const hotspots = observations.map((observation) => {
      const value = observation.value && typeof observation.value === 'object' ? observation.value as Record<string, unknown> : {};
      const currentFootfall = typeof value.currentFootfall === 'number' ? value.currentFootfall : null;
      const carryingCapacityMax = typeof value.carryingCapacityMax === 'number' ? value.carryingCapacityMax : null;
      const loadPercentage = currentFootfall !== null && carryingCapacityMax ? (currentFootfall / carryingCapacityMax) * 100 : null;
      return {
        destinationId: observation.destinationId,
        destinationName: observation.destination.name,
        currentFootfall,
        carryingCapacityMax,
        loadPercentage,
        status: typeof value.status === 'string' ? value.status : 'OBSERVATION_AVAILABLE',
        recommendedAction: typeof value.recommendedAction === 'string' ? value.recommendedAction : null,
        estimatedWaitTimeMin: typeof value.estimatedWaitTimeMin === 'number' ? value.estimatedWaitTimeMin : null,
        trend: typeof value.trend === 'string' ? value.trend : null,
        collectedAt: observation.collectedAt.toISOString(),
        source: observation.source,
      };
    });
    res.json(ok({ destination: destination ?? 'All configured destinations', timestamp: new Date().toISOString(), hotspots }));
  } catch (error) {
    console.error('[Gov Capacity]', error);
    res.status(503).json(fail('SERVICE_UNAVAILABLE', 'Failed to retrieve government capacity telemetry.', { retryable: true }));
  }
});

/**
 * GET /api/v1/gov/dispersal
 * Calculates de-congestion dispersal recommendations
 */
govRouter.get('/dispersal', async (req, res) => {
  try {
    const alternatives = await prisma.destinationAlternative.findMany({
      where: { isActive: true },
      take: 100,
      include: {
        source: { select: { id: true, name: true } },
        target: { select: { id: true, name: true } },
      },
      orderBy: { experienceSimilarity: 'desc' },
    });
    if (!alternatives.length) {
      res.status(503).json(fail('PROVIDER_UNAVAILABLE', 'No configured dispersal alternatives are available.', { retryable: true }));
      return;
    }
    res.json(ok({
      policy: 'DE_CONGESTION_PRIORITY_ROUTING',
      activeIncentives: alternatives.map((alternative) => ({
        originHotspot: alternative.source.name,
        alternateTarget: alternative.target.name,
        relationshipType: alternative.relationshipType,
        experienceSimilarity: alternative.experienceSimilarity,
      })),
    }));
  } catch (error) {
    console.error('[Gov Dispersal]', error);
    res.status(503).json(fail('SERVICE_UNAVAILABLE', 'Failed to fetch dispersal policies.', { retryable: true }));
  }
});
