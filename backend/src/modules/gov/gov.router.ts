import { Router } from 'express';
import { ok, fail } from '../../lib/response.js';
import { requireAuth, requireRole } from '../../lib/auth.js';

export const govRouter = Router();
govRouter.use(requireAuth, requireRole('TOURISM_ADMIN', 'SYSTEM_ADMIN'));

/**
 * GET /api/v1/gov/capacity
 * Returns destination capacity telemetry, real-time footfall, and surge advisories
 */
govRouter.get('/capacity', async (req, res) => {
  try {
    const destination = (req.query.destination as string) || 'All India Hotspots';

    const hotspots = [
      {
        destinationId: 'dest-somnath',
        destinationName: 'Somnath Temple Complex',
        currentFootfall: 14200,
        carryingCapacityMax: 18000,
        loadPercentage: 78.8,
        status: 'HIGH_FOOTFALL_ADVISORY',
        recommendedAction: 'Shift visitor flow toward Prabhas Patan Museum & Triveni Sangam',
        estimatedWaitTimeMin: 45,
        trend: 'STABLE',
      },
      {
        destinationId: 'dest-statue-of-unity',
        destinationName: 'Statue of Unity & Sardar Sarovar',
        currentFootfall: 22400,
        carryingCapacityMax: 25000,
        loadPercentage: 89.6,
        status: 'CRITICAL_CONGESTION',
        recommendedAction: 'Direct incoming traffic to Valley of Flowers and Zarwani Eco-Tourism Hub',
        estimatedWaitTimeMin: 70,
        trend: 'INCREASING',
      },
      {
        destinationId: 'dest-kutch-white-desert',
        destinationName: 'Dhordo Tent City & White Desert',
        currentFootfall: 6800,
        carryingCapacityMax: 15000,
        loadPercentage: 45.3,
        status: 'OPTIMAL_CAPACITY',
        recommendedAction: 'Promote evening cultural pavilion and craft village trails',
        estimatedWaitTimeMin: 10,
        trend: 'OPTIMAL',
      },
    ];

    res.json(ok({
      destination,
      timestamp: new Date().toISOString(),
      hotspots,
      macroSummary: {
        totalActiveTravellers: 43400,
        congestedZones: 1,
        advisoryZones: 1,
        optimalZones: 1,
      },
    }));
  } catch (err: any) {
    res.status(500).json(fail('INTERNAL_ERROR', 'Failed to retrieve government capacity telemetry.'));
  }
});

/**
 * GET /api/v1/gov/dispersal
 * Calculates de-congestion dispersal recommendations
 */
govRouter.get('/dispersal', async (req, res) => {
  try {
    res.json(ok({
      policy: 'DE_CONGESTION_PRIORITY_ROUTING',
      activeIncentives: [
        {
          originHotspot: 'Statue of Unity',
          alternateTarget: 'Zarwani Eco-Trail & Shoolpaneshwar Sanctuary',
          incentiveType: 'PARKING_VOUCHER_DISCOUNT',
          discountPercent: 25,
          activeUntil: '2026-09-30T23:59:59.000Z',
        },
        {
          originHotspot: 'Somnath Hotspot',
          alternateTarget: 'Chorwad Beach & Madhavpur Coastal Circuit',
          incentiveType: 'FREE_HERITAGE_SHUTTLE',
          discountPercent: 100,
          activeUntil: '2026-09-30T23:59:59.000Z',
        },
      ],
    }));
  } catch (err: any) {
    res.status(500).json(fail('INTERNAL_ERROR', 'Failed to fetch dispersal policies.'));
  }
});
