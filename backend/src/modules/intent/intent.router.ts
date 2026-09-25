import { Router } from 'express';
import { aiProvider } from '../../services/registry.js';
import { requireAuth, optionalAuth } from '../../lib/auth.js';
import { validate } from '../../lib/validation.js';
import { ok, fail } from '../../lib/response.js';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
export const intentRouter = Router();

const IntentSchema = z.object({
  rawText: z.string().min(3).max(1000),
  tripId: z.string().uuid().optional(),
});

/**
 * POST /api/v1/intent/extract
 * Extracts structured intent from natural language traveller query.
 * Used by onboarding + search flows.
 */
intentRouter.post('/extract', optionalAuth, validate(IntentSchema), async (req, res) => {
  try {
    const { rawText, tripId } = req.body;
    const intent = await aiProvider.extractIntent(rawText);

    // Persist if authenticated
    if (req.userId) {
      await prisma.travellerIntent.create({
        data: {
          userId: req.userId,
          tripId,
          rawText,
          normalizedIntent: intent as any,
          experienceTags: intent.experienceTags,
          constraints: intent.impliedConstraints as any,
        },
      });
    }

    res.json(ok(intent));
  } catch (err: any) {
    console.error('[intent:extract]', err.message);
    res.status(500).json(fail('INTERNAL_ERROR', 'Failed to extract intent.'));
  }
});

/**
 * GET /api/v1/intent/history
 * Returns past intents for the authenticated user.
 */
intentRouter.get('/history', requireAuth, async (req, res) => {
  try {
    const intents = await prisma.travellerIntent.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json(ok(intents));
  } catch {
    res.status(500).json(fail('INTERNAL_ERROR', 'Failed to fetch intent history.'));
  }
});
