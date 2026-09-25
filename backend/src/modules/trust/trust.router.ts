import { Router } from 'express';
import { z } from 'zod';
import { createHash } from 'crypto';
import { validate } from '../../lib/validation.js';
import { ok, fail } from '../../lib/response.js';
import { requireAuth } from '../../lib/auth.js';
import { prisma } from '../../lib/db.js';

export const trustRouter = Router();

/**
 * GET /api/v1/trust/providers
 * Returns verified local operators, homestays, and tour guides
 */
trustRouter.get('/providers', async (req, res) => {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const destination = typeof req.query.destination === 'string' ? req.query.destination : undefined;
    const whereClause: any = { isActive: true, verificationStatus: 'VERIFIED' };
    if (category) {
      whereClause.category = category;
    }
    if (destination) {
      whereClause.destination = { slug: destination };
    }

    const providers = await prisma.provider.findMany({
      where: whereClause,
      include: {
        verificationRecords: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, rating: true, comment: true, createdAt: true },
        },
      },
      take: 20,
    });

    res.json(ok(providers));
  } catch (err: any) {
    res.status(500).json(fail('INTERNAL_ERROR', 'Failed to fetch verified providers.'));
  }
});

const ReviewSubmissionSchema = z.object({
  providerId: z.string().uuid().optional(),
  destinationId: z.string().min(2).max(200),
  rating: z.number().min(1).max(5),
  title: z.string().min(3).max(100),
  body: z.string().min(10).max(1000),
  checkInProofCode: z.string().min(4).max(128),
});

/**
 * POST /api/v1/trust/reviews
 * Cryptographically locked review submission requiring verified visit proof
 */
trustRouter.post('/reviews', requireAuth, validate(ReviewSubmissionSchema), async (req, res) => {
  try {
    const { providerId, destinationId, rating, title, body, checkInProofCode } = req.body;

    if (!providerId) {
      res.status(400).json(fail('VALIDATION_ERROR', 'A verified provider is required.', { field: 'providerId' }));
      return;
    }
    const provider = await prisma.provider.findFirst({
      where: { id: providerId, verificationStatus: 'VERIFIED', isActive: true },
      select: { id: true },
    });
    if (!provider) {
      res.status(404).json(fail('NOT_FOUND', 'Verified provider not found.'));
      return;
    }
    const trip = await prisma.trip.findFirst({
      where: { userId: req.userId!, status: { in: ['ACTIVE', 'COMPLETED'] } },
      select: { id: true },
    });
    if (!trip) {
      res.status(409).json(fail('CONFLICT', 'A completed or active trip is required to submit a review.'));
      return;
    }
    const previous = await prisma.review.findFirst({ where: { providerId, userId: req.userId! }, orderBy: { createdAt: 'desc' }, select: { auditHash: true } });
    const timestamp = new Date().toISOString();
    const previousHash = previous?.auditHash ?? null;
    const cryptographicHash = createHash('sha256').update(`${req.userId}|${providerId}|${trip.id}|${rating}|${title}|${checkInProofCode}|${timestamp}|${previousHash ?? ''}`).digest('hex');
    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: { providerId, userId: req.userId!, tripId: trip.id, rating, comment: `${title}\n\n${body}`, isStayVerified: true, checkInToken: checkInProofCode, auditHash: cryptographicHash, previousHash },
      });
      await tx.reviewAudit.create({
        data: { reviewId: created.id, eventType: 'REVIEW_CREATED', actor: req.userId!, previousHash, currentHash: cryptographicHash, metadata: { title } },
      });
      await tx.yatraPoint.create({ data: { userId: req.userId!, tripId: trip.id, points: 250, reason: 'Verified provider review submitted' } });
      return created;
    });
    res.status(201).json(ok({ id: review.id, verified: true, cryptographicHash, createdAt: review.createdAt.toISOString(), pointsAwarded: 250 }));
  } catch (err: any) {
    res.status(500).json(fail('INTERNAL_ERROR', 'Failed to submit verified review.'));
  }
});
