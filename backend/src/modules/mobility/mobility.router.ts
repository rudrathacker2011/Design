import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../lib/validation.js';
import { ok, fail } from '../../lib/response.js';
import { prisma } from '../../lib/db.js';
import { geocodingProvider } from '../../services/registry.js';

export const mobilityRouter = Router();

export interface ArrivalPoint {
  id: string;
  name: string;
  type: 'AIRPORT' | 'RAILWAY_STATION' | 'BUS_TERMINAL';
  distanceKm: number;
  travelTimeMin: number;
  facilities: {
    hasPrepaidTaxi: boolean;
    hasWheelchairAccess: boolean;
    hasRestrooms: boolean;
    hasTransitHub: boolean;
  };
  recommendationScore: number;
  suitabilityReason: string;
}

export interface RouteOption {
  id: string;
  mode: 'TAXI' | 'SELF_DRIVE';
  title: string;
  durationHours: number;
  distanceKm: number;
  estimatedCostInr: { min: number; max: number } | null;
  comfortLevel: 'HIGH' | 'MEDIUM' | 'ECONOMY';
  frequency: string;
  carbonKg: number;
  segments: {
    from: string;
    to: string;
    carrier?: string;
    duration: string;
  }[];
}

const MobilityQuerySchema = z.object({
  origin: z.string().min(2).max(100),
  destination: z.string().min(2).max(100),
  travelPace: z.enum(['RELAXED', 'BALANCED', 'FAST']).optional(),
  accessibilityNeeds: z.boolean().optional(),
});

/**
 * GET /api/v1/mobility/routes
 * Calculates keyless OpenStreetMap/OSRM driving routes between Indian origin and destination.
 */
mobilityRouter.get('/routes', async (req, res) => {
  try {
    const parseResult = MobilityQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json(fail('VALIDATION_ERROR', 'Invalid mobility query parameters.'));
    }
    const { origin, destination, travelPace, accessibilityNeeds } = parseResult.data;

    const [originPlace] = await geocodingProvider.searchPlaces(origin);
    const [destinationPlace] = await geocodingProvider.searchPlaces(destination);
    if (!originPlace || !destinationPlace) {
      res.status(404).json(fail('NOT_FOUND', 'The free OpenStreetMap geocoder could not resolve the origin or destination.'));
      return;
    }

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originPlace.longitude},${originPlace.latitude};${destinationPlace.longitude},${destinationPlace.latitude}?overview=false&alternatives=true&steps=false`;
    const osrmResponse = await fetch(osrmUrl, {
      headers: { 'User-Agent': 'YatraSetu-Tourism-Intelligence/1.0 (contact@yatrasetu.in)' },
      signal: AbortSignal.timeout(12000),
    });
    if (!osrmResponse.ok) {
      res.status(503).json(fail('PROVIDER_UNAVAILABLE', 'OpenStreetMap routing is temporarily unavailable.', { retryable: true }));
      return;
    }
    const osrm = await osrmResponse.json() as {
      code?: string;
      routes?: Array<{ distance: number; duration: number }>;
    };
    if (osrm.code !== 'Ok' || !osrm.routes?.length) {
      res.status(503).json(fail('PROVIDER_UNAVAILABLE', 'No drivable route was found by the free routing provider.', { retryable: true }));
      return;
    }
    const routes: RouteOption[] = osrm.routes.slice(0, 2).flatMap((route, index) => {
      const durationHours = route.duration / 3600;
      const distanceKm = route.distance / 1000;
      const segment = {
        from: originPlace.name,
        to: destinationPlace.name,
        carrier: 'OpenStreetMap / OSRM',
        duration: `${Math.round(route.duration / 60)} min`,
      };
      const base = {
        durationHours,
        distanceKm,
        estimatedCostInr: null,
        frequency: 'Route estimate; availability and fare require a transport operator',
        carbonKg: Math.round(distanceKm * 0.17 * 10) / 10,
        segments: [segment],
      };
      return [
        { ...base, id: `osm-self-drive-${index + 1}`, mode: 'SELF_DRIVE' as const, title: `Open route from ${originPlace.name} to ${destinationPlace.name}`, comfortLevel: accessibilityNeeds ? 'MEDIUM' as const : 'HIGH' as const },
        { ...base, id: `osm-taxi-${index + 1}`, mode: 'TAXI' as const, title: `Taxi route from ${originPlace.name} to ${destinationPlace.name}`, comfortLevel: 'HIGH' as const },
      ];
    });

    res.json(ok({
      origin,
      destination,
      travelPace: travelPace ?? 'BALANCED',
      provider: 'OpenStreetMap / OSRM',
      routes,
    }));
  } catch (error) {
    console.error('[Mobility Routes]', error);
    res.status(503).json(fail('PROVIDER_UNAVAILABLE', 'Free map routing is temporarily unavailable.', { retryable: true }));
  }
});

/**
 * GET /api/v1/mobility/arrival-points
 * Evaluates Smart Arrival Points for last-mile connectivity
 */
mobilityRouter.get('/arrival-points', async (req, res) => {
  try {
    const destination = typeof req.query.destination === 'string' ? req.query.destination : '';
    const destinationRecord = await prisma.destination.findFirst({
      where: { OR: [{ slug: destination }, { name: destination }], isActive: true },
      include: { arrivalPoints: { where: { isActive: true }, orderBy: { overallRank: 'asc' } } },
    });
    if (!destinationRecord) {
      res.status(404).json(fail('NOT_FOUND', 'Destination or arrival points not found.'));
      return;
    }
    const arrivalPoints: ArrivalPoint[] = destinationRecord.arrivalPoints.map((point) => ({
      id: point.id,
      name: point.name,
      type: 'RAILWAY_STATION',
      distanceKm: point.distanceToDestinationKm ?? 0,
      travelTimeMin: point.walkingMinutesToDest ?? 0,
      facilities: {
        hasPrepaidTaxi: point.facilities.some((item) => item.toLowerCase().includes('taxi')),
        hasWheelchairAccess: point.accessibilityScore >= 70,
        hasRestrooms: point.facilities.some((item) => item.toLowerCase().includes('restroom')),
        hasTransitHub: point.facilities.some((item) => item.toLowerCase().includes('transit')),
      },
      recommendationScore: point.overallRank,
      suitabilityReason: point.facilities.join(', ') || 'No facility details have been recorded.',
    }));

    res.json(ok({ destination, arrivalPoints }));
  } catch (err: any) {
    res.status(500).json(fail('INTERNAL_ERROR', 'Failed to fetch arrival points.'));
  }
});
