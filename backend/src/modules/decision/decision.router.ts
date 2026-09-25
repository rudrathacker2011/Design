import { Router } from 'express';
import { DecisionService } from './decision.service.js';
import { optionalAuth } from '../../lib/auth.js';
import { validate, DecisionEvaluateSchema } from '../../lib/validation.js';
import { ok, fail } from '../../lib/response.js';
import { GeocodingProviderUnavailableError } from '../../services/geocoding/nominatim.adapter.js';

export const decisionRouter = Router();

/**
 * POST /api/v1/decisions/evaluate
 * 
 * Evaluates destination suitability for a traveller.
 * - Resolves destination coordinates via OpenStreetMap Nominatim
 * - Fetches live weather via Open-Meteo
 * - Computes suitability score, GO/MODIFY/ALTERNATIVE decision
 * - Persists decision record to Supabase if authenticated
 * 
 * Auth: Optional (authenticated users get decision persisted + profile context)
 */
decisionRouter.post('/evaluate', optionalAuth, validate(DecisionEvaluateSchema), async (req, res) => {
  try {
    const result = await DecisionService.evaluateDestination({
      ...req.body,
      userId: req.userId,
    });
    res.json(ok(result));
  } catch (err: any) {
    if (err instanceof GeocodingProviderUnavailableError) {
      res.status(503).json(fail('PROVIDER_UNAVAILABLE', 'Destination search is temporarily unavailable.', { retryable: true }));
      return;
    }
    if (err instanceof Error && err.message === 'DESTINATION_NOT_FOUND') {
      res.status(404).json(fail('NOT_FOUND', 'No destination match was found. Try a more specific name.'));
      return;
    }
    console.error('[decision:evaluate]', err instanceof Error ? err.message : err);
    res.status(500).json(fail('INTERNAL_ERROR', 'Failed to evaluate destination.'));
  }
});
